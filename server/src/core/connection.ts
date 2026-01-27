import { Dialogue } from "@/chat/dialogue";
import { PromptManager } from "@/chat/prompt-manager";
import type { AppConfig } from "@/types/config";
import type {
  BaseASRProvider,
  BaseIntentProvider,
  BaseLLMProvider,
  BaseMemoryProvider,
  BaseTTSProvider,
  Intent,
} from "@/types/providers";
import type { BaseVADProvider, VADContext } from "@/types/vad";
import { createVADContext } from "@/types/vad";
import type { Logger } from "@/utils/logger";
import { nanoid } from "nanoid";

/**
 * WebSocket 消息类型
 */
export interface WebSocketMessage {
  type: string;
  session_id?: string;
  timestamp?: number;
  data?: any;
}

/**
 * 连接状态
 */
export interface ConnectionState {
  /** 会话 ID */
  sessionId: string;
  /** 设备 ID */
  deviceId?: string;
  /** 客户端 ID */
  clientId?: string;
  /** 客户端 IP */
  clientIp?: string;

  /** 是否需要绑定设备 */
  needBind: boolean;
  /** 绑定验证码 */
  bindCode?: string;

  /** 是否从 API 读取配置 */
  readConfigFromApi: boolean;

  /** 音频格式 */
  audioFormat: "opus" | "pcm";

  /** 客户端状态 */
  clientAbort: boolean;
  clientIsSpeaking: boolean;
  clientListenMode: "auto" | "manual";

  /** VAD 上下文 */
  vadContext: VADContext;

  /** ASR 音频缓冲 */
  asrAudio: Uint8Array[];

  /** 当前说话人 */
  currentSpeaker?: string;
  /** 当前语言标签 */
  currentLanguageTag: string;

  /** LLM 任务是否完成 */
  llmFinishTask: boolean;

  /** TTS 消息文本 */
  ttsMessageText: string;

  /** 是否在聊天结束后关闭连接 */
  closeAfterChat: boolean;

  /** 意图类型 */
  intentType: string;

  /** 特性标记 */
  features?: Record<string, boolean>;

  /** 是否来自 MQTT */
  connFromMqttGateway: boolean;

  /** 连接开始时间 */
  startTime: number;
  /** 最后活动时间 */
  lastActivity: number;
}

/**
 * 创建默认连接状态
 */
export function createConnectionState(): ConnectionState {
  return {
    sessionId: nanoid(),
    needBind: false,
    readConfigFromApi: false,
    audioFormat: "opus",
    clientAbort: false,
    clientIsSpeaking: false,
    clientListenMode: "auto",
    vadContext: createVADContext(),
    asrAudio: [],
    currentLanguageTag: "zh",
    llmFinishTask: true,
    ttsMessageText: "",
    closeAfterChat: false,
    intentType: "nointent",
    connFromMqttGateway: false,
    startTime: Date.now(),
    lastActivity: Date.now(),
  };
}

/**
 * 连接处理器
 * 对应 Python 版本的 ConnectionHandler
 */
export class ConnectionHandler {
  private config: AppConfig;
  private logger: Logger;
  private state: ConnectionState;
  private ws: any;

  // Providers
  private vad?: BaseVADProvider;
  private asr?: BaseASRProvider;
  private llm?: BaseLLMProvider;
  private tts?: BaseTTSProvider;
  private intent?: BaseIntentProvider;
  private memory?: BaseMemoryProvider;
  private dialogue: Dialogue;
  private promptManager: PromptManager;

  // 超时配置
  private timeoutSeconds: number;
  private timeoutTimer?: Timer;

