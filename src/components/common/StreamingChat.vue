<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps<{
  prompt: string
  response: string
  thinkingText?: string
  promptLabel?: string
  responseLabel?: string
  autoStart?: boolean
  variant?: 'default' | 'error' | 'success' | 'warning'
  compact?: boolean
}>()

const showPrompt = ref(false)
const showAiSection = ref(false)
const visiblePrompt = ref('')
const visibleResponse = ref('')
const visibleThinking = ref('')
const isThinking = ref(false)
const isTyping = ref(false)
const isComplete = ref(false)
const hasStarted = ref(false)
const isThinkingCollapsed = ref(true)
const hasFinishedThinking = ref(false)

let abortController: AbortController | null = null

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('Aborted'))
    })
  })

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

const processedResponse = computed(() => {
  const thinking = processedThinking.value
  if (!thinking) return props.response

  // Finding the split point again to be precise
  const conclusionMarkers = [
    '结论', '总结', '因此', '最终推荐', '最终建议', '最终输出', '最终决策',
    'Final Decision', 'Conclusion', 'Final Answer', 'Final Output', '评估结果', '决策说明', '代码输出', '最终方案', '最终选择'
  ]
  const regex = new RegExp(`(${conclusionMarkers.join('|')})[:：]`, 'i')
  const match = props.response.match(regex)

  if (match && match.index !== undefined) {
    return props.response.slice(match.index).trim()
  }

  // Fallback split if we used the splitRegex
  const splitRegex = /\n\n(?=\*\*|选择|建议|因此)/
  const splitMatch = props.response.match(splitRegex)
  if (splitMatch && splitMatch.index !== undefined) {
    return props.response.slice(splitMatch.index).trim()
  }

  return props.response.slice(thinking.length).trim()
})

const startStreaming = async (signal: AbortSignal) => {
  try {
    showPrompt.value = false
    showAiSection.value = false
    visiblePrompt.value = ''
    visibleResponse.value = ''
    visibleThinking.value = ''
    isThinking.value = false
    isTyping.value = false
    isComplete.value = false
    isThinkingCollapsed.value = true
    hasFinishedThinking.value = false

    await sleep(400, signal)
    showPrompt.value = true

    isTyping.value = true
    for (let i = 0; i <= props.prompt.length; i++) {
      visiblePrompt.value = props.prompt.slice(0, i)
      await sleep(15 + Math.random() * 10, signal)
    }
    isTyping.value = false

    // Only proceed to AI section if response is provided
    if (props.response && props.response.trim()) {
      await sleep(800, signal)
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
        isThinkingCollapsed.value = true
        hasFinishedThinking.value = true
      } else {
        await sleep(1200, signal)
      }

      isThinking.value = false

      const respText = processedResponse.value
      isTyping.value = true
      const responseSpeed = respText.length > 200 ? 10 : 20
      for (let i = 0; i <= respText.length; i++) {
        visibleResponse.value = respText.slice(0, i)
        await sleep(responseSpeed + Math.random() * 10, signal)
      }
      isTyping.value = false
      isComplete.value = true
    } else {
      // No response, just end here
      isComplete.value = true
    }
  } catch {
    // Aborted
  }
}

const toggleThinking = () => {
  isThinkingCollapsed.value = !isThinkingCollapsed.value
}

let observer: MutationObserver | null = null
const rootEl = ref<HTMLElement | null>(null)

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

onMounted(() => {
  const section = findSection(rootEl.value)
  if (!section) return
  observer = new MutationObserver(() => checkIfPresent())
  observer.observe(section, { attributes: true, attributeFilter: ['class'] })
  checkIfPresent()
})

