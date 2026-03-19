<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'

// 响应内容分块类型：支持文本和代码块
type ResponseBlock
  = { type: 'text', content: string }
  | { type: 'code', content: string, language?: string }

// 响应中的告警/说明信息（如“问题说明”）
type ResponseAlert = {
  label: string
  content: string
  tone?: 'warning' | 'info'
}

// 代码语言标签映射，用于在代码块头部显示友好的名称
const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  python: 'Python',
  py: 'Python',
  go: 'Go',
  rust: 'Rust',
  sql: 'SQL',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  bash: 'Bash',
  shell: 'Shell',
  sh: 'Shell',
  html: 'HTML',
  css: 'CSS',
  vue: 'Vue',
  text: 'Code',
  plaintext: 'Code'
}

const props = defineProps<{
  prompt: string
  response: string
  thinkingText?: string
  promptLabel?: string
  responseLabel?: string
  toolResultText?: string
  toolResultLabel?: string
  autoStart?: boolean
  variant?: 'default' | 'error' | 'success' | 'warning'
  compact?: boolean
  hidePrompt?: boolean
}>()

const emit = defineEmits<{
  complete: []
}>()

const showPrompt = ref(false)
const showAiSection = ref(false)
const visiblePrompt = ref('')
const visibleResponse = ref('')
const visibleResponseAfterTool = ref('')
const visibleThinking = ref('')
const isThinking = ref(false)
const isTyping = ref(false)
const isComplete = ref(false)
const hasStarted = ref(false)
const isThinkingCollapsed = ref(true)
const hasFinishedThinking = ref(false)
const thinkingAutoFollow = ref(true)
const responseAutoFollow = ref(true)
const parentAutoFollow = ref(true)
const toolCallState = ref<'idle' | 'running' | 'success'>('idle')
const toolResultVisible = ref(false)
const isToolResultCollapsed = ref(false)
const activeToolCall = ref<{ name: string, raw: string, language: string } | null>(null)

const AUTO_FOLLOW_THRESHOLD = 24

let abortController: AbortController | null = null

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('Aborted'))
    })
  })

// 移除 AI 响应中常见的引导性词汇（如 "AI 输出结果："）
const stripResponsePrefix = (value: string) =>
  value
    .replace(/^(?:AI\s*输出(?:结果|摘录)?|普通输出|输出结果|输出|结果)\s*[:：]\s*/i, '')
    .trim()

const stripCodeFence = (value: string) =>
  value
    .replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim()

const tryParseToolCall = (value: string) => {
  try {
    const parsed = JSON.parse(stripCodeFence(value))
    const toolCall = parsed?.tool_call
    if (!toolCall || typeof toolCall !== 'object') return null

    const toolName = typeof toolCall.name === 'string' ? toolCall.name : 'unknown_tool'
    const toolArgs = toolCall.arguments ?? {}

    return {
      name: toolName,
      argumentsText: JSON.stringify(toolArgs, null, 2),
      raw: value
    }
  } catch {
    return null
  }
}

const normalizedToolResult = computed(() => {
  if (!props.toolResultText) return ''
  return props.toolResultText.replace(/^Observation\s*:\s*/i, '').trim()
})

const parsedToolResult = computed(() => {
  const value = normalizedToolResult.value
  if (!value) return null

  const trimmed = stripCodeFence(value)
  const firstChar = trimmed[0]
  const looksJson = (firstChar === '{' && trimmed.endsWith('}')) || (firstChar === '[' && trimmed.endsWith(']'))

  if (looksJson) {
    return {
      kind: 'code' as const,
      language: 'json',
      content: trimmed
    }
  }

  return {
    kind: 'text' as const,
    language: 'text',
    content: trimmed
  }
})

const extractToolCallEnvelope = (value: string) => {
  const normalized = stripResponsePrefix(value)
  const toolBlockRegex = /```json\s*([\s\S]*?"tool_call"[\s\S]*?)```/i
  const match = normalized.match(toolBlockRegex)

  if (!match || match.index === undefined) return null

  const beforeText = normalized.slice(0, match.index).trim()
  const codeText = stripCodeFence(match[1])
  const afterText = normalized.slice(match.index + match[0].length).trim()
  const parsedTool = tryParseToolCall(codeText)

  if (!parsedTool) return null

  return {
    beforeText,
    codeText,
    afterText,
    parsedTool
  }
}