  constructor(
    config: AppConfig,
    logger: Logger,
    ws: any,
    options?: {
      vad?: BaseVADProvider;
      asr?: BaseASRProvider;
      llm?: BaseLLMProvider;
      tts?: BaseTTSProvider;
      intent?: BaseIntentProvider;
      memory?: BaseMemoryProvider;
      deviceId?: string;
      clientId?: string;
      clientIp?: string;
    },
  ) {
    this.config = config;
    this.logger = logger;
    this.ws = ws;

    // 初始化状态
    this.state = createConnectionState();
    this.state.deviceId = options?.deviceId;
    this.state.clientId = options?.clientId;
    this.state.clientIp = options?.clientIp;

    // 设置 Providers
    this.vad = options?.vad;
    this.asr = options?.asr;
    this.llm = options?.llm;
    this.tts = options?.tts;
    this.intent = options?.intent;
    this.memory = options?.memory;

    // 初始化对话管理
    this.dialogue = new Dialogue();

    // 初始化提示词管理器
    this.promptManager = new PromptManager({
      basePrompt: config.agent?.base_prompt,
      templatePath: config.agent?.prompt_template,
    });

    // 超时配置
    this.timeoutSeconds = (config.close_connection_no_voice_time || 120) + 60;
  }

  /**
   * 获取会话 ID
   */
  get sessionId(): string {
    return this.state.sessionId;
  }

  /**
   * 获取连接状态
   */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /**
   * 处理连接
   */
  async handleConnection(): Promise<void> {
    this.logger.info(`Connection established: ${this.state.sessionId}`);
    this.logger.info(`Client IP: ${this.state.clientIp}, Device ID: ${this.state.deviceId}`);

    // 检查是否来自 MQTT
    // this.state.connFromMqttGateway = ...

    // 发送 hello 消息
    if (this.config.enable_greeting) {
      await this.sendHelloMessage();
    }

    // 启动超时检测
    this.startTimeoutDetection();
  }

  /**
   * 发送 Hello 消息
   */
  async sendHelloMessage(): Promise<void> {
    const message: WebSocketMessage = {
      type: "hello",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
      data: {
        message: "Connected to AI Server",
        config: {
          audio_params: this.config.audio_params,
        },
      },
    };

    this.send(message);
  }

  /**
   * 处理音频消息
   */
  async handleAudioMessage(audioData: Uint8Array): Promise<void> {
    this.updateActivity();

    // VAD 检测
    let hasVoice = true;
    if (this.vad && this.state.clientListenMode !== "manual") {
      const vadResult = await this.vad.isVAD(audioData, this.state.vadContext);
      hasVoice = vadResult.hasVoice;

      // 如果有声音且客户端正在说话，打断当前播放
      if (hasVoice && this.state.clientIsSpeaking) {
        await this.handleAbort();
      }

      // 检查语音是否停止
      if (vadResult.voiceStopped) {
        await this.handleVoiceStop();
      }
    }

    // 缓存音频数据
    if (hasVoice || this.state.clientListenMode === "manual") {
      this.state.asrAudio.push(audioData);
    } else {
      // 保留最近 10 帧
      if (this.state.asrAudio.length > 10) {
        this.state.asrAudio = this.state.asrAudio.slice(-10);
      }
    }
  }

  /**
   * 处理语音停止
   */
  async handleVoiceStop(): Promise<void> {
    if (this.state.asrAudio.length < 15) {
      this.state.asrAudio = [];
      this.resetVadStates();
      return;
    }

    // 复制音频数据用于 ASR
    const audioData = [...this.state.asrAudio];
    this.state.asrAudio = [];
    this.resetVadStates();

    this.logger.debug(`Voice stopped, audio frames: ${audioData.length}`);

    // ASR 处理
    if (this.asr) {
      try {
        // 合并音频帧
        const totalLength = audioData.reduce((sum, arr) => sum + arr.length, 0);
        const combinedAudio = new Uint8Array(totalLength);
        let offset = 0;
        for (const frame of audioData) {
          combinedAudio.set(frame, offset);
          offset += frame.length;
        }

        // 调用 ASR 转录
        const transcribedText = await this.asr.transcribe(Buffer.from(combinedAudio), {
          language: this.state.currentLanguageTag,
        });

        if (transcribedText && transcribedText.trim().length > 0) {
          this.logger.info(`ASR result: ${transcribedText}`);
          // 使用转录结果进行后续处理
          await this.processTranscribedText(transcribedText);
        } else {
          this.logger.debug("ASR returned empty result");
        }
      } catch (error) {
        this.logger.error({ err: error }, "ASR processing error");
      }
    } else {
      this.logger.warn("ASR provider not available");
    }
  }