onBeforeUnmount(() => {
  abortController?.abort()
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="rootEl"
    class="streaming-chat h-full flex flex-col bg-slate-50/40 rounded-[32px] border border-slate-200/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden"
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
        <span class="text-[11px] font-black uppercase tracking-[0.15em] text-blue-900/60">
          {{ promptLabel || 'PROMPT' }}
        </span>
      </div>

      <div
        class="message-content rounded-[20px] p-4 shadow-sm border backdrop-blur-sm"
        :class="[
          variant === 'error' ? 'bg-red-50/90 border-red-100/80' : 'bg-white/90 border-slate-100/80'
        ]"
      >
        <p class="text-[14px] leading-[1.65] text-slate-800 font-mono whitespace-pre-wrap">
          {{ visiblePrompt }}<span
            v-if="isTyping && !showAiSection"
            class="typing-cursor ml-0.5"
          />
        </p>
      </div>
    </div>

    <!-- AI Output Section -->
    <div
      v-if="showAiSection"
      class="chat-message ai-message flex-1 flex flex-col min-h-0 px-6 pb-6 pt-2"
    >
      <div class="message-header flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2.5">
          <div class="ai-avatar w-8 h-8 rounded-xl bg-[#000000] border border-white/10 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
            <svg
              viewBox="0 0 24 24"
              class="w-[20px] h-[20px] text-white fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22.28 9.82a6.01 6.01 0 0 0-.52-4.91 6.04 6.04 0 0 0-4.45-3.21A6.015 6.015 0 0 0 9.63 5.7a6.056 6.056 0 0 0-7.53 5.83c0 2.21 1.25 4.13 3.1 5.09a6.007 6.007 0 0 0 4.23 5.21c1.65.6 3.5.38 4.93-.52a6.05 6.05 0 0 0 5.1 2.93c2.25 0 4.19-1.3 5.11-3.11a6.01 6.01 0 0 0 3.15-7.44 5.992 5.992 0 0 0 3.018-7.382v.002ZM18.78 19.34a4.265 4.265 0 0 1-5.74-2.15l-1.4 2.43a.125.125 0 0 1-.22 0l-4.23-7.34l.11-.06l4.23 7.34a.125.125 0 0 1 0 .22l-1.42 2.46a4.256 4.256 0 1 1-1.35-6.19l4.47-2.58a.125.125 0 0 1 .19.11l-.001 4.87l.13.07l-.001-4.87a.125.125 0 0 1 .19-.11l1.42 1.96a4.256 4.256 0 1 1 3.85 6.35" />
            </svg>
          </div>
          <span
            class="text-[11px] font-black uppercase tracking-[0.15em]"
            :class="variant === 'error' ? 'text-red-900/60' : 'text-slate-500'"
          >
            {{ responseLabel || 'AI 输出' }}
          </span>
        </div>
        <div
          v-if="isThinking || visibleThinking"
          class="thinking-chip px-3 py-1 rounded-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 flex items-center gap-2 shadow-sm transition-all duration-300 transform active:scale-95 cursor-pointer hover:bg-white select-none"
          :class="{ 'bg-blue-50/80 border-blue-100/50': !hasFinishedThinking }"
          @click="toggleThinking"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <div
              v-if="!hasFinishedThinking"
              class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"
            />
            <svg
              v-else
              class="w-3.5 h-3.5 text-blue-500/80 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span class="text-[11px] font-bold text-slate-600 truncate">
              {{ hasFinishedThinking ? '✓ 思考已完成' : '深度思考中...' }}
            </span>
          </div>
        </div>
      </div>

      <div class="message-content-wrapper flex flex-col gap-3 min-h-0">
        <!-- Collapsible Thinking Block -->
        <div
          v-if="visibleThinking"
          class="thinking-block shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
          :class="isThinkingCollapsed ? 'max-h-12' : 'max-h-[300px]'"
        >
          <div
            class="group relative flex flex-col gap-2 p-3 rounded-2xl bg-slate-100/50 border border-slate-200/40 cursor-pointer hover:bg-slate-200/50 transition-all font-mono"
            @click="toggleThinking"
          >
            <div class="flex items-center justify-between text-slate-400">
              <div class="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span class="text-[10px] font-bold uppercase tracking-widest">{{ isThinkingCollapsed ? '显示思考过程' : '收起思考过程' }}</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-3 h-3 transition-transform"
                :class="{ 'rotate-180': !isThinkingCollapsed }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <div
              class="text-[12px] leading-relaxed text-slate-500 italic whitespace-pre-wrap overflow-hidden"
              :class="{ 'line-clamp-1': isThinkingCollapsed }"
            >
              {{ visibleThinking }}
            </div>
          </div>
        </div>

        <!-- Main Response Block -->
        <div class="main-response flex-1 bg-white/60 backdrop-blur-md rounded-[20px] p-5 border border-white/80 shadow-sm min-h-[60px] relative overflow-auto custom-scrollbar">
          <p class="text-[14px] leading-[1.7] text-slate-800 font-mono whitespace-pre-wrap">
            {{ visibleResponse }}<span
              v-if="!isComplete && (visibleResponse || !isThinking)"
              class="typing-cursor ml-0.5"
            />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
