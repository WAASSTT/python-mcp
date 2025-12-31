#!/bin/bash
# AI 语音助手 - 统一服务管理脚本
# 支持启动、停止、重启、状态查看等所有功能

set -e

# ============================================
# 配置区域
# ============================================

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# 路径配置
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs"
readonly PID_DIR="${PROJECT_ROOT}/pids"

# 端口配置
readonly POSTGRES_PORT=5432
readonly REDIS_PORT=6379
readonly MANAGER_API_PORT=30002
readonly PYTHON_SERVER_PORT=30000
readonly PYTHON_HTTP_PORT=30003
readonly CLIENT_PORT=30001

# 数据库配置
readonly POSTGRES_USER="postgres"
readonly POSTGRES_PASSWORD="I%YP@sf9"
readonly POSTGRES_DB="xiaozhi"
readonly REDIS_PASSWORD="cz%2Hz3B"

# 初始化目录
mkdir -p "${LOG_DIR}" "${PID_DIR}"

# ============================================
# 工具函数
# ============================================

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# 检查命令是否存在
check_command() {
    command -v "$1" &> /dev/null
}

# 检查端口是否被占用
check_port() {
    nc -z localhost "$1" 2>/dev/null || lsof -Pi ":$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

# 检查并显示端口占用详情
check_port_detail() {
    local port=$1
    if check_port "$port"; then
        print_warning "端口 $port 被占用"
        echo "占用详情："
        lsof -i:"$port" 2>/dev/null || netstat -tlnp 2>/dev/null | grep ":$port"
        return 0
    else
        print_success "端口 $port 空闲"
        return 1
    fi
}

# 检查 HTTP 健康状态
check_health() {
    curl -sf "$1" >/dev/null 2>&1
}

# 获取 Docker 容器运行时间
get_docker_uptime() {
    docker ps --filter "name=$1" --format "{{.Status}}" 2>/dev/null | sed 's/Up //'
}

# 强制释放端口
force_free_port() {
    local port=$1
    local retry=0
    local max_retries=3

    while check_port "$port" && [ $retry -lt $max_retries ]; do
        print_info "释放端口 $port (尝试 $((retry + 1))/$max_retries)"

        # 查找占用端口的进程
        local pids=$(lsof -ti:"$port" 2>/dev/null)
        if [ -n "$pids" ]; then
            local pid_count=$(echo "$pids" | wc -w)
            print_info "找到 $pid_count 个进程占用端口 $port"
            echo "进程列表: $pids"

            # 先尝试优雅终止
            echo "$pids" | xargs kill 2>/dev/null || true
            sleep 1

            # 强制终止仍在运行的进程
            for pid in $pids; do
                if ps -p "$pid" > /dev/null 2>&1; then
                    print_info "强制终止进程 $pid"

                    # 检查是否为 snap 包进程
                    if cat /proc/$pid/attr/current 2>/dev/null | grep -q "snap"; then
                        print_info "检测到 snap 包进程，使用 systemd-run..."
                        sudo systemd-run --no-ask-password kill -9 "$pid" 2>/dev/null || true
                    else
                        if ! kill -9 "$pid" 2>/dev/null; then
                            print_warning "需要 sudo 权限终止进程 $pid"
                            sudo kill -9 "$pid" 2>/dev/null || true
                        fi
                    fi
                fi
            done
        else
            print_warning "lsof 未找到占用端口 $port 的进程，尝试其他方法"
            # 使用 fuser 作为备用方案
            fuser -k "$port/tcp" 2>/dev/null || true
            # 如果还是失败，尝试 sudo fuser
            if check_port "$port"; then
                sudo fuser -k "$port/tcp" 2>/dev/null || true
            fi
        fi

        sleep 2
        ((retry++))
    done

    # 最终检查
    if check_port "$port"; then
        print_error "无法释放端口 $port，可能需要手动检查"
        print_info "运行: lsof -i:$port 查看占用情况"
        return 1
    else
        print_success "端口 $port 已成功释放"
        return 0
    fi
}

# 等待端口就绪
wait_for_port() {
    local host=$1 port=$2 timeout=${3:-30} elapsed=0

    while ! nc -z "$host" "$port" 2>/dev/null; do
        sleep 1
        ((elapsed++))
        [ $elapsed -ge $timeout ] && { print_error "等待 $host:$port 超时"; return 1; }
    done
    print_success "$host:$port 已就绪"
}

# 等待进程启动并监听端口
wait_for_service() {
    local pid=$1 port=$2 name=$3 timeout=${4:-15}
    local elapsed=0

    while ! check_port "$port" && [ $elapsed -lt $timeout ]; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            print_error "$name 进程意外退出"
            return 1
        fi
        sleep 1
        ((elapsed++))
    done

    check_port "$port" && print_success "$name 已就绪 (PID: $pid, 端口: $port)"
}

# ============================================
# 启动服务函数
# ============================================

# 启动 Docker 容器（通用函数）
start_docker_container() {
    local container_name=$1
    local image=$2
    shift 2
    local args=("$@")

    # 容器正在运行
    if docker ps --filter "name=$container_name" --filter "status=running" -q | grep -q .; then
        print_success "$container_name 已在运行"
        return 0
    fi

    # 启动已存在的容器
    if docker ps -a --filter "name=$container_name" -q | grep -q .; then
        print_info "启动已有的 $container_name 容器"
        docker start "$container_name" && sleep 2 && return 0
    fi

    # 创建新容器
    print_info "创建新的 $container_name 容器"
    docker run -d --name "$container_name" "${args[@]}" "$image"
}

start_postgres() {
    print_info "启动 PostgreSQL..."

    start_docker_container "postgres" "postgres:latest" \
        --restart always \
        -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -e POSTGRES_USER="$POSTGRES_USER" \
        -e POSTGRES_DB="$POSTGRES_DB" \
        -p "$POSTGRES_PORT:5432" \
        -v postgres_data:/var/lib/postgresql/data \
    && wait_for_port localhost "$POSTGRES_PORT" 30
}

start_redis() {
    print_info "启动 Redis..."

    start_docker_container "my-redis" "redis:latest" \
        -p "$REDIS_PORT:6379" \
        redis-server --requirepass "$REDIS_PASSWORD" \
    && wait_for_port localhost "$REDIS_PORT" 20
}

start_manager_api() {
    print_info "启动 Manager API..."

    cd "${PROJECT_ROOT}/manager-api-elysia"

    # 先彻底清理所有 bun 进程（防止多个实例）
    print_info "清理所有旧的 bun 进程..."
    local bun_pids=$(pgrep -f "bun" 2>/dev/null)
    if [ -n "$bun_pids" ]; then
        print_warning "发现 $(echo "$bun_pids" | wc -w) 个 bun 进程，正在清理..."
        if ! pkill -9 bun 2>/dev/null; then
            print_warning "需要 sudo 权限清理 bun 进程"
            sudo pkill -9 bun 2>/dev/null || true
        fi
        sleep 2
    fi

    # 清理 PID 文件中记录的进程
    if [ -f "${PID_DIR}/manager-api.pid" ]; then
        local old_pid=$(cat "${PID_DIR}/manager-api.pid")
        if ps -p "$old_pid" > /dev/null 2>&1; then
            kill -9 "$old_pid" 2>/dev/null || true
        fi
        rm -f "${PID_DIR}/manager-api.pid"
    fi

    # 再次确认端口释放
    if check_port "$MANAGER_API_PORT"; then
        print_warning "Manager API 端口 $MANAGER_API_PORT 仍被占用"

        # 显示详细占用信息
        print_info "端口占用详情:"
        lsof -i:"$MANAGER_API_PORT" 2>/dev/null || true

        # 强制释放端口
        if ! force_free_port "$MANAGER_API_PORT"; then
            print_error "无法启动 Manager API：端口被占用且无法释放"
            print_error "请手动执行: pkill -9 bun 或 lsof -ti:$MANAGER_API_PORT | xargs kill -9"
            return 1
        fi
        bun install
    fi

    # 数据库迁移
    if [ -d "drizzle" ] && [ -f "drizzle.config.ts" ]; then
        print_info "同步数据库 Schema..."
        bun drizzle-kit push 2>/dev/null || true
    fi

    # 启动服务
    nohup bun run start > "${LOG_DIR}/manager-api.log" 2>&1 &
    local pid=$!
    echo "$pid" > "${PID_DIR}/manager-api.pid"

    # 等待服务就绪
    if wait_for_service "$pid" "$MANAGER_API_PORT" "Manager API" 15; then
        print_success "Manager API 启动成功 (http://localhost:$MANAGER_API_PORT)"
        print_info "API 文档: http://localhost:$MANAGER_API_PORT/doc"
        return 0
    else
        print_error "Manager API 启动失败，最后 20 行日志:"
        tail -20 "${LOG_DIR}/manager-api.log"
        return 1
    fi
}

start_python_server() {
    print_info "启动 Python AI Server..."

    if check_port "$PYTHON_SERVER_PORT"; then
        print_warning "Python Server 端口 $PYTHON_SERVER_PORT 已被占用"
        pkill -f "python.*app.py" 2>/dev/null || true
        sleep 2
    fi

    cd "${PROJECT_ROOT}/server"

    # 创建虚拟环境
    if [ ! -d "venv" ]; then
        print_info "创建 Python 虚拟环境..."
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    # 更新配置
    if [ -f "config.yaml" ]; then
        sed -i.bak \
            -e "s/port: [0-9]*/port: $PYTHON_SERVER_PORT/g" \
            -e "s/http_port: [0-9]*/http_port: $PYTHON_HTTP_PORT/g" \
            config.yaml
    fi

    # 启动服务
    nohup python app.py > "${LOG_DIR}/python-server.log" 2>&1 &
    local pid=$!
    echo "$pid" > "${PID_DIR}/python-server.pid"
    deactivate

    # 等待服务就绪
    sleep 5
    if check_port "$PYTHON_SERVER_PORT"; then
        print_success "Python AI Server 启动成功"
        print_info "WebSocket: ws://localhost:$PYTHON_SERVER_PORT"
        print_info "HTTP API: http://localhost:$PYTHON_HTTP_PORT"
        return 0
    else
        print_error "Python Server 启动失败，查看日志: ${LOG_DIR}/python-server.log"
        return 1
    fi
}

start_client() {
    print_info "启动前端应用..."

    if check_port "$CLIENT_PORT"; then
        print_warning "前端应用端口 $CLIENT_PORT 已被占用"
        pkill -f "vue-cli-service" 2>/dev/null || true
        sleep 2
    fi

    cd "${PROJECT_ROOT}/client"

    # 安装依赖
    if [ ! -d "node_modules" ]; then
        print_info "安装前端依赖..."
        if check_command pnpm; then
            pnpm install
        else
            npm install
        fi
    fi

    # 更新配置
    if [ -f "vue.config.js" ]; then
        sed -i.bak "s/port: [0-9]*/port: $CLIENT_PORT/g" vue.config.js
    fi

    # 启动服务
    if check_command pnpm; then
        nohup pnpm serve > "${LOG_DIR}/client.log" 2>&1 &
    else
        nohup npm run serve > "${LOG_DIR}/client.log" 2>&1 &
    fi
    local pid=$!
    echo "$pid" > "${PID_DIR}/client.pid"

    # 等待服务就绪
    sleep 8
    if check_port "$CLIENT_PORT"; then
        print_success "前端应用启动成功 (http://localhost:$CLIENT_PORT)"
        return 0
    else
        print_error "前端启动失败，查看日志: ${LOG_DIR}/client.log"
        return 1
    fi
}

# ============================================
# 停止服务函数
# ============================================

stop_service() {
    local service_name=$1
    local pid_file="${PID_DIR}/${service_name}.pid"
    local process_pattern=$2

    print_info "停止 $service_name..."

    # 先尝试从 PID 文件停止
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_info "终止进程 (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1

            # 如果进程还在运行，强制终止
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
        fi
        rm -f "$pid_file"
    fi

    # 清理可能残留的进程（通过进程模式匹配）
    if [ -n "$process_pattern" ]; then
        local remaining_pids=$(pgrep -f "$process_pattern" 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            print_info "清理残留进程..."
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
        fi
    fi

    print_success "$service_name 已停止"
}

stop_postgres() {
    print_info "停止 PostgreSQL..."
    if docker ps --format '{{.Names}}' | grep -q "^postgres$"; then
        docker stop postgres
        print_success "PostgreSQL 已停止"
    else
        print_warning "PostgreSQL 未运行"
    fi
}

stop_redis() {
    print_info "停止 Redis..."
    if docker ps --format '{{.Names}}' | grep -q "^my-redis$"; then
        docker stop my-redis
        print_success "Redis 已停止"
    else
        print_warning "Redis 未运行"
    fi
}

stop_manager_api() {
    print_info "停止 manager-api..."

    # 停止 PID 文件中的进程
    local pid_file="${PID_DIR}/manager-api.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_info "终止进程 (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 2

            # 如果进程还在运行，强制终止
            if ps -p "$pid" > /dev/null 2>&1; then
                print_warning "进程未响应，强制终止..."
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
        fi
        rm -f "$pid_file"
    fi

    # 清理所有可能残留的 bun 进程（在 manager-api-elysia 目录中运行的）
    print_info "清理残留进程..."
    local remaining_pids=$(pgrep -f "bun.*server.ts" 2>/dev/null)
    if [ -z "$remaining_pids" ]; then
        remaining_pids=$(pgrep -f "bun run start" 2>/dev/null)
    fi
    if [ -z "$remaining_pids" ]; then
        # 最后尝试：查找所有监听 30002 端口的进程
        remaining_pids=$(lsof -ti:"$MANAGER_API_PORT" 2>/dev/null)
    fi

    if [ -n "$remaining_pids" ]; then
        print_info "发现残留进程: $remaining_pids"

        # 检查进程是否为 snap 包进程（受 AppArmor 保护）
        local is_snap=false
        for pid in $remaining_pids; do
            if cat /proc/$pid/attr/current 2>/dev/null | grep -q "snap"; then
                is_snap=true
                print_info "检测到 snap 包进程 (PID: $pid)"
                break
            fi
        done

        if [ "$is_snap" = true ]; then
            # Snap 包进程受 AppArmor 保护，使用 systemd-run 绕过限制
            print_info "使用 systemd-run 清理受保护的进程..."
            for pid in $remaining_pids; do
                sudo systemd-run --no-ask-password kill -9 "$pid" 2>/dev/null || true
            done
        else
            # 先尝试普通 kill
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || {
                # 如果失败，尝试 sudo kill（可能是权限问题）
                print_warning "需要 sudo 权限清理残留进程"
                echo "$remaining_pids" | xargs sudo kill -9 2>/dev/null || true
            }
        fi
        sleep 1
    fi

    # 验证端口已释放
    if check_port "$MANAGER_API_PORT"; then
        print_warning "端口 $MANAGER_API_PORT 仍被占用，强制清理..."
        force_free_port "$MANAGER_API_PORT" || true
    fi

    print_success "manager-api 已停止"
}

stop_python_server() {
    stop_service "python-server" "python.*app.py"
}

stop_client() {
    stop_service "client" "vue-cli-service"
}

# ============================================
# 重启服务函数
# ============================================

restart_postgres() {
    stop_postgres
    sleep 2
    start_postgres
}

restart_redis() {
    stop_redis
    sleep 2
    start_redis
}

restart_manager_api() {
    stop_manager_api
    sleep 2
    start_manager_api
}

restart_python_server() {
    stop_python_server
    sleep 2
    start_python_server
}

restart_client() {
    stop_client
    sleep 2
    start_client
}

# ============================================
# 状态查看函数
# ============================================

show_status() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       服务状态检查                     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    # 数据库服务
    echo -e "${BLUE}数据库服务:${NC}\n"

    # PostgreSQL
    if check_port "$POSTGRES_PORT"; then
        printf "  ${GREEN}✓${NC} %-15s : 运行中 (端口 %s)\n" "PostgreSQL" "$POSTGRES_PORT"
        local uptime=$(get_docker_uptime "postgres")
        [ -n "$uptime" ] && printf "  %17s   运行时间: %s\n" "" "$uptime"
    else
        printf "  ${RED}✗${NC} %-15s : 未运行\n" "PostgreSQL"
    fi

    # Redis
    if check_port "$REDIS_PORT"; then
        printf "  ${GREEN}✓${NC} %-15s : 运行中 (端口 %s)\n" "Redis" "$REDIS_PORT"
        local uptime=$(get_docker_uptime "my-redis")
        [ -n "$uptime" ] && printf "  %17s   运行时间: %s\n" "" "$uptime"
    else
        printf "  ${RED}✗${NC} %-15s : 未运行\n" "Redis"
    fi

    # 应用服务
    echo -e "\n${BLUE}应用服务:${NC}\n"

    # Manager API
    if check_port "$MANAGER_API_PORT"; then
        printf "  ${GREEN}✓${NC} %-15s : 运行中 (端口 %s)\n" "Manager API" "$MANAGER_API_PORT"
        printf "  %17s   URL: http://localhost:%s\n" "" "$MANAGER_API_PORT"
        printf "  %17s   文档: http://localhost:%s/doc\n" "" "$MANAGER_API_PORT"
        if check_health "http://localhost:$MANAGER_API_PORT/health"; then
            printf "  %17s   健康检查: ${GREEN}✓ 正常${NC}\n" ""
        else
            printf "  %17s   健康检查: ${YELLOW}? 未知${NC}\n" ""
        fi
    else
        printf "  ${RED}✗${NC} %-15s : 未运行\n" "Manager API"
    fi

    # Python Server
    if check_port "$PYTHON_SERVER_PORT"; then
        printf "  ${GREEN}✓${NC} %-15s : 运行中 (端口 %s)\n" "Python Server" "$PYTHON_SERVER_PORT"
        printf "  %17s   WebSocket: ws://localhost:%s\n" "" "$PYTHON_SERVER_PORT"
        printf "  %17s   HTTP API: http://localhost:%s\n" "" "$PYTHON_HTTP_PORT"
    else
        printf "  ${RED}✗${NC} %-15s : 未运行\n" "Python Server"
    fi

    # 前端应用
    if check_port "$CLIENT_PORT"; then
        printf "  ${GREEN}✓${NC} %-15s : 运行中 (端口 %s)\n" "前端应用" "$CLIENT_PORT"
        printf "  %17s   URL: http://localhost:%s\n" "" "$CLIENT_PORT"
    else
        printf "  ${RED}✗${NC} %-15s : 未运行\n" "前端应用"
    fi

    # 进程信息
    echo -e "\n${BLUE}进程信息:${NC}\n"

    local has_process=false

    # Manager API (Bun)
    if pgrep -f "bun.*server.ts" >/dev/null; then
        echo -e "  ${GREEN}✓${NC} Bun (Manager API)"
        ps aux | grep "bun.*server.ts" | grep -v grep | awk '{printf "    PID: %-8s CPU: %-6s MEM: %-6s\n", $2, $3"%", $4"%"}'
        has_process=true
    fi

    # Python Server
    if pgrep -f "python.*app.py" >/dev/null; then
        echo -e "  ${GREEN}✓${NC} Python (Server)"
        ps aux | grep "python.*app.py" | grep -v grep | awk '{printf "    PID: %-8s CPU: %-6s MEM: %-6s\n", $2, $3"%", $4"%"}'
        has_process=true
    fi

    # Vue.js 前端
    if pgrep -f "vue-cli-service" >/dev/null; then
        echo -e "  ${GREEN}✓${NC} Node (Vue CLI)"
        ps aux | grep "vue-cli-service" | grep -v grep | head -1 | awk '{printf "    PID: %-8s CPU: %-6s MEM: %-6s\n", $2, $3"%", $4"%"}'
        has_process=true
    fi

    $has_process || echo "  无应用进程运行"

    # Docker 容器
    echo -e "\n${BLUE}Docker 容器:${NC}\n"

    if docker ps --filter "name=postgres" --filter "name=redis" --format "{{.Names}}" 2>/dev/null | grep -q .; then
        docker ps --filter "name=postgres" --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | sed 's/^/  /'
    else
        echo "  无相关 Docker 容器运行"
    fi

    echo ""
}

# ============================================
# 查看日志函数
# ============================================

show_logs() {
    local service=$1
    local lines=${2:-50}

    case "$service" in
        manager-api|python-server|client)
            local log_file="${LOG_DIR}/${service}.log"
            if [ -f "$log_file" ]; then
                echo -e "${BLUE}最后 $lines 行日志 ($service):${NC}\n"
                tail -n "$lines" "$log_file"
            else
                print_error "日志文件不存在: $log_file"
            fi
            ;;
        *)
            print_error "未知的服务: $service"
            echo "可用服务: manager-api, python-server, client"
            ;;
    esac
}