  /**
   * 处理转录后的文本
   */
  private async processTranscribedText(text: string): Promise<void> {
    // 发送 STT 确认消息
    this.sendSTTMessage(text);

    // 进行意图分析和 LLM 对话
    await this.analyzeIntentAndChat(text);
  }

  /**
   * 处理文本消息
   */
  async handleTextMessage(text: string): Promise<void> {
    this.updateActivity();

    // 解析说话人信息
    let speakerName: string | undefined;
    let languageTag = "zh";
    let actualText = text;

    try {
      if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
        const data = JSON.parse(text);
        if (data.speaker && data.content) {
          speakerName = data.speaker;
          languageTag = data.language || "zh";
          actualText = data.content;
        }
      }
    } catch {
      // 解析失败，使用原始文本
    }

    // 保存说话人信息
    this.state.currentSpeaker = speakerName;
    this.state.currentLanguageTag = languageTag;

    // 检查是否需要绑定设备
    if (this.state.needBind) {
      await this.handleDeviceBind();
      return;
    }

    // 检查退出命令
    if (this.config.exit_commands.some((cmd) => actualText.includes(cmd))) {
      await this.handleExit();
      return;
    }

    // 打断正在播放的内容
    if (this.state.clientIsSpeaking && this.state.clientListenMode !== "manual") {
      await this.handleAbort();
    }

    // 发送 STT 确认消息
    this.sendSTTMessage(actualText);

