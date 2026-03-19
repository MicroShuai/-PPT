<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StreamingChat from '@/components/common/StreamingChat.vue'
import type { FlowSlidePayload } from '@/types/slide'

type RuntimeChatItem = NonNullable<FlowSlidePayload['runtimeChat']>[number]

type RenderedStep
  = { key: string, type: 'user', label: string, content: string }
  | { key: string, type: 'model', index: number, item: RuntimeChatItem, toolResultText?: string, toolResultLabel?: string }

const props = defineProps<{
  conversation: NonNullable<FlowSlidePayload['runtimeChat']>
}>()

const renderedSteps = ref<RenderedStep[]>([])
const rootEl = ref<HTMLElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const autoFollow = ref(true)

let observer: MutationObserver | null = null
let playbackAbortController: AbortController | null = null
let scrollFrame: number | null = null
let activeModelResolver: (() => void) | null = null

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new Error('Aborted'))
    })
  })

const userTask = computed(() => props.conversation[0])
const hasToolCall = (value: string) => /"tool_call"\s*:/.test(value)

const isNearBottom = (el: HTMLElement | null, threshold = 24) => {
  if (!el) return true
  return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold
}

const queueAutoScroll = () => {
  if (scrollFrame !== null) return

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null
    if (!scrollEl.value || !autoFollow.value) return
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

const handleScroll = () => {
  autoFollow.value = isNearBottom(scrollEl.value)
}

const resetPlayback = () => {
  renderedSteps.value = []
  activeModelResolver = null
  autoFollow.value = true
  queueAutoScroll()
}

const waitForModelComplete = (signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      activeModelResolver = null
      reject(new Error('Aborted'))
    }

    activeModelResolver = () => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })

const handleModelComplete = (index: number) => {
  const latestModel = [...renderedSteps.value].reverse().find(step => step.type === 'model') as RenderedStep | undefined
  if (!latestModel || latestModel.type !== 'model' || latestModel.index !== index) return
  activeModelResolver?.()
  activeModelResolver = null
}

const findSection = (el: HTMLElement | null): HTMLElement | null => {
  let node = el
  while (node) {
    if (node.tagName === 'SECTION') return node
    node = node.parentElement
  }
  return null
}

const playConversation = async (signal: AbortSignal) => {
  resetPlayback()

  const firstPrompt = userTask.value
  if (!firstPrompt) return

  try {
    await sleep(120, signal)
    renderedSteps.value.push({
      key: 'user-task',
      type: 'user',
      label: firstPrompt.promptLabel || '用户任务',
      content: firstPrompt.prompt
    })
    queueAutoScroll()

    await sleep(220, signal)

    for (let index = 0; index < props.conversation.length; index += 1) {
      const current = props.conversation[index]
      const next = props.conversation[index + 1]

      renderedSteps.value.push({
        key: `model-${index}`,
        type: 'model',
        index,
        item: current,
        toolResultText: hasToolCall(current.response) ? next?.prompt : undefined,
        toolResultLabel: hasToolCall(current.response) ? next?.promptLabel : undefined
      })
      queueAutoScroll()

      await waitForModelComplete(signal)

      await sleep(720, signal)
    }
  } catch {
    return
  }
}

const syncPlayback = () => {
  const section = findSection(rootEl.value)
  if (!section) return

  const isPresent = section.classList.contains('present')

  if (!isPresent) {
    playbackAbortController?.abort()
    playbackAbortController = null
    resetPlayback()
    return
  }

  if (playbackAbortController || renderedSteps.value.length > 0) return

  playbackAbortController = new AbortController()
  void playConversation(playbackAbortController.signal).finally(() => {
    playbackAbortController = null
  })
}

watch(renderedSteps, () => {
  queueAutoScroll()
}, { deep: true, flush: 'post' })

onMounted(() => {
  const section = findSection(rootEl.value)
  if (!section) return
  observer = new MutationObserver(() => syncPlayback())
  observer.observe(section, { attributes: true, attributeFilter: ['class'] })
  syncPlayback()
})

onBeforeUnmount(() => {
  playbackAbortController?.abort()
  observer?.disconnect()
  if (scrollFrame !== null) {
    window.cancelAnimationFrame(scrollFrame)
  }
})
</script>

<template>
  <div
    ref="rootEl"
    class="agent-runtime-demo h-full min-h-0"
  >
    <div
      ref="scrollEl"
      class="agent-runtime-demo__scroll custom-scrollbar-chat h-full overflow-auto pr-1"
      @scroll.passive="handleScroll"
    >
      <div class="relative space-y-4 pb-5">
        <div
          v-for="step in renderedSteps"
          :key="step.key"
          class="agent-runtime-demo__row grid grid-cols-[52px_minmax(0,1fr)] gap-4"
        >
          <div class="relative flex justify-center">
            <div
              class="agent-runtime-demo__icon z-10 flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm"
              :class="step.type === 'user'
                ? 'border-blue-200 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-800'"
            >
              <svg
                v-if="step.type === 'user'"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
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
              <svg
                v-else
                viewBox="0 0 24 24"
                class="h-[18px] w-[18px] fill-current"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 0 0-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 0 1 .476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 0 1 4.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 0 1-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 0 0 5.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0 0 10.205 0a5.947 5.947 0 0 0-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 0 0 4.162 1.713z" />
              </svg>
            </div>
            <div class="absolute top-11 bottom-[-20px] left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-blue-200 via-slate-200 to-slate-100" />
          </div>

          <div v-if="step.type === 'user'" class="agent-card agent-card--user">
            <div class="mb-3 flex items-center gap-2.5">
              <span class="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
                {{ step.label }}
              </p>
            </div>
            <div class="whitespace-pre-wrap text-[14px] leading-7 text-slate-700">
              {{ step.content }}
            </div>
          </div>

          <StreamingChat
            v-else
            :key="step.key"
            :prompt="step.item.prompt"
            :response="step.item.response"
            :thinking-text="step.item.thinkingText"
            :response-label="step.item.responseLabel || 'AI 输出'"
            :tool-result-text="step.toolResultText"
            :tool-result-label="step.toolResultLabel"
            hide-prompt
            auto-start
            @complete="handleModelComplete(step.index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(233, 240, 252, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(244, 248, 255, 0.36)),
    radial-gradient(circle at top right, rgba(189, 214, 255, 0.16), transparent 28%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 14px 30px rgba(148, 163, 184, 0.06);
  backdrop-filter: blur(18px) saturate(1.03);
  padding: 20px 22px;
}

.agent-card::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent 42%);
}

</style>