# ============================================
# 帮助信息
# ============================================

show_usage() {
    cat << EOF
${BLUE}╔════════════════════════════════════════╗
║   AI 语音助手 - 统一服务管理工具       ║
╚════════════════════════════════════════╝${NC}

${GREEN}用法:${NC} ./service.sh [命令] [服务] [选项]

${GREEN}命令:${NC}
  start      启动服务
  stop       停止服务
  restart    重启服务
  status     查看服务状态
  logs       查看服务日志

${GREEN}服务:${NC}
  postgres        PostgreSQL 数据库
  redis           Redis 缓存
  manager-api     Manager API 服务
  python-server   Python AI Server
  client          前端应用
  all             所有服务

${GREEN}示例:${NC}
  ./service.sh start all              # 启动所有服务
  ./service.sh stop all               # 停止所有服务
  ./service.sh restart manager-api    # 重启 Manager API
  ./service.sh status                 # 查看所有服务状态
  ./service.sh logs manager-api       # 查看 Manager API 日志
  ./service.sh logs client 100        # 查看前端最后 100 行日志

${GREEN}快捷命令:${NC}
  ./service.sh                        # 查看服务状态（默认）
  ./service.sh start                  # 启动所有服务

${GREEN}日志文件:${NC}
  ${LOG_DIR}/manager-api.log
  ${LOG_DIR}/python-server.log
  ${LOG_DIR}/client.log

EOF
}

