import { useEffect, useRef, useState, useCallback } from 'react'
import {
  getAvatarConfig,
  type AvatarConfigResponse,
  type MentorChatResponse,
} from '../services/aiService'

declare global {
  interface Window {
    XmovAvatar?: any
    XMovAvatar?: any
    NebulaAvatar?: any
    AvatarSDK?: any
    VideoDecoder?: any
  }
}

export interface DigitalHumanMentorProps {
  onClose: () => void
  onAsk: (message: string, isDigitalHuman?: boolean) => Promise<MentorChatResponse>
  onAction?: (action: { type: string; payload?: Record<string, unknown> }) => void
  currentStep: string
  currentHeightScale: number
  currentRimScale: number
  currentBellyScale: number
  activeMotif: string
  activeGlaze: string
}

const DEFAULT_GREETING = '我是您的御窑数字人导师。请随时向我提问或下达控瓷指令。'

export function DigitalHumanMentor({
  onClose,
  onAsk,
  onAction,
}: DigitalHumanMentorProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const resizeObserverRef = useRef<MutationObserver | null>(null)

  const [status, setStatus] = useState<'connecting' | 'downloading' | 'ready' | 'error'>('connecting')
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [subtitle, setSubtitle] = useState<string>(DEFAULT_GREETING)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false)

  // 1. 规范化与自适应数字人画布（保持比例居中底对齐）
  const normalizeStage = useCallback(() => {
    const container = mountRef.current
    if (!container) return

    container.style.position = 'absolute'
    container.style.inset = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.overflow = 'hidden'

    container.querySelectorAll('canvas, video, div').forEach((node) => {
      const el = node as HTMLElement
      el.style.position = 'absolute'
      if (node instanceof HTMLCanvasElement || node instanceof HTMLVideoElement) {
        el.style.left = '50%'
        el.style.right = 'auto'
        el.style.top = 'auto'
        el.style.bottom = '0'
        el.style.width = 'auto'
        el.style.height = '100%'
        el.style.maxWidth = '100%'
        el.style.display = 'block'
        el.style.objectFit = 'contain'
        el.style.objectPosition = 'center bottom'
        el.style.transform = 'translateX(-50%)'
      } else {
        el.style.inset = '0'
        el.style.width = '100%'
        el.style.height = '100%'
      }
    })
  }, [])

  // 2. 语音播报与口型动作驱动（支持即刻打断上一句）
  const speak = useCallback(async (rawText: string, interrupt = true) => {
    if (!rawText) return
    // 清理 HTML 标签
    let cleanText = rawText.replace(/<[^>]+>/g, '').trim()
    // 严格限制口播不超过 50 字
    if (cleanText.length > 50) {
      cleanText = cleanText.slice(0, 48) + '…'
    }

    setSubtitle(cleanText)

    const avatar = avatarRef.current
    if (!avatar) return

    try {
      if (typeof avatar.speak === 'function') {
        // avatar.speak(text, isInterrupt, isBroadcast)
        await avatar.speak(cleanText, interrupt, true)
      } else if (typeof avatar.sendText === 'function') {
        await avatar.sendText(cleanText)
      } else if (typeof avatar.tts === 'function') {
        await avatar.tts(cleanText)
      }
    } catch (err) {
      console.warn('[DigitalHuman] Speak error:', err)
    }
  }, [])

  // 3. 用户提交问题（支持随时提问，打断上一轮）
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text) return

    setInput('')

    // 中断上一次尚在进行的 LLM 请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // 立即打断当前正在说的内容，切换提示
    setSubtitle(`正在思索并执行：“${text}”…`)
    setIsAiThinking(true)

    try {
      // 携带 isDigitalHuman=true，通知后端大模型严格将回复限制在 50 字以内
      const res = await onAsk(text, true)

      // 提取纯文本回复并调用数字人口播
      if (res && res.reply) {
        speak(res.reply, true)
      }

      // 如果有联动控瓷动作，同步执行
      if (res && res.action && res.action.type !== 'none' && onAction) {
        onAction(res.action)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[DigitalHuman] Previous query aborted by new prompt')
      } else {
        console.error('[DigitalHuman] Ask error:', err)
        speak('督陶官已收到指令，正在为您推进工序。', true)
      }
    } finally {
      setIsAiThinking(false)
    }
  }, [input, onAsk, onAction, speak])

  // 4. 初始化 XMOV 数字人会话与模型下载
  useEffect(() => {
    let isUnmounted = false

    async function initAvatar() {
      try {
        // 检查环境与 SDK
        const SdkCtor =
          window.XmovAvatar || window.XMovAvatar || window.NebulaAvatar || window.AvatarSDK

        if (!SdkCtor) {
          throw new Error('未检测到数字人 SDK，请确认网络是否畅通')
        }

        setStatus('connecting')
        const cfg: AvatarConfigResponse = await getAvatarConfig()
        if (isUnmounted) return

        const avatar = new SdkCtor({
          containerId: '#avatarMount',
          container: mountRef.current,
          appId: cfg.appId,
          appSecret: cfg.appSecret,
          gatewayServer: cfg.gatewayServer,
          headers: { Authorization: '888jn' },
          enableDebugger: false,
          config: {
            look_name: cfg.avatarLook,
            enable_asr: true,
            asr_enabled: true,
            init_events: [
              {
                type: 'SetCharacterCanvasAnchor',
                x_location: 0,
                y_location: 0,
                width: 1,
                height: 1,
              },
            ],
          },
          onWidgetEvent(_data: any) {
            // 字幕直接完整显示每次回复的完整内容（<=50字），不按每句话切片打碎
          },
          onVoiceStateChange(s: string) {
            setIsSpeaking(s === 'start')
          },
          onStatusChange(s: any) {
            if (s === 5 || s === 'visible') {
              setStatus('ready')
              normalizeStage()
            }
          },
          onRenderChange(r: string) {
            if (r === 'rendering') {
              setStatus('ready')
              normalizeStage()
            }
          },
          onMessage(msg: any) {
            if (msg && msg.code && msg.code !== 0) {
              console.warn('[XMOV]', msg)
            }
          },
        })

        avatarRef.current = avatar

        // 监听真实模型资产下载进度 (0% ~ 100%)
        setStatus('downloading')
        if (typeof avatar.init === 'function') {
          await avatar.init({
            initModel: 'normal',
            onDownloadProgress(p: number) {
              if (!isUnmounted) {
                setDownloadProgress(Math.min(100, Math.max(0, Math.round(p))))
              }
            },
          })
        }

        if (isUnmounted) return

        // 建立连接
        if (typeof avatar.start === 'function') {
          await avatar.start()
        } else if (typeof avatar.connect === 'function') {
          await avatar.connect()
        }

        setStatus('ready')
        normalizeStage()

        // 监听容器大小变更
        resizeObserverRef.current = new MutationObserver(() => {
          normalizeStage()
        })
        if (mountRef.current) {
          resizeObserverRef.current.observe(mountRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
          })
        }

        // 初始问候语
        setTimeout(() => {
          if (!isUnmounted) {
            speak('督陶官在此，请随时指示拉坯、画花或下达控瓷指令。', false)
          }
        }, 800)
      } catch (err: any) {
        console.error('[DigitalHuman] Init failed:', err)
        if (!isUnmounted) {
          setStatus('error')
          setErrorMessage(err.message || '数字人初始化失败')
        }
      }
    }

    initAvatar()

    return () => {
      isUnmounted = true
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (avatarRef.current && typeof avatarRef.current.destroy === 'function') {
        try {
          avatarRef.current.destroy()
        } catch (e) {
          console.warn('[DigitalHuman] Destroy error:', e)
        }
        avatarRef.current = null
      }
    }
  }, [normalizeStage, speak])

  return (
    <div className="digital-human-panel">
      {/* 顶部状态与控制栏 */}
      <div className="digital-human-header">
        <div className="dh-title">
          <span className={`dh-status-dot ${status === 'ready' ? 'online' : 'busy'}`} />
          <span className="dh-name">御窑非遗导师 · 3D 化身</span>
          {isSpeaking && <span className="dh-speaking-badge">语音播报中</span>}
        </div>
        <button className="dh-close-btn" onClick={onClose} title="切换回传统文字对话模式">
          切回文字模式
        </button>
      </div>

      {/* 主舞台区域 (上 75% 为数字人渲染视口或真实进度加载器) */}
      <div className="digital-human-stage-wrapper">
        {/* 数字人 WebGL/WebCodecs 渲染挂载点 */}
        <div
          id="avatarMount"
          ref={mountRef}
          className={`digital-human-canvas ${status === 'ready' ? 'visible' : 'hidden'}`}
        />

        {/* 加载中：真实资产下载进度条 */}
        {status !== 'ready' && status !== 'error' && (
          <div className="digital-human-loading-box">
            <div className="dh-loader-title">正在唤醒御窑数字人导师…</div>
            <div className="dh-loader-sub">
              {status === 'downloading'
                ? `下载 3D 骨骼与神经渲染资产：${downloadProgress}%`
                : '正在建立低延迟音视频渲染信道…'}
            </div>
            <div className="dh-progress-track">
              <div
                className="dh-progress-bar"
                style={{ width: `${Math.max(5, downloadProgress)}%` }}
              />
            </div>
            <div className="dh-loader-tip">
              基于魔珐星云实时 TTSA 神经驱动 · DeepSeek 协同思考
            </div>
          </div>
        )}

        {/* 异常提示 */}
        {status === 'error' && (
          <div className="digital-human-error-box">
            <div className="dh-error-title">数字人连接提示</div>
            <div className="dh-error-msg">{errorMessage}</div>
            <button className="dh-retry-btn" onClick={onClose}>
              切换为文字对话模式
            </button>
          </div>
        )}
      </div>

      {/* 中部：实时字幕区 (优雅中式瓷韵气泡) */}
      <div className="digital-human-subtitle-container">
        <div className="dh-subtitle-header">
          <span className="dh-seal-small">御</span>
          <span className="dh-subtitle-tag">实时字幕</span>
          {isAiThinking && <span className="dh-thinking-pulse">思索并推演中…</span>}
        </div>
        <div className="dh-subtitle-text">
          {subtitle || '（等待导师回答…）'}
        </div>
      </div>

      {/* 底部：用户输入与随时提问/打断操作区 */}
      <div className="digital-human-input-container">
        {/* 快捷控瓷指令 */}
        <div className="dh-quick-chips">
          <span className="dh-chip" onClick={() => handleSend('把瓶腹拉大一些')}>
            ✦ 瓶腹拉大
          </span>
          <span className="dh-chip" onClick={() => handleSend('绘制青花云水龙纹')}>
            ✦ 绘龙纹
          </span>
          <span className="dh-chip" onClick={() => handleSend('施温润仿玉釉')}>
            ✦ 施玉釉
          </span>
          <span className="dh-chip" onClick={() => handleSend('开窑起火烧制')}>
            ✦ 起火烧窑
          </span>
        </div>

        <div className="dh-input-row">
          <input
            className="dh-input-box"
            value={input}
            placeholder="随时提问或下达控瓷指令（新提问将即时打断播报）…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
          />
          <button
            className="dh-send-btn"
            onClick={() => handleSend()}
            title="发送指令（可随时打断上一句）"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