const ALERT_META_MAP: Record<string, { label: string; tone: 'warning' | 'info' }> = {
  '问题': { label: '问题说明', tone: 'warning' },
  '问题说明': { label: '问题说明', tone: 'warning' },
  '说明': { label: '说明', tone: 'warning' },
  '为什么会错': { label: '为什么会错', tone: 'warning' },
  '为什么错': { label: '为什么会错', tone: 'warning' },
  '错误原因': { label: '为什么会错', tone: 'warning' },
  '误判原因': { label: '为什么会错', tone: 'warning' },
  '易错点': { label: '易错点', tone: 'warning' },
  '问题本质': { label: '问题本质', tone: 'warning' },
  '提示': { label: '关键提示', tone: 'info' },
  '关键提示': { label: '关键提示', tone: 'info' },
  '题眼': { label: '关键提示', tone: 'info' },
  '提醒': { label: '关键提示', tone: 'info' }
}

const getAlertMeta = (rawLabel: string) => {
  const normalizedLabel = rawLabel.trim().replace(/\s+/g, '')
  return ALERT_META_MAP[normalizedLabel] ?? null
}

// 解析 Markdown 格式的响应内容，将其拆分为文本块、代码块和特殊告警
const parseResponseContent = (value: string): { alerts: ResponseAlert[]; blocks: ResponseBlock[] } => {
  const alerts: ResponseAlert[] = []
  const blocks: ResponseBlock[] = []
  const normalized = stripResponsePrefix(value)

  if (!normalized) {
    return { alerts, blocks }
  }

  const lines = normalized.split('\n')
  const textBuffer: string[] = []
  const codeBuffer: string[] = []
  let inCode = false
  let codeLanguage = ''
  const alertStartRegex = /^\s*([^:：]+)\s*[:：]\s*(.*)\s*$/

  const flushText = () => {
    const text = textBuffer.join('\n').trim()
    if (text) {
      blocks.push({ type: 'text', content: text })
    }
    textBuffer.length = 0
  }

  const flushCode = () => {
    const code = codeBuffer.join('\n').replace(/\s+$/, '')
    if (code) {
      blocks.push({ type: 'code', content: code, language: codeLanguage || undefined })
    }
    codeBuffer.length = 0
    codeLanguage = ''
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    const trimmed = line.trim()

    if (!inCode) {
      const codeStart = trimmed.match(/^```([a-zA-Z0-9_-]+)?\s*$/)
      if (codeStart) {
        flushText()
        inCode = true
        codeLanguage = codeStart[1] || ''
        continue
      }

      const alertMatch = line.match(alertStartRegex)
      if (alertMatch) {
        const alertMeta = getAlertMeta(alertMatch[1])

        if (alertMeta) {
          flushText()

          const alertLines: string[] = []
          const initialContent = alertMatch[2].trim()
          if (initialContent) {
            alertLines.push(initialContent)
          }

          while (lineIndex + 1 < lines.length) {
            const nextLine = lines[lineIndex + 1]
            const nextTrimmed = nextLine.trim()

            if (/^```([a-zA-Z0-9_-]+)?\s*$/.test(nextTrimmed)) break

            const nextAlertMatch = nextLine.match(alertStartRegex)
            if (nextAlertMatch && getAlertMeta(nextAlertMatch[1])) break

            alertLines.push(nextLine)
            lineIndex += 1
          }

          alerts.push({
            label: alertMeta.label,
            content: alertLines.join('\n').trim(),
            tone: alertMeta.tone
          })
          continue
        }
      }
    } else if (/^```\s*$/.test(trimmed)) {
      flushCode()
      inCode = false
      continue
    }

    if (inCode) {
      codeBuffer.push(line)
    } else {
      textBuffer.push(line)
    }
  }

  if (inCode) {
    flushCode()
  } else {
    flushText()
  }

  return { alerts, blocks }
}

const getCodeBlockLabel = (language?: string) => {
  const normalized = language?.trim().toLowerCase()
  if (!normalized) return 'Code'
  return LANGUAGE_LABELS[normalized] || normalized.toUpperCase()
}

// 从原始响应中提取“思考过程”部分
// 支持通过特定标记（如“步骤 1”、“分析 1”）识别思考开始，以及通过“结论”、“总结”识别思考结束
const processedThinking = computed(() => {
  if (props.thinkingText) return props.thinkingText

  const thinkingMarkers = [
    '分析 1：', '分析 1', '第 1 步', '步骤 1', '节点 A', '节点 B', '节点 C', '方案 1', '方案 2', '方案 3',
    '第 1 步', '第 2 步', '第 3 步', '分析：', '思考：', '步骤 1', '知识补全：', '节点 A（', '方案 A：',
    '节点 D', '节点 E', '节点 F', '节点 G', '节点 H', '节点 I', '节点 J', '节点 K', '节点 L', '节点 M', '节点 N', '节点 O', '节点 P', '节点 Q', '节点 R', '节点 S', '节点 T', '节点 U', '节点 V', '节点 W', '节点 X', '节点 Y', '节点 Z'
  ]

  const trimmedResponse = props.response.trim()
  const hasThinkingStart = thinkingMarkers.some(m => trimmedResponse.startsWith(m))

  if (!hasThinkingStart) {
    // Fallback: Check for common patterns at the beginning like "节点" or "分析"
    const startRegex = /^(\s*)(分析|第|步骤|节点|方案|Thought|Thinking|Knowledge|Step|思路|评估)/i
    if (!startRegex.test(trimmedResponse)) return ''
  }

  const conclusionMarkers = [
    '结论', '总结', '因此', '最终推荐', '最终建议', '最终输出', '最终决策',
    'Final Decision', 'Conclusion', 'Final Answer', 'Final Output', '评估结果', '决策说明', '代码输出', '最终方案', '最终选择'
  ]

  // Search for any conclusion marker followed by a colon (half or full width)
  const regex = new RegExp(`(${conclusionMarkers.join('|')})[:：]`, 'i')
  const match = props.response.match(regex)

  if (match && match.index !== undefined) {
    return props.response.slice(0, match.index).trim()
  }

  // If we suspect thinking but no specific conclusion marker, check for a clear break like double newline followed by code block or bold text
  const splitRegex = /\n\n(?=\*\*|选择|建议|因此)/
  const splitMatch = props.response.match(splitRegex)
  if (splitMatch && splitMatch.index !== undefined) {
    return props.response.slice(0, splitMatch.index).trim()
  }

  return ''
})

// 从原始响应中提取“实际回答”部分
const processedResponse = computed(() => {
  if (props.thinkingText) return stripResponsePrefix(props.response)

  const thinking = processedThinking.value
  if (!thinking) return stripResponsePrefix(props.response)

  // Finding the split point again to be precise
  const conclusionMarkers = [
    '结论', '总结', '因此', '最终推荐', '最终建议', '最终输出', '最终决策',
    'Final Decision', 'Conclusion', 'Final Answer', 'Final Output', '评估结果', '决策说明', '代码输出', '最终方案', '最终选择'
  ]
  const regex = new RegExp(`(${conclusionMarkers.join('|')})[:：]`, 'i')
  const match = props.response.match(regex)

  if (match && match.index !== undefined) {
    return stripResponsePrefix(props.response.slice(match.index).trim())
  }

  // Fallback split if we used the splitRegex
  const splitRegex = /\n\n(?=\*\*|选择|建议|因此)/
  const splitMatch = props.response.match(splitRegex)
  if (splitMatch && splitMatch.index !== undefined) {
    return stripResponsePrefix(props.response.slice(splitMatch.index).trim())
  }

  return stripResponsePrefix(props.response.slice(thinking.length).trim())
})

const parsedVisibleResponse = computed(() => parseResponseContent(visibleResponse.value))
const responseBlocks = computed(() => parsedVisibleResponse.value.blocks)
const responseAlerts = computed(() => parsedVisibleResponse.value.alerts)
const lastResponseBlock = computed(() => responseBlocks.value[responseBlocks.value.length - 1])
const parsedVisibleResponseAfterTool = computed(() => parseResponseContent(visibleResponseAfterTool.value))
const responseAfterToolBlocks = computed(() => parsedVisibleResponseAfterTool.value.blocks)
const lastResponseAfterToolBlock = computed(() => responseAfterToolBlocks.value[responseAfterToolBlocks.value.length - 1])

// 思考状态 UI 显示逻辑
const showThinkingState = computed(() => {
  return Boolean(processedThinking.value || visibleThinking.value || isThinking.value || hasFinishedThinking.value)
})

// 思考状态的文本标签
const thinkingStatusLabel = computed(() => {
  if (isThinking.value) return '深度思考中'
  if (hasFinishedThinking.value) return '深度思考完成'
  return '深度思考'
})

// 思考指示灯的 CSS 类名
const thinkingIndicatorClass = computed(() => {
  if (isThinking.value) {
    return 'thinking-led thinking-led--active'
  }

  if (hasFinishedThinking.value) {
    return 'thinking-led thinking-led--done'
  }

  return 'thinking-led thinking-led--idle'
})

const startStreaming = async (signal: AbortSignal) => {
  try {
    showPrompt.value = false
    showAiSection.value = false
    visiblePrompt.value = ''
    visibleResponse.value = ''
    visibleResponseAfterTool.value = ''
    visibleThinking.value = ''
    isThinking.value = false
    isTyping.value = false
    isComplete.value = false
    isThinkingCollapsed.value = true
    hasFinishedThinking.value = false
    thinkingAutoFollow.value = true
    responseAutoFollow.value = true
    parentAutoFollow.value = true
    toolCallState.value = 'idle'
    toolResultVisible.value = false
    isToolResultCollapsed.value = false
    activeToolCall.value = null

    if (!props.hidePrompt) {
      await sleep(140, signal)
      showPrompt.value = true
      visiblePrompt.value = props.prompt
    }

    // Only proceed to AI section if response is provided
    if (props.response && props.response.trim()) {
      await sleep(props.hidePrompt ? 120 : 240, signal)
      showAiSection.value = true
      isThinking.value = true

      const thinkText = processedThinking.value
      if (thinkText) {
        isThinkingCollapsed.value = false
        for (let i = 0; i <= thinkText.length; i++) {
          visibleThinking.value = thinkText.slice(0, i)
          await sleep(6 + Math.random() * 6, signal)
        }
        await sleep(1000, signal)
        hasFinishedThinking.value = true
        isThinkingCollapsed.value = true
      } else {
        await sleep(1200, signal)
      }

      isThinking.value = false

      const respText = processedResponse.value
      const toolEnvelope = extractToolCallEnvelope(respText)
      isTyping.value = true
      if (toolEnvelope) {
        const { beforeText, afterText, parsedTool, codeText } = toolEnvelope
        if (beforeText) {
          for (let i = 0; i <= beforeText.length; i++) {
            visibleResponse.value = beforeText.slice(0, i)
            await sleep(10 + Math.random() * 8, signal)
          }
        }

        activeToolCall.value = {
          name: parsedTool.name,
          raw: stripCodeFence(codeText),
          language: 'json'
        }

        toolCallState.value = 'running'
        await sleep(980, signal)
        toolCallState.value = 'success'

        if (parsedToolResult.value) {
          await sleep(220, signal)
          toolResultVisible.value = true
          await sleep(520, signal)
        }

        if (afterText) {
          for (let i = 0; i <= afterText.length; i++) {
            visibleResponseAfterTool.value = afterText.slice(0, i)
            await sleep(10 + Math.random() * 8, signal)
          }
        }
      } else {
        const responseSpeed = respText.length > 200 ? 10 : 18
        for (let i = 0; i <= respText.length; i++) {
          visibleResponse.value = respText.slice(0, i)
          await sleep(responseSpeed + Math.random() * 10, signal)
        }
      }
      isTyping.value = false
      isComplete.value = true
      emit('complete')
    } else {
      // No response, just end here
      isComplete.value = true
      emit('complete')
    }
  } catch {
    // Aborted
  }
}

const toggleThinking = () => {
  isThinkingCollapsed.value = !isThinkingCollapsed.value
}

const getToolCallStatusLabel = () => {
  if (toolCallState.value === 'running') return '调用中'
  if (toolCallState.value === 'success') return '调用成功'
  return '待执行'
}

const toggleToolResult = () => {
  isToolResultCollapsed.value = !isToolResultCollapsed.value
}

let observer: MutationObserver | null = null
const rootEl = ref<HTMLElement | null>(null)
const thinkingScrollEl = ref<HTMLElement | null>(null)
const responseScrollEl = ref<HTMLElement | null>(null)
let autoScrollFrame: number | null = null
let parentScrollEl: HTMLElement | null = null

const isElementNearBottom = (el: HTMLElement | null, threshold = AUTO_FOLLOW_THRESHOLD) => {
  if (!el) return true
  return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold
}

const syncAutoFollowState = (el: HTMLElement | null, autoFollow: { value: boolean }) => {
  autoFollow.value = isElementNearBottom(el)
}

// 将元素滚动到底部
const scrollElementToBottom = (el: HTMLElement | null, autoFollow: { value: boolean }) => {
  if (!el || !autoFollow.value) return
  el.scrollTop = el.scrollHeight
}

// 寻找最近的具有滚动能力的父元素
const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
  let node = el?.parentElement ?? null

  while (node) {
    if (node.classList.contains('custom-scrollbar-chat')) {
      return node
    }

    const style = window.getComputedStyle(node)
    const isScrollable = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight
    if (isScrollable) {
      return node
    }

    node = node.parentElement
  }

  return null
}

// 确保当前正在打字或显示的消息始终在可见区域内
const keepCurrentMessageInView = () => {
  const root = rootEl.value
  const parent = parentScrollEl ?? findScrollableParent(root)

  if (!root || !parent || !parentAutoFollow.value) return

  const rootRect = root.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  const overflowBottom = rootRect.bottom - parentRect.bottom
  const overflowTop = rootRect.top - parentRect.top

  if (overflowBottom > -20) {
    parent.scrollTop += overflowBottom + 36
  } else if (overflowTop < 12) {
    parent.scrollTop += overflowTop - 20
  }
}

const handleThinkingScroll = () => {
  syncAutoFollowState(thinkingScrollEl.value, thinkingAutoFollow)
}

const handleResponseScroll = () => {
  syncAutoFollowState(responseScrollEl.value, responseAutoFollow)
}

const handleParentScroll = () => {
  syncAutoFollowState(parentScrollEl, parentAutoFollow)
}

const bindParentScroll = () => {
  const nextParent = findScrollableParent(rootEl.value)

  if (parentScrollEl === nextParent) return

  if (parentScrollEl) {
    parentScrollEl.removeEventListener('scroll', handleParentScroll)
  }

  parentScrollEl = nextParent

  if (parentScrollEl) {
    syncAutoFollowState(parentScrollEl, parentAutoFollow)
    parentScrollEl.addEventListener('scroll', handleParentScroll, { passive: true })
  }
}

// 安排一次自动滚动（使用 requestAnimationFrame 以优化性能）
const queueAutoScroll = () => {
  if (autoScrollFrame !== null) return

  autoScrollFrame = window.requestAnimationFrame(() => {
    autoScrollFrame = null
    bindParentScroll()
    scrollElementToBottom(thinkingScrollEl.value, thinkingAutoFollow)
    scrollElementToBottom(responseScrollEl.value, responseAutoFollow)
    keepCurrentMessageInView()
  })
}

const findSection = (el: HTMLElement | null): HTMLElement | null => {
  let node = el
  while (node) {
    if (node.tagName === 'SECTION') return node
    node = node.parentElement
  }
  return null
}

const checkIfPresent = () => {
  const section = findSection(rootEl.value)
  if (!section) return

  const isPresent = section.classList.contains('present')
  if (isPresent && !hasStarted.value) {
    hasStarted.value = true
    abortController = new AbortController()
    startStreaming(abortController.signal)
  } else if (!isPresent && hasStarted.value) {
    hasStarted.value = false
    abortController?.abort()
  }
}

watch(
  [visiblePrompt, visibleThinking, visibleResponse, visibleResponseAfterTool, showAiSection, isThinkingCollapsed, hasFinishedThinking, toolResultVisible, activeToolCall],
  () => {
    queueAutoScroll()
  },
  { flush: 'post' }
)

onMounted(() => {
  bindParentScroll()
  const section = findSection(rootEl.value)
  if (!section) return
  observer = new MutationObserver(() => checkIfPresent())
  observer.observe(section, { attributes: true, attributeFilter: ['class'] })
  checkIfPresent()
})

onBeforeUnmount(() => {
  abortController?.abort()
  observer?.disconnect()
  if (parentScrollEl) {
    parentScrollEl.removeEventListener('scroll', handleParentScroll)
  }
  if (autoScrollFrame !== null) {
    window.cancelAnimationFrame(autoScrollFrame)
  }
})
</script>

<template>
  <div
    ref="rootEl"
    class="streaming-chat h-auto min-h-full flex flex-col rounded-[32px] overflow-hidden"
    :class="{ 'streaming-chat--embedded': props.hidePrompt }"
  >
    <!-- Prompt Section -->
    <div
      v-if="showPrompt"
      class="chat-message user-message shrink-0 p-6 pb-4 prompt-pop-in"
    >
      <div class="message-header flex items-center gap-2.5 mb-3 px-1">
        <div class="user-avatar w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle
              cx="12"
              cy="7"
              r="4"
            />
          </svg>
        </div>
        <span class="text-[11px] font-black tracking-[0.12em] text-blue-900/60">
          {{ promptLabel || 'Prompt' }}
        </span>
      </div>

      <div
        class="message-content prompt-shell rounded-[22px] p-4 shadow-sm border backdrop-blur-sm"
        :class="[
          variant === 'error' ? 'bg-red-50/70 border-red-100/70' : 'bg-white/48 border-white/60'
        ]"
      >
        <p class="text-[14px] leading-[1.65] text-slate-800 font-mono whitespace-pre-wrap">
          {{ visiblePrompt }}
        </p>
      </div>
    </div>

    <!-- AI Output Section -->
    <div
      v-if="showAiSection"
      class="chat-message ai-message flex-1 flex flex-col min-h-0 px-6 pb-6 pt-2"
    >
      <div class="message-header flex items-center justify-between mb-3 px-1">
        <div
          class="flex items-center"
          :class="props.hidePrompt ? 'gap-0' : 'gap-2.5'"
        >
          <div
            v-if="!props.hidePrompt"
            class="ai-avatar w-8 h-8 rounded-xl bg-white border border-slate-900/10 flex items-center justify-center shadow-lg overflow-hidden shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-[18px] h-[18px] text-black fill-current"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              >
                <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 0 0-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 0 1 .476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 0 1 4.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 0 1-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 0 0 5.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0 0 10.205 0a5.947 5.947 0 0 0-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 0 0 4.162 1.713z" />
            </svg>
          </div>
          <span
            class="text-[11px] font-black tracking-[0.12em]"
            :class="variant === 'error' ? 'text-red-900/60' : 'text-slate-500'"
          >
            {{ responseLabel || 'AI 输出' }}
          </span>
        </div>
      </div>

      <div class="message-content-wrapper flex flex-col gap-3 min-h-0">
        <!-- Collapsible Thinking Block -->
        <div
          v-if="showThinkingState"
          class="thinking-block shrink-0"
        >
          <div
            class="group relative flex flex-col gap-1.5 px-4 py-2.5 rounded-[18px] bg-slate-100/55 border border-slate-200/50 cursor-pointer hover:bg-slate-200/55 transition-all font-mono"
            :class="isThinkingCollapsed ? 'min-h-[40px]' : 'max-h-[220px]'"
            :aria-expanded="!isThinkingCollapsed"
            @click="toggleThinking"
          >
            <div class="flex min-h-[18px] items-center justify-between text-slate-400">
              <div class="flex min-w-0 items-center gap-2">
                <span
                  :class="thinkingIndicatorClass"
                  aria-hidden="true"
                />
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">
                  {{ thinkingStatusLabel }}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-3 h-3 transition-transform shrink-0"
                :class="{ 'rotate-180': !isThinkingCollapsed }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <div
              v-if="!isThinkingCollapsed && visibleThinking"
              ref="thinkingScrollEl"
              class="text-[12px] leading-relaxed text-slate-500 italic whitespace-pre-wrap overflow-auto custom-scrollbar"
              @scroll.passive="handleThinkingScroll"
            >
              {{ visibleThinking }}
            </div>
          </div>
        </div>

        <!-- Main Response Block -->
        <div
          ref="responseScrollEl"
          class="main-response flex-1 rounded-[22px] p-5 border min-h-[60px] relative overflow-auto custom-scrollbar"
          @scroll.passive="handleResponseScroll"
        >
          <div class="flex flex-col gap-3">
            <template
              v-for="(block, index) in responseBlocks"
              :key="`${block.type}-${index}`"
            >
              <div
                v-if="block.type === 'code'"
                class="response-code-shell overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div class="response-code-header flex items-center gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-rose-400" />
                    <span class="h-2 w-2 rounded-full bg-amber-400" />
                    <span class="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span class="ml-auto text-right text-[11px] font-bold tracking-[0.08em] text-slate-300">
                    {{ getCodeBlockLabel(block.language) }}
                  </span>
                </div>
                <div class="response-code-block overflow-x-auto px-4 py-3.5">
                  <code class="block text-[13px] leading-[1.65] text-slate-100 font-mono whitespace-pre">{{ block.content }}</code>
                </div>
              </div>

              <p
                v-else
                class="text-[14px] leading-[1.7] text-slate-800 font-mono whitespace-pre-wrap"
              >
                {{ block.content }}<span
                  v-if="!isComplete && lastResponseBlock?.type === 'text' && index === responseBlocks.length - 1"
                  class="typing-cursor ml-0.5"
                />
              </p>
            </template>

            <div
              v-if="activeToolCall"
              class="tool-call-shell overflow-hidden rounded-[20px] border"
              :class="toolCallState === 'running'
                ? 'border-amber-200/90 bg-amber-50/70'
                : 'border-emerald-200/90 bg-emerald-50/70'"
            >
              <div
                class="flex items-center gap-3 px-4 py-3 border-b"
                :class="toolCallState === 'running'
                  ? 'border-amber-200/80 bg-amber-100/45 text-amber-900'
                  : 'border-emerald-200/80 bg-emerald-100/45 text-emerald-900'"
              >
                <span
                  class="tool-call-led h-2.5 w-2.5 shrink-0 rounded-full"
                  :class="toolCallState === 'running' ? 'tool-call-led--running' : 'tool-call-led--success'"
                />
                <p class="text-[11px] font-black uppercase tracking-[0.16em]">
                  工具调用
                </p>
                <span class="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] bg-white/70">
                  {{ getToolCallStatusLabel() }}
                </span>
                <span class="ml-auto text-[12px] font-semibold">
                  {{ activeToolCall.name }}
                </span>
              </div>

              <div class="space-y-3 px-4 py-3.5">
                <div class="response-code-shell overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div class="response-code-header flex items-center gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <span class="h-2 w-2 rounded-full bg-rose-400" />
                      <span class="h-2 w-2 rounded-full bg-amber-400" />
                      <span class="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <span class="ml-auto text-right text-[11px] font-bold tracking-[0.08em] text-slate-300">
                      {{ getCodeBlockLabel(activeToolCall.language) }}
                    </span>
                  </div>
                  <div class="response-code-block overflow-x-auto px-4 py-3.5">
                    <code class="block text-[13px] leading-[1.65] text-slate-100 font-mono whitespace-pre">{{ activeToolCall.raw }}</code>
                  </div>
                </div>

                <div
                  v-if="toolResultVisible && parsedToolResult"
                  class="overflow-hidden rounded-[18px] border border-emerald-200/80 bg-emerald-50/60"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold tracking-[0.08em] text-emerald-800"
                    @click="toggleToolResult"
                  >
                    <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
                    <span>{{ toolResultLabel || '工具返回结果' }}</span>
                    <span class="ml-auto text-[11px] text-emerald-700/80">
                      {{ isToolResultCollapsed ? '展开' : '收起' }}
                    </span>
                  </button>

                  <transition name="fold-panel">
                    <div
                      v-if="!isToolResultCollapsed"
                      class="border-t border-emerald-200/70 px-4 py-3"
                    >
                      <div
                        v-if="parsedToolResult.kind === 'code'"
                        class="response-code-shell overflow-hidden rounded-[16px] border border-slate-200 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      >
                        <div class="response-code-header flex items-center gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
                          <div class="flex items-center gap-2">
                            <span class="h-2 w-2 rounded-full bg-rose-400" />
                            <span class="h-2 w-2 rounded-full bg-amber-400" />
                            <span class="h-2 w-2 rounded-full bg-emerald-400" />
                          </div>
                          <span class="ml-auto text-right text-[11px] font-bold tracking-[0.08em] text-slate-300">
                            {{ getCodeBlockLabel(parsedToolResult.language) }}
                          </span>
                        </div>
                        <div class="response-code-block overflow-x-auto px-4 py-3.5">
                          <code class="block text-[13px] leading-[1.65] text-slate-100 font-mono whitespace-pre">{{ parsedToolResult.content }}</code>
                        </div>
                      </div>

                      <div
                        v-else
                        class="rounded-[14px] border border-emerald-200/70 bg-white/80 px-3 py-2.5"
                      >
                        <p class="whitespace-pre-wrap text-[13px] leading-[1.65] text-slate-700">
                          {{ parsedToolResult.content }}
                        </p>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
            </div>

            <template
              v-for="(block, index) in responseAfterToolBlocks"
              :key="`after-tool-${block.type}-${index}`"
            >
              <div
                v-if="block.type === 'code'"
                class="response-code-shell overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div class="response-code-header flex items-center gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-rose-400" />
                    <span class="h-2 w-2 rounded-full bg-amber-400" />
                    <span class="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span class="ml-auto text-right text-[11px] font-bold tracking-[0.08em] text-slate-300">
                    {{ getCodeBlockLabel(block.language) }}
                  </span>
                </div>
                <div class="response-code-block overflow-x-auto px-4 py-3.5">
                  <code class="block text-[13px] leading-[1.65] text-slate-100 font-mono whitespace-pre">{{ block.content }}</code>
                </div>
              </div>

              <p
                v-else
                class="text-[14px] leading-[1.7] text-slate-800 font-mono whitespace-pre-wrap"
              >
                {{ block.content }}<span
                  v-if="!isComplete && lastResponseAfterToolBlock?.type === 'text' && index === responseAfterToolBlocks.length - 1"
                  class="typing-cursor ml-0.5"
                />
              </p>
            </template>

            <p
              v-if="!responseBlocks.length && !activeToolCall && !isComplete && (visibleResponse || !isThinking)"
              class="text-[14px] leading-[1.7] text-slate-800 font-mono whitespace-pre-wrap"
            >
              <span class="typing-cursor ml-0.5" />
            </p>

            <div
              v-if="!isComplete && !activeToolCall && lastResponseBlock?.type === 'code'"
              class="text-slate-700"
            >
              <span class="typing-cursor ml-0.5" />
            </div>
          </div>
        </div>

        <div
          v-for="(alert, index) in responseAlerts"
          :key="`${alert.label}-${index}-${alert.content}`"
          class="response-alert shrink-0 flex items-start gap-3 rounded-[18px] border px-4 py-3.5 shadow-sm"
          :class="alert.tone === 'info'
            ? 'border-blue-200/80 bg-blue-50/72'
            : 'border-amber-200/80 bg-amber-50/80'"
        >
          <div
            class="response-alert__icon mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            :class="alert.tone === 'info'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <template v-if="alert.tone === 'info'">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </template>
              <template v-else>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </template>
            </svg>
          </div>
          <div class="min-w-0">
            <p
              class="text-[10px] font-black uppercase tracking-[0.16em]"
              :class="alert.tone === 'info' ? 'text-blue-700/80' : 'text-amber-700/80'"
            >
              {{ alert.label }}
            </p>
            <p class="mt-1 text-[13px] leading-[1.65] text-slate-700 whitespace-pre-wrap">
              {{ alert.content }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streaming-chat {
  position: relative;
  isolation: isolate;
  border: 1px solid rgba(226, 236, 250, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(241, 247, 255, 0.08)),
    radial-gradient(circle at top right, rgba(152, 191, 255, 0.2), transparent 26%),
    radial-gradient(circle at left center, rgba(255, 255, 255, 0.12), transparent 34%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 18px 44px rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(24px) saturate(1.06);
}

.streaming-chat::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 34%),
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.24), transparent 30%);
}

.streaming-chat::after {
  position: absolute;
  inset: 16px;
  content: '';
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 24px;
  box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.1);
}

.streaming-chat--embedded {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  border-radius: 0;
}

.streaming-chat--embedded::before,
.streaming-chat--embedded::after {
  display: none;
}

.chat-message {
  opacity: 0;
  transform: translateY(10px);
}

.prompt-pop-in {
  animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: translateX(-40px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.ai-message {
  animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.prompt-shell {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(249, 251, 255, 0.62));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 12px 30px rgba(148, 163, 184, 0.08);
}

.main-response {
  border-color: rgba(255, 255, 255, 0.68);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.44), rgba(244, 248, 255, 0.22));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 14px 36px rgba(148, 163, 184, 0.06);
  backdrop-filter: blur(18px) saturate(1.04);
}

.streaming-chat--embedded .ai-message {
  padding: 0 0 4px;
}

.streaming-chat--embedded .message-header {
  margin-bottom: 10px;
}

.streaming-chat--embedded .main-response {
  border-color: rgba(235, 242, 255, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(244, 248, 255, 0.32)),
    radial-gradient(circle at top right, rgba(198, 218, 255, 0.18), transparent 28%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 18px 42px rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(16px) saturate(1.03);
}

.streaming-chat--embedded .thinking-block > div {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(244, 248, 255, 0.24));
  border-color: rgba(235, 242, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.streaming-chat--embedded .tool-call-shell {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 14px 32px rgba(148, 163, 184, 0.06);
  backdrop-filter: blur(12px);
}

@keyframes slide-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: var(--r-main-color, #1e293b);
  vertical-align: middle;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.1);
}

.response-code-block::-webkit-scrollbar {
  height: 6px;
}

.response-code-block::-webkit-scrollbar-track {
  background: transparent;
}

.response-code-block::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
}

.response-code-block::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.55);
}

.thinking-led {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  flex-shrink: 0;
  transition: background-color 220ms ease, opacity 220ms ease, transform 220ms ease;
}

.thinking-led--idle {
  background: #cbd5e1;
  opacity: 0.9;
}

.thinking-led--active {
  background: #3b82f6;
  animation: thinking-led-pulse 1.4s ease-in-out infinite;
}

.thinking-led--done {
  background: #22c55e;
}

.tool-call-led--running {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
  animation: thinking-led-pulse 1.2s ease-in-out infinite;
}

.tool-call-led--success {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
}

.fold-panel-enter-active,
.fold-panel-leave-active {
  transition: all 220ms ease;
  overflow: hidden;
}

.fold-panel-enter-from,
.fold-panel-leave-to {
  opacity: 0;
  max-height: 0;
}

.fold-panel-enter-to,
.fold-panel-leave-from {
  opacity: 1;
  max-height: 320px;
}

@keyframes thinking-led-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}
</style>