# ============================================
# 交互式菜单
# ============================================

show_interactive_menu() {
    while true; do
        clear
        echo -e "${BLUE}"
        echo "╔════════════════════════════════════════╗"
        echo "║   AI 语音助手 - 服务管理工具           ║"
        echo "╚════════════════════════════════════════╝"
        echo -e "${NC}\n"

        echo -e "${GREEN}请选择操作:${NC}\n"
        echo "  1) 启动所有服务"
        echo "  2) 停止所有服务"
        echo "  3) 重启所有服务"
        echo "  4) 查看服务状态"
        echo ""
        echo "  5) 启动 PostgreSQL"
        echo "  6) 启动 Redis"
        echo "  7) 启动 Manager API"
        echo "  8) 启动 Python Server"
        echo "  9) 启动前端应用"
        echo ""
        echo "  10) 停止 Manager API"
        echo "  11) 停止 Python Server"
        echo "  12) 停止前端应用"
        echo ""
        echo "  13) 重启 Manager API"
        echo "  14) 重启 Python Server"
        echo "  15) 重启前端应用"
        echo ""
        echo "  16) 查看 Manager API 日志"
        echo "  17) 查看 Python Server 日志"
        echo "  18) 查看前端应用日志"
        echo ""
        echo "  0) 退出"
        echo ""
        echo -ne "${YELLOW}请输入选项 [0-18]: ${NC}"

        read -r choice

        case $choice in
            1)  echo ""; main start all; echo ""; read -p "按回车键继续..." ;;
            2)  echo ""; main stop all; echo ""; read -p "按回车键继续..." ;;
            3)  echo ""; main restart all; echo ""; read -p "按回车键继续..." ;;
            4)  echo ""; show_status; echo ""; read -p "按回车键继续..." ;;
            5)  echo ""; start_postgres; echo ""; read -p "按回车键继续..." ;;
            6)  echo ""; start_redis; echo ""; read -p "按回车键继续..." ;;
            7)  echo ""; start_manager_api; echo ""; read -p "按回车键继续..." ;;
            8)  echo ""; start_python_server; echo ""; read -p "按回车键继续..." ;;
            9)  echo ""; start_client; echo ""; read -p "按回车键继续..." ;;
            10) echo ""; stop_manager_api; echo ""; read -p "按回车键继续..." ;;
            11) echo ""; stop_python_server; echo ""; read -p "按回车键继续..." ;;
            12) echo ""; stop_client; echo ""; read -p "按回车键继续..." ;;
            13) echo ""; restart_manager_api; echo ""; read -p "按回车键继续..." ;;
            14) echo ""; restart_python_server; echo ""; read -p "按回车键继续..." ;;
            15) echo ""; restart_client; echo ""; read -p "按回车键继续..." ;;
            16) echo ""; show_logs "manager-api" 50; echo ""; read -p "按回车键继续..." ;;
            17) echo ""; show_logs "python-server" 50; echo ""; read -p "按回车键继续..." ;;
            18) echo ""; show_logs "client" 50; echo ""; read -p "按回车键继续..." ;;
            0)  echo -e "\n${GREEN}再见！${NC}\n"; exit 0 ;;
            *)  echo -e "\n${RED}无效的选项，请重新选择${NC}\n"; sleep 2 ;;
        esac
    done
}

