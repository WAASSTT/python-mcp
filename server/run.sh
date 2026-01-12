#!/bin/bash
# Python AI Server 启动脚本

set -e

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# 路径配置
readonly SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_DIR="${SERVER_DIR}/../logs"
readonly PID_DIR="${SERVER_DIR}/../pids"
readonly PID_FILE="${PID_DIR}/python-server.pid"
readonly LOG_FILE="${LOG_DIR}/python-server.log"

# 端口配置
readonly SERVER_PORT=30000
readonly HTTP_PORT=30003

# 初始化目录
mkdir -p "${LOG_DIR}" "${PID_DIR}"

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

check_port() {
    nc -z localhost "$1" 2>/dev/null || lsof -Pi ":$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

start_server() {
    print_info "启动 Python AI Server..."

    if check_port "$SERVER_PORT"; then
        print_warning "端口 $SERVER_PORT 已被占用，停止旧进程..."
        pkill -f "python.*app.py" 2>/dev/null || true
        sleep 2
    fi

    cd "${SERVER_DIR}"

    if [ ! -d ".venv" ]; then
        print_info "创建 Python 虚拟环境 (uv)..."
        uv venv --python 3.12
        source .venv/bin/activate
        uv pip install -r requirements.txt
    else
        source .venv/bin/activate
    fi

    nohup python app.py > "${LOG_FILE}" 2>&1 &
    echo $! > "${PID_FILE}"
    deactivate

    sleep 5
    if check_port "$SERVER_PORT"; then
        print_success "Python AI Server 启动成功"
        print_info "WebSocket: ws://localhost:$SERVER_PORT/xiaozhi/v1/"
        print_info "HTTP API: http://localhost:$HTTP_PORT"
        print_info "日志文件: ${LOG_FILE}"
        print_info "PID 文件: ${PID_FILE}"
    else
        print_error "启动失败，请查看日志: ${LOG_FILE}"
        return 1
    fi
}

stop_server() {
    print_info "停止 Python AI Server..."

    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid" 2>/dev/null || true
            sleep 1
            ps -p "$pid" > /dev/null 2>&1 && kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "${PID_FILE}"
    fi

    pkill -9 -f "python.*app.py" 2>/dev/null || true
    print_success "Python AI Server 已停止"
}

check_status() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}       Python AI Server 状态${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""

    if check_port "$SERVER_PORT"; then
        printf "  ${GREEN}✓ 运行中${NC}\n"
        printf "  WebSocket: ws://localhost:$SERVER_PORT/xiaozhi/v1/\n"
        printf "  HTTP API: http://localhost:$HTTP_PORT\n"
        if [ -f "${PID_FILE}" ]; then
            printf "  PID: $(cat ${PID_FILE})\n"
        fi
    else
        printf "  ${RED}✗ 未运行${NC}\n"
    fi

    echo ""
}

show_logs() {
    if [ -f "${LOG_FILE}" ]; then
        tail -f "${LOG_FILE}"
    else
        print_error "日志文件不存在: ${LOG_FILE}"
    fi
}

show_usage() {
    cat << EOF
${BLUE}════════════════════════════════════════
   Python AI Server 管理工具
═══════════════════════════════════════${NC}

用法: ./run_server.sh [命令]

命令:
  start      启动服务器
  stop       停止服务器
  restart    重启服务器
  status     查看服务器状态
  logs       查看服务器日志

示例:
  ./run_server.sh start    # 启动服务器
  ./run_server.sh stop     # 停止服务器
  ./run_server.sh restart  # 重启服务器
  ./run_server.sh status   # 查看状态
  ./run_server.sh logs     # 查看日志

EOF
}

main() {
    local command=${1:-status}

    case "$command" in
        start)
            start_server
            ;;
        stop)
            stop_server
            ;;
        restart)
            stop_server
            sleep 2
            start_server
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
            ;;
        *)
            show_usage
            ;;
    esac
}

main "$@"