    // 进行意图分析和 LLM 对话
    await this.analyzeIntentAndChat(actualText);
  }

  /**
   * 处理设备绑定
   */
  private async handleDeviceBind(): Promise<void> {
    if (this.state.bindCode) {
      // 确保 bindCode 是 6 位数字
      if (this.state.bindCode.length !== 6) {
        this.logger.error(`Invalid bind code format: ${this.state.bindCode}`);
        const errorText = "绑定码格式错误，请检查配置。";
        this.sendSTTMessage(errorText);
        await this.synthesizeAndSendAudio(errorText);
        return;
      }

      const bindText = `请登录控制面板，输入${this.state.bindCode}，绑定设备。`;
      this.sendSTTMessage(bindText);
      await this.synthesizeAndSendAudio(bindText);
    } else {
      const errorText = "设备需要绑定但未获取到绑定码。";
      this.sendSTTMessage(errorText);
      await this.synthesizeAndSendAudio(errorText);
    }
  }

  /**
   * 意图分析和 LLM 对话
   */
  private async analyzeIntentAndChat(text: string): Promise<void> {
    let intentHandled = false;

    // 1. 意图分析
    if (this.intent) {
      try {
        const intentResult = await this.intent.recognize(text);
        this.logger.debug(`Intent result: ${JSON.stringify(intentResult)}`);

        // 处理特殊意图
        intentHandled = await this.processIntent(intentResult, text);
      } catch (error) {
        this.logger.error({ err: error }, "Intent analysis error");
      }
    }

    // 2. 如果意图未被处理，进行 LLM 对话
    if (!intentHandled && this.llm) {
      await this.chat(text);
    }
  }

  /**
   * 处理意图
   */
  private async processIntent(intent: Intent, originalText: string): Promise<boolean> {
    // 根据意图类型处理
    switch (intent.intent) {
      case "exit":
      case "goodbye":
        await this.handleExit();
        return true;

      case "play_music":
        // 播放音乐意图
        const musicQuery = intent.entities?.query || originalText;
        this.sendIntentMessage("play_music", { query: musicQuery });
        return true;

      case "weather":
        // 天气查询意图
        const location = intent.entities?.location || "当前位置";
        this.sendIntentMessage("weather", { location });
        return true;

      case "iot":
        // IoT 控制意图
        const device = intent.entities?.device;
        const action = intent.entities?.action;
        if (device && action) {
          this.sendIoTMessage(device, action);
          return true;
        }
        return false;

      case "general":
      case "continue_chat":
      default:
        // 继续聊天，不处理
        return false;
    }
  }

  /**
   * LLM 对话
   */
  private async chat(query: string): Promise<void> {
    if (!this.llm) {
      this.logger.warn("LLM provider not available");
      return;
    }

    try {
      this.state.llmFinishTask = false;

      // 添加用户消息到对话历史
      this.dialogue.addUserMessage(query, this.state.currentSpeaker);

      // 获取记忆内容
      let memoryContext = "";
      if (this.memory) {
        try {
          const memories = await this.memory.search(query, 5);
          if (memories.length > 0) {
            memoryContext = "\n\n相关记忆：\n" + memories.map((m) => m.content).join("\n");
          }
        } catch (error) {
          this.logger.error({ err: error }, "Memory search error");
        }
      }

      // 获取系统提示词
      const systemPrompt = await this.promptManager.buildSystemPrompt({
        memory: memoryContext,
        speakerName: this.state.currentSpeaker,
      });

      // 构建消息列表
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...this.dialogue.getLLMDialogue(),
      ];

      // 发送 TTS 开始消息
      this.sendTTSMessage("start");

      // 获取当前 LLM provider 配置
      const llmProviderName = this.config.llm?.default;
      const llmProviderConfig = llmProviderName
        ? this.config.llm?.providers?.[llmProviderName]
        : undefined;

      // 调用 LLM
      let fullResponse = "";
      const responseStream = this.llm.chatStream(messages, {
        temperature: llmProviderConfig?.temperature || 0.7,
        max_tokens: llmProviderConfig?.max_tokens || 2000,
      });

      // 处理流式响应
      let sentenceBuffer = "";
      for await (const chunk of responseStream) {
        if (this.state.clientAbort) {
          this.logger.debug("Chat aborted by client");
          break;
        }

        fullResponse += chunk;
        sentenceBuffer += chunk;

        // 检查是否有完整句子可以发送
        const sentences = this.extractSentences(sentenceBuffer);
        if (sentences.completed.length > 0) {
          for (const sentence of sentences.completed) {
            // 合成并发送音频
            await this.synthesizeAndSendAudio(sentence);
          }
          sentenceBuffer = sentences.remaining;
        }
      }

      // 处理剩余的文本
      if (sentenceBuffer.trim() && !this.state.clientAbort) {
        await this.synthesizeAndSendAudio(sentenceBuffer);
      }

      // 添加助手回复到对话历史
      if (fullResponse) {
        this.dialogue.addAssistantMessage(fullResponse);
        this.state.ttsMessageText = fullResponse;
      }

      // 发送 TTS 结束消息
      this.sendTTSMessage("stop");
      this.state.llmFinishTask = true;
    } catch (error) {
      this.logger.error({ err: error }, "LLM chat error");
      this.state.llmFinishTask = true;
    }
  }

  /**
   * 提取完整句子
   */
  private extractSentences(text: string): { completed: string[]; remaining: string } {
    const sentenceEndings = /([。！？.!?]+)/g;
    const parts = text.split(sentenceEndings);
    const completed: string[] = [];
    let remaining = "";

    for (let i = 0; i < parts.length; i++) {
      if (sentenceEndings.test(parts[i])) {
        // 这是标点符号，添加到上一个部分
        if (completed.length > 0) {
          completed[completed.length - 1] += parts[i];
        }
      } else if (i < parts.length - 1) {
        // 有后续标点，是完整句子
        completed.push(parts[i]);
      } else {
        // 最后一部分，可能不完整
        remaining = parts[i];
      }
    }

    return { completed: completed.filter((s) => s.trim()), remaining };
  }

  /**
   * 合成并发送音频
   */
  private async synthesizeAndSendAudio(text: string): Promise<void> {
    if (!this.tts || !text.trim()) return;

    try {
      this.state.clientIsSpeaking = true;

      // 获取当前 TTS provider 配置
      const ttsProviderName = this.config.tts?.default;
      const ttsProviderConfig = ttsProviderName
        ? this.config.tts?.providers?.[ttsProviderName]
        : undefined;

      // 合成音频
      const audioData = await this.tts.synthesize(text, {
        voice: ttsProviderConfig?.voice,
        speed: ttsProviderConfig?.speed,
      });

      // 发送音频数据
      if (audioData && audioData.length > 0) {
        this.sendAudioMessage(audioData);
      }
    } catch (error) {
      this.logger.error({ err: error }, "TTS synthesis error");
    }
  }

  /**
   * 发送音频消息
   */
  private sendAudioMessage(audioData: Buffer): void {
    try {
      // 发送二进制音频数据
      this.ws.send(audioData);
    } catch (error) {
      this.logger.error({ err: error }, "Failed to send audio message");
    }
  }

  /**
   * 发送意图消息
   */
  private sendIntentMessage(intent: string, data: Record<string, any>): void {
    this.send({
      type: "intent",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
      data: {
        intent,
        ...data,
      },
    });
  }

  /**
   * 发送 IoT 消息
   */
  private sendIoTMessage(device: string, action: string, params?: Record<string, any>): void {
    this.send({
      type: "iot",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
      data: {
        device,
        action,
        params,
      },
    });
  }

  /**
   * 发送 TTS 状态消息
   */
  private sendTTSMessage(state: "start" | "stop" | "sentence", text?: string): void {
    this.send({
      type: "tts",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
      data: {
        state,
        text,
      },
    });
  }

  /**
   * 处理打断
   */
  async handleAbort(): Promise<void> {
    this.state.clientAbort = true;
    this.state.clientIsSpeaking = false;

    this.send({
      type: "abort",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
    });

    this.logger.debug(`Abort sent for session: ${this.state.sessionId}`);
  }

  /**
   * 处理退出
   */
  async handleExit(): Promise<void> {
    this.send({
      type: "goodbye",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
      data: {
        message: "再见，期待下次与您交流！",
      },
    });

    // 关闭连接
    setTimeout(() => {
      this.close();
    }, 1000);
  }

  /**
   * 发送 STT 消息
   */
  sendSTTMessage(text: string): void {
    this.send({
      type: "stt",
      session_id: this.state.sessionId,
      timestamp: Date.now(),
      data: {
        text,
        speaker: this.state.currentSpeaker,
        language: this.state.currentLanguageTag,
      },
    });
  }

  /**
   * 发送消息
   */
  send(message: WebSocketMessage): void {
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error({ err: error }, "Failed to send message");
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.stopTimeoutDetection();

    try {
      this.ws.close();
    } catch (error) {
      this.logger.error({ err: error }, "Error closing WebSocket");
    }

    this.logger.info(`Connection closed: ${this.state.sessionId}`);
  }

  /**
   * 重置 VAD 状态
   */
  private resetVadStates(): void {
    this.state.vadContext.hasVoice = false;
    this.state.vadContext.voiceStopped = false;
    this.state.vadContext.voiceWindow = [];
    this.state.vadContext.firstActivityTime = 0;
  }

  /**
   * 更新活动时间
   */
  private updateActivity(): void {
    this.state.lastActivity = Date.now();
  }

  /**
   * 启动超时检测
   */
  private startTimeoutDetection(): void {
    this.timeoutTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.state.lastActivity) / 1000;

      if (elapsed > this.timeoutSeconds) {
        this.logger.info(`Session timeout: ${this.state.sessionId}`);
        this.handleExit();
      }
    }, 30000);
  }

  /**
   * 停止超时检测
   */
  private stopTimeoutDetection(): void {
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }
}