# ============================================
# 主流程
# ============================================

main() {
    local command=${1:-}
    local service=${2:-all}
    local option=${3}

    # 如果没有参数，显示交互式菜单
    if [ $# -eq 0 ]; then
        show_interactive_menu
        return
    fi

    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   AI 语音助手 - 服务管理工具           ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}\n"

    case "$command" in
        start)
            case "$service" in
                postgres)       start_postgres ;;
                redis)          start_redis ;;
                manager-api)    start_manager_api ;;
                python-server)  start_python_server ;;
                client)         start_client ;;
                all)
                    print_info "=== 启动数据库服务 ==="
                    start_postgres || exit 1
                    start_redis || exit 1
                    echo ""

                    print_info "=== 启动后端服务 ==="
                    start_manager_api || print_warning "Manager API 启动失败，继续..."
                    echo ""

                    print_info "=== 启动 AI Server ==="
                    start_python_server || print_warning "Python Server 启动失败，继续..."
                    echo ""

                    print_info "=== 启动前端应用 ==="
                    start_client || print_warning "前端启动失败"
                    echo ""

                    show_status
                    ;;
                *)
                    print_error "未知的服务: $service"
                    show_usage
                    exit 1
                    ;;
            esac
            ;;

        stop)
            case "$service" in
                postgres)       stop_postgres ;;
                redis)          stop_redis ;;
                manager-api)    stop_manager_api ;;
                python-server)  stop_python_server ;;
                client)         stop_client ;;
                all)
                    stop_client
                    stop_python_server
                    stop_manager_api
                    print_info "数据库服务未停止，如需停止请使用: ./service.sh stop postgres 或 ./service.sh stop redis"
                    ;;
                *)
                    print_error "未知的服务: $service"
                    show_usage
                    exit 1
                    ;;
            esac
            ;;

        restart)
            case "$service" in
                postgres)       restart_postgres ;;
                redis)          restart_redis ;;
                manager-api)    restart_manager_api ;;
                python-server)  restart_python_server ;;
                client)         restart_client ;;
                all)
                    restart_manager_api
                    restart_python_server
                    restart_client
                    print_info "数据库服务未重启，如需重启请使用: ./service.sh restart postgres 或 ./service.sh restart redis"
                    ;;
                *)
                    print_error "未知的服务: $service"
                    show_usage
                    exit 1
                    ;;
            esac
            ;;

        status)
            show_status
            ;;

        logs)
            if [ "$service" = "all" ]; then
                print_error "请指定具体的服务"
                echo "可用服务: manager-api, python-server, client"
                exit 1
            fi
            show_logs "$service" "$option"
            ;;

        help|--help|-h)
            show_usage
            ;;

        *)
            print_error "未知的命令: $command"
            show_usage
            exit 1
            ;;
    esac

    [ "$command" != "status" ] && [ "$command" != "logs" ] && [ "$command" != "help" ] && [ "$command" != "--help" ] && [ "$command" != "-h" ] && echo "" && print_success "操作完成！"
}

main "$@"
