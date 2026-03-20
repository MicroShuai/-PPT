<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import SlideShell from '@/components/common/SlideShell.vue'
import AgentRuntimeDemo from '@/components/common/AgentRuntimeDemo.vue'
import { useSlideMotion } from '@/composables/useSlideMotion'
import { renderMermaid } from '@/lib/mermaid'
import type { FlowSlideDefinition } from '@/types/slide'

const props = defineProps<{
  slide: FlowSlideDefinition
}>()

const diagramRef = ref<HTMLDivElement | null>(null); // Mermaid 图表容器引用
const layout = computed(() => props.slide.variant ?? 'route'); // 流程图布局变体
const isPromptChainingSlide = computed(() => props.slide.id === 'prompt-chaining')
const isArtSlide = computed(() => props.slide.id === 'art'); // 是否为 ART (Automatic Reasoning and Tool-use) 幻灯片
const isReactSlide = computed(() => props.slide.id === 'react')
const isReasoningToolOverviewSlide = computed(() => isArtSlide.value)
const isRuntimeLoopSlide = computed(() => ['art-runtime', 'react-execution-map'].includes(props.slide.id))
const storyboard = computed(() => props.slide.payload.storyboard); // 故事板数据（用于逐步演示）
const promptChainContent = computed(() => props.slide.payload.promptChain)
const checkpoints = computed(() => props.slide.payload.checkpoints ?? []); // 流程关键节点
const challengePoints = computed(() => props.slide.payload.challenge ?? []); // 面临的挑战或痛点
const takeawayLabel = computed(() => props.slide.payload.takeawayLabel ?? 'Tips'); // 金句/提示标签
const artTips = computed(() => props.slide.payload.tips ?? []); // ART 页额外 tips
const runtimeSequence = computed(() => props.slide.payload.runtimeSequence ?? []); // ART 静态执行链路
const runtimeChat = computed(() => props.slide.payload.runtimeChat ?? [])
const hasDiagram = computed(() => Boolean(props.slide.payload.mermaid)); // 是否包含 Mermaid 流程图定义
const isBareDiagram = computed(() => layout.value === 'diagram-only' && props.slide.hideHeader); // 纯图表模式（隐藏标题）
const { motion } = useSlideMotion(toRef(props, 'slide')); // 动画控制
const runtimeResultOpen = ref<Record<number, boolean>>({})
const runtimeVisibleCount = ref(isRuntimeLoopSlide.value ? 0 : runtimeSequence.value.length)
const runtimeIsPlaying = ref(false)
const runtimeActiveIndex = ref(-1)
const runtimeCompletedCount = ref(0)
const runtimeVisibleBody = ref<Record<number, string>>({})
const runtimeVisibleCode = ref<Record<number, string>>({})
const runtimeVisibleResult = ref<Record<number, string>>({})
const runtimeRootEl = ref<HTMLElement | null>(null)
const runtimeScrollEl = ref<HTMLElement | null>(null)
let runtimeObserver: MutationObserver | null = null
let runtimeAbortController: AbortController | null = null
let runtimeScrollFrame: number | null = null

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('Aborted'))
    })
  })

const findSection = (el: HTMLElement | null): HTMLElement | null => {
  let node = el
  while (node) {
    if (node.tagName === 'SECTION') return node
    node = node.parentElement
  }
  return null
}

const stopRuntimeSequence = () => {
  runtimeAbortController?.abort()
  runtimeAbortController = null
  runtimeIsPlaying.value = false
}

const queueRuntimeScroll = () => {
  if (runtimeScrollFrame !== null) return
  runtimeScrollFrame = window.requestAnimationFrame(() => {
    runtimeScrollFrame = null
    if (!runtimeScrollEl.value) return
    runtimeScrollEl.value.scrollTop = runtimeScrollEl.value.scrollHeight
  })
}

const resetRuntimeSequence = () => {
  runtimeVisibleCount.value = 0
  runtimeActiveIndex.value = -1
  runtimeCompletedCount.value = 0
  runtimeIsPlaying.value = false
  runtimeVisibleBody.value = {}
  runtimeVisibleCode.value = {}
  runtimeVisibleResult.value = {}
  runtimeResultOpen.value = {}
  queueRuntimeScroll()
}

async function revealRuntimeText(
  target: typeof runtimeVisibleBody,
  index: number,
  content: string | undefined,
  signal: AbortSignal,
  delay = 120
): Promise<void> {
  if (!content) return

  target.value[index] = content
  queueRuntimeScroll()
  await sleep(delay, signal)
}

const startRuntimeSequence = async (signal: AbortSignal) => {
  resetRuntimeSequence()
  runtimeIsPlaying.value = true

  try {
    for (let index = 0; index < runtimeSequence.value.length; index += 1) {
      const currentItem = runtimeSequence.value[index]
      runtimeVisibleCount.value = index + 1
      runtimeActiveIndex.value = index
      runtimeResultOpen.value[index] = true

      await sleep(220, signal)
      await revealRuntimeText(runtimeVisibleBody, index, currentItem?.body, signal, currentItem?.type === 'user' ? 80 : 120)

      if (currentItem?.codeBlock?.code) {
        await sleep(180, signal)
        await revealRuntimeText(runtimeVisibleCode, index, currentItem.codeBlock.code, signal, currentItem?.type === 'tool' ? 520 : 140)
      }

      if (currentItem?.result?.content) {
        await sleep(180, signal)
        await revealRuntimeText(runtimeVisibleResult, index, currentItem.result.content, signal, 180)
      }

      runtimeCompletedCount.value = index + 1
      runtimeActiveIndex.value = -1

      const gapMs = currentItem?.type === 'final' ? 0 : 420
      if (gapMs > 0) {
        await sleep(gapMs, signal)
      }
    }
  } catch {
    return
  }

  runtimeActiveIndex.value = -1
  runtimeIsPlaying.value = false
}

const syncRuntimePlayback = () => {
  if (!isRuntimeLoopSlide.value) return
  if (runtimeChat.value.length > 0) return

  const section = findSection(runtimeRootEl.value)
  if (!section) return

  const isPresent = section.classList.contains('present')

  if (!isPresent) {
    stopRuntimeSequence()
    resetRuntimeSequence()
    return
  }

  if (runtimeAbortController || runtimeVisibleCount.value === runtimeSequence.value.length) {
    return
  }

  runtimeAbortController = new AbortController()
  void startRuntimeSequence(runtimeAbortController.signal).finally(() => {
    runtimeAbortController = null
  })
}

const rootLayoutClass = computed(() => {
  if (layout.value === 'loop') {
    return 'grid-cols-[1.18fr_0.82fr]'
  }

  if (layout.value === 'runtime') {
    return 'grid-cols-[1.02fr_0.98fr]'
  }

  return 'grid-cols-[1.08fr_0.92fr]'
})

const leftColumnClass = computed(() =>
  layout.value === 'control' ? 'grid-rows-[auto_auto_1fr]' : 'grid-rows-[auto_1fr]'
)

const sideColumnClass = computed(() =>
  checkpoints.value.length > 0 ? 'grid-rows-[1fr_auto]' : 'grid-rows-[auto]'
)

const artLogicSteps = [
  {
    key: 'Reason',
    title: '识别弱项',
    detail: '遇到实时事实或精确计算时，不靠模型硬猜。',
    tone: 'blue'
  },
  {
    key: 'Action',
    title: '调用工具',
    detail: '把 SQL、接口请求或数学表达式交给外部工具执行。',
    tone: 'emerald'
  },
  {
    key: 'Observation',
    title: '回收结果',
    detail: '拿到真实返回值后，再继续判断并生成结论。',
    tone: 'slate'
  }
] as const

const artCaseStats = [
  {
    label: '数据来源',
    value: '实时查库'
  },
  {
    label: '判断方式',
    value: '查库 + 精算'
  },
  {
    label: '验收标准',
    value: '损耗率 < 2%'
  }
] as const

const artDecisionChecklist = [
  '先拿到批次真实领料与实际消耗，再做判断。',
  '损耗率需要用精确计算结果，而不是语言模型估算。',
  '最终输出必须给出是否超标和可执行结论。'
] as const

const artScenarioFits = [
  {
    title: '精准计算',
    detail: '涉及阈值、比例、金额等不能靠语言模型估算的判断。'
  },
  {
    title: '实时状态查询',
    detail: '必须先查数据库、设备状态或接口返回，不能凭空生成。'
  },
  {
    title: '外部系统集成',
    detail: '要把 API / 工具结果接回推理链路，继续完成结论。'
  }
] as const

const artOutputNotes = [
  {
    label: '输出内容',
    value: '是否超标 + 可执行结论'
  },
  {
    label: '结果依据',
    value: '查库结果 + 精确计算'
  }
] as const

const reactLogicSteps = [
  {
    key: 'Thought',
    title: '判断证据缺口',
    detail: '先判断缺的是监控、日志，还是代码证据。',
    tone: 'blue'
  },
  {
    key: 'Action',
    title: '调用排障工具',
    detail: '调用监控、日志或检索工具，拿到真实证据。',
    tone: 'emerald'
  },
  {
    key: 'Observation',
    title: '更新下一步',
    detail: '根据返回结果修正判断，再决定下一步。',
    tone: 'slate'
  }
] as const

const reactCaseStats = [
  {
    label: '工具数量',
    value: '3 个'
  },
  {
    label: '推进方式',
    value: '多轮取证'
  },
  {
    label: '输出目标',
    value: '根因 + 修复建议'
  }
] as const

const reactDecisionChecklist = [
  '没有 Observation 前，不要提前猜结论。',
  '每轮 Observation 都要反过来驱动下一轮 Thought。',
  '最终输出必须带上根因、改法和验证方式。'
] as const

const reactScenarioFits = [
  {
    title: '线上故障排查',
    detail: '适合数据库死锁、接口超时、消息堆积等需要逐轮取证的问题。'
  },
  {
    title: '多系统联动分析',
    detail: '当日志、监控、代码仓和链路追踪分散在不同系统时，ReAct 更容易整合证据。'
  },
  {
    title: 'Agent 执行任务',
    detail: '让模型在工具结果驱动下动态调整下一步，而不是一次性生成拍脑袋答案。'
  }
] as const

const reactOutputNotes = [
  {
    label: '输出内容',
    value: '根因定位 + 修复动作'
  },
  {
    label: '证据来源',
    value: '监控 + 日志 + 代码检索'
  }
] as const

const reactComparisonRows = [
  {
    label: 'ART',
    title: '解决“这一步我需要真实结果”',
    detail: '更像按需借一个工具，拿到查库、计算或接口结果后，再继续往下判断。'
  },
  {
    label: 'ReAct',
    title: '解决“下一步我该先查什么”',
    detail: '更像排障 Agent，多轮 Thought -> Action -> Observation，边查边改下一步。'
  }
] as const

const reactDistinctionSummary = {
  title: '一句话区分',
  body: 'ART 偏“单次工具增强”，ReAct 偏“多轮行动闭环”。前者重点是借工具，后者重点是根据结果动态推进。'
} as const

const reactKeyNotes = computed(() => artTips.value.slice(0, 2))

const overviewLogicSteps = computed(() => (isReactSlide.value ? reactLogicSteps : artLogicSteps))
const overviewCaseStats = computed(() => (isReactSlide.value ? reactCaseStats : artCaseStats))
const overviewDecisionChecklist = computed(() =>
  isReactSlide.value ? reactDecisionChecklist : artDecisionChecklist
)
const overviewScenarioFits = computed(() =>
  isReactSlide.value ? reactScenarioFits : artScenarioFits
)
const overviewOutputNotes = computed(() =>
  isReactSlide.value ? reactOutputNotes : artOutputNotes
)
const overviewWorkspaceLabel = computed(() => (isReactSlide.value ? 'Incident Workspace' : 'Case Workspace'))
const overviewLoopLead = computed(() => (isReactSlide.value ? 'Thought' : 'Reason'))
const overviewExecutionSummary = computed(() =>
  isReactSlide.value
    ? 'Thought 识别下一步缺什么证据 → Action 调用工具 → Observation 根据结果继续推进。'
    : 'Reason 识别问题 → Action 调用工具 → Observation 带着结果继续推理。'
)
const overviewGoalLabel = computed(() => (isReactSlide.value ? '排查目标' : '场景目标'))
const overviewGoalDescription = computed(() =>
  isReactSlide.value
    ? '通过监控、日志与代码检索三类工具，把死锁告警一步步推进到可验证的根因和修复建议。'
    : '通过数据库查询和精确计算，判断批次 LOT-20260314 的物料损耗率是否超标，并输出可执行结论。'
)
const overviewWhyLabel = computed(() => (isReactSlide.value ? 'Why ReAct' : 'Why ART'))
const overviewWhyDescription = computed(() =>
  isReactSlide.value
    ? 'ReAct 的关键不是“会调工具”，而是每轮 Observation 都会真正改变下一轮 Action。'
    : '当问题同时涉及“真实外部状态”和“精确计算”时，ART 比纯文本推理稳定得多。'
)

// 根据布局类型动态设置图表区域的标签文本
const diagramLabel = computed(() => {
  if (layout.value === 'storyboard') {
    return '执行流讲解'
  }

  if (layout.value === 'loop') {
    return 'Thought -> Action -> Observation'
  }

  if (layout.value === 'runtime') {
    return 'Agent 后端链路'
  }

  if (layout.value === 'control') {
    return 'Reason -> Tool -> Observation'
  }

  if (layout.value === 'canvas' || layout.value === 'diagram-only') {
    return '执行大图'
  }

  return 'Workflow Blueprint'
})

// 渲染 Mermaid 流程图
async function renderDiagram(): Promise<void> {
  if (!diagramRef.value) {
    return
  }

  if (!props.slide.payload.mermaid) {
    diagramRef.value.textContent = ''
    return
  }

  try {
    await renderMermaid(diagramRef.value, `${props.slide.id}-diagram`, props.slide.payload.mermaid)

    const svg = diagramRef.value.querySelector('svg')

    if (svg) {
      svg.style.maxWidth = 'none'
      svg.style.width = '100%'
      svg.style.height = '100%'
      svg.style.display = 'block'
    }
  } catch (error) {
    console.error('Failed to render mermaid diagram', error)
    diagramRef.value.textContent = 'Mermaid 图渲染失败，请检查流程定义。'
  }
}

onMounted(() => {
  void renderDiagram()

  if (isRuntimeLoopSlide.value) {
    const section = findSection(runtimeRootEl.value)
    if (!section) return

    runtimeObserver = new MutationObserver(() => syncRuntimePlayback())
    runtimeObserver.observe(section, { attributes: true, attributeFilter: ['class'] })
    syncRuntimePlayback()
  }
})

watch(
  () => props.slide.payload.mermaid,
  () => {
    void renderDiagram()
  }
)

watch(
  () => props.slide.id,
  () => {
    stopRuntimeSequence()
    resetRuntimeSequence()
    if (isRuntimeLoopSlide.value) {
      syncRuntimePlayback()
    }
  }
)

onBeforeUnmount(() => {
  stopRuntimeSequence()
  runtimeObserver?.disconnect()
  if (runtimeScrollFrame !== null) {
    window.cancelAnimationFrame(runtimeScrollFrame)
  }
})
</script>

<template>
  <SlideShell :slide="slide">
    <div
      v-if="!isReasoningToolOverviewSlide && layout === 'storyboard' && storyboard"
      class="grid h-full grid-rows-[auto_auto_auto_auto] gap-4"
    >
      <div class="grid gap-4 md:grid-cols-2">
        <article
          class="slide-stage px-6 py-4"
          v-bind="motion('panel', 0)"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ storyboard.conceptTitle }}
          </p>
          <p class="text-base leading-7 text-slate-700">
            {{ storyboard.conceptBody }}
          </p>
        </article>

        <article
          class="slide-stage px-6 py-4"
          v-bind="motion('panel', 1)"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ storyboard.logicTitle }}
          </p>
          <p class="text-base leading-7 text-slate-700">
            {{ storyboard.logicBody }}
          </p>
        </article>
      </div>

      <article
        class="slide-rail-card px-6 py-4"
        v-bind="motion('rail')"
      >
        <p class="slide-label mb-3 text-blue-700/80">
          任务输入
        </p>
        <p class="text-base font-semibold leading-7 text-slate-900">
          {{ storyboard.task }}
        </p>
      </article>

      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="(step, index) in storyboard.steps"
          :key="step.label"
          class="slide-panel flex flex-col gap-3 px-5 py-4"
          :class="index === storyboard.steps.length - 1 ? 'md:col-span-2' : ''"
          v-bind="motion('card', index)"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <p class="slide-label text-blue-700/80">
              {{ step.label }}
            </p>
            <span class="slide-number-chip !h-9 !w-9 !text-sm">
              {{ index + 1 }}
            </span>
          </div>

          <div class="space-y-3 text-[14px] leading-6 text-slate-700">
            <div class="grid grid-cols-[72px_1fr] gap-3">
              <span class="slide-label pt-0.5 text-blue-700/80">
                Thought
              </span>
              <p>{{ step.thought }}</p>
            </div>

            <div
              v-if="step.action"
              class="grid grid-cols-[72px_1fr] gap-3"
            >
              <span class="slide-label pt-0.5 text-emerald-700">
                Action
              </span>
              <p class="text-emerald-950/85">
                {{ step.action }}
              </p>
            </div>

            <div
              v-if="step.observation"
              class="grid grid-cols-[72px_1fr] gap-3"
            >
              <span class="slide-label pt-0.5 text-slate-500">
                Observation
              </span>
              <p>{{ step.observation }}</p>
            </div>
          </div>
        </article>
      </div>

      <article
        class="slide-quote-card px-6 py-4"
        v-bind="motion('quote')"
      >
        <div class="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div>
            <p class="slide-label relative mb-2 text-amber-700">
              最终输出
            </p>
            <p class="relative text-[15px] font-medium leading-6 text-amber-900">
              {{ storyboard.finalOutput }}
            </p>
          </div>

          <div class="border-t border-amber-200/70 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <p class="slide-label mb-2 text-blue-700/80">
              分享建议
            </p>
            <p class="text-[14px] leading-6 text-slate-700">
              {{ slide.payload.takeaway }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else-if="!isRuntimeLoopSlide && isBareDiagram"
      class="h-full min-h-0"
    >
      <div
        class="h-full min-h-0 overflow-hidden"
        v-bind="motion('diagram')"
      >
        <div
          v-if="hasDiagram"
          ref="diagramRef"
          class="h-full w-full min-w-0 overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-none"
        />
      </div>
    </div>

    <div
      v-else-if="!isRuntimeLoopSlide && layout === 'diagram-only'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-4"
    >
      <div
        class="slide-stage px-6 py-4"
        v-bind="motion('panel')"
      >
        <div class="flex items-start justify-between gap-6">
          <div class="max-w-5xl">
            <p class="slide-label mb-2 text-blue-700/80">
              {{ diagramLabel }}
            </p>
            <p class="text-[15px] leading-6 text-slate-700">
              {{ slide.payload.description }}
            </p>
          </div>

          <div class="rounded-full border border-blue-100/90 bg-blue-50/70 px-4 py-2">
            <p class="slide-label text-blue-700/80">
              ReAct Flow
            </p>
          </div>
        </div>
      </div>

      <div
        class="slide-stage min-h-0 overflow-hidden p-6"
        v-bind="motion('diagram')"
      >
        <div
          v-if="hasDiagram"
          ref="diagramRef"
          class="h-full w-full min-w-0 overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-none"
        />
      </div>

      <div
        class="slide-quote-card px-6 py-4"
        v-bind="motion('quote')"
      >
        <p class="slide-label relative mb-2 text-amber-700">
          {{ takeawayLabel }}
        </p>
        <p class="relative text-[15px] font-medium leading-6 text-amber-900">
          {{ slide.payload.takeaway }}
        </p>
      </div>
    </div>

    <div
      v-else-if="layout === 'canvas'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5"
    >
      <div
        class="slide-stage px-6 py-5"
        v-bind="motion('panel')"
      >
        <div class="flex items-start justify-between gap-6">
          <div class="max-w-4xl">
            <p class="slide-label mb-3 text-blue-700/80">
              {{ diagramLabel }}
            </p>
            <p class="text-base leading-7 text-slate-700">
              {{ slide.payload.description }}
            </p>
          </div>

          <div
            class="max-w-sm rounded-[22px] border border-amber-200/80 bg-amber-50/80 px-5 py-4"
            v-bind="motion('quote')"
          >
            <p class="slide-label mb-2 text-amber-700">
              {{ takeawayLabel }}
            </p>
            <p class="text-[15px] font-medium leading-6 text-amber-900">
              {{ slide.payload.takeaway }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="slide-stage min-h-0 p-6"
        v-bind="motion('diagram')"
      >
        <div
          v-if="hasDiagram"
          ref="diagramRef"
          class="h-full w-full [&>svg]:h-full [&>svg]:w-full"
        />
      </div>

      <div
        v-if="checkpoints.length > 0"
        class="grid gap-4 md:grid-cols-3"
      >
        <article
          v-for="(item, index) in checkpoints"
          :key="item"
          class="slide-frost px-5 py-4"
          v-bind="motion('checkpoint', index)"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            步骤 {{ index + 1 }}
          </p>
          <p class="text-[15px] leading-6 text-slate-700">
            {{ item }}
          </p>
        </article>
      </div>
    </div>

    <div
      v-else-if="isPromptChainingSlide"
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.78fr_1.22fr] gap-6"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5">
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white px-7 py-5 shadow-sm"
          v-bind="motion('lead')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
            {{ slide.payload.scenarioLabel ?? 'TECHNIQUE' }}
          </p>
          <h3 class="mt-2 text-[22px] font-black leading-tight text-slate-900">
            {{ slide.payload.scenario ?? slide.title }}
          </h3>
          <p
            v-if="slide.subtitle"
            class="mt-3 text-[13px] leading-relaxed text-slate-500"
          >
            {{ slide.subtitle }}
          </p>
        </div>

        <div
          class="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-4 flex items-center gap-2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-indigo-500"
            >
              <line
                x1="6"
                x2="6"
                y1="3"
                y2="15"
              />
              <circle
                cx="18"
                cy="6"
                r="3"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
              />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            {{ slide.payload.challengeLabel ?? '核心逻辑' }}
          </p>

          <div class="flex-1 space-y-3 overflow-auto pr-1">
            <article
              v-for="(item, index) in promptChainContent?.principles ?? []"
              :key="item.label"
              class="rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-4"
              v-bind="motion('card', index)"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                {{ item.label }}
              </p>
              <p class="mt-2 text-[13px] leading-6 text-slate-700">
                {{ item.body }}
              </p>
            </article>
          </div>
        </div>

        <div
          class="slide-quote-card shrink-0 px-6 py-5 bg-amber-50/60 border-amber-200/50"
          v-bind="motion('quote')"
        >
          <p class="slide-label mb-3 text-amber-700 font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            {{ takeawayLabel }}
          </p>
          <p class="text-[13px] font-medium leading-6 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>

          <ul
            v-if="artTips.length > 0"
            class="mt-3 space-y-2.5"
          >
            <li
              v-for="(item, index) in artTips"
              :key="item"
              class="text-[12.5px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2.5"
              v-bind="motion('checkpoint', index)"
            >
              <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('panel')"
        >
          <div class="mb-4 flex items-start justify-between gap-5">
            <div>
              <p class="slide-label mb-2 text-blue-700/80">
                MES 实战逻辑拆解
              </p>
              <p class="text-[14px] leading-6 text-slate-600">
                按“先分析、再设计、最后生成代码”的三段式，把复杂开发任务拆成可校验的小步骤。
              </p>
            </div>

            <div class="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5">
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">Analyze</span>
              <span class="mx-2 text-slate-300">→</span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Design</span>
              <span class="mx-2 text-slate-300">→</span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Code</span>
            </div>
          </div>

          <div class="grid gap-4 xl:grid-cols-3">
            <article
              v-for="(item, index) in promptChainContent?.steps ?? []"
              :key="item.label"
              class="rounded-[22px] border border-slate-200/80 bg-white/78 px-4 py-4 shadow-sm"
              v-bind="motion('card', index)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {{ item.label }}
                  </p>
                  <h4 class="mt-1 text-[15px] font-semibold leading-6 text-slate-900">
                    {{ item.title }}
                  </h4>
                </div>
                <span class="slide-number-chip !h-9 !w-9 !text-sm">
                  {{ index + 1 }}
                </span>
              </div>

              <div class="mt-3 rounded-[18px] border border-blue-100/90 bg-blue-50/70 px-3.5 py-3">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                  输出重点
                </p>
                <p class="mt-1.5 text-[12px] leading-5 text-slate-700">
                  {{ item.focus }}
                </p>
              </div>

              <div class="mt-3 rounded-[18px] border border-slate-200/90 bg-slate-50/90 px-3.5 py-3">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Prompt
                </p>
                <p class="mt-1.5 text-[12px] leading-[1.65] text-slate-700">
                  {{ item.prompt }}
                </p>
              </div>
            </article>
          </div>
        </div>

        <div
          class="slide-stage min-h-0 p-5"
          v-bind="motion('diagram')"
        >
          <div class="mb-3 flex items-center justify-between gap-4">
            <p class="slide-label text-blue-700/80">
              {{ promptChainContent?.diagramLabel ?? '流程图' }}
            </p>
            <span class="slide-ribbon !px-3 !py-1.5 !text-[10px]">
              Workflow Blueprint
            </span>
          </div>

          <div class="flex h-[calc(100%-2.5rem)] items-center justify-between gap-4">
            <template
              v-for="(item, index) in promptChainContent?.steps ?? []"
              :key="`prompt-chain-flow-${item.label}`"
            >
              <article class="flex min-h-[130px] flex-1 flex-col justify-center rounded-[24px] border border-blue-200/80 bg-blue-50/55 px-4 py-4 shadow-sm">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                  {{ item.label }}
                </p>
                <h4 class="mt-2 text-[15px] font-semibold leading-6 text-slate-900">
                  {{ item.title }}
                </h4>
                <p class="mt-2 text-[12px] leading-5 text-slate-600">
                  {{ item.focus }}
                </p>
              </article>

              <div
                v-if="index < (promptChainContent?.steps?.length ?? 0) - 1"
                class="flex w-10 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <span class="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white/80 text-[18px] font-semibold text-blue-500 shadow-sm">
                  →
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="isReactSlide"
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.8fr_1.2fr] gap-6"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white px-7 py-5 shadow-sm"
          v-bind="motion('lead')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
            {{ slide.payload.scenarioLabel ?? 'TECHNIQUE' }}
          </p>
          <h3 class="mt-2 text-[22px] font-black leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
          <p class="mt-3 text-[13px] leading-relaxed text-slate-500">
            {{ slide.payload.description }}
          </p>
        </div>

        <div
          class="grid min-h-0 gap-4 rounded-[22px] border border-slate-200/70 bg-white/72 p-6 shadow-sm backdrop-blur-sm"
          v-bind="motion('panel')"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="slide-label flex items-center gap-2 text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-blue-500"
              >
                <path d="M4 7h16" />
                <path d="M4 12h10" />
                <path d="M4 17h7" />
                <path d="M18 11l2 2-2 2" />
              </svg>
              ART vs ReAct
            </p>

            <div class="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1">
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">ART</span>
              <span class="mx-2 text-slate-300">→</span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">ReAct</span>
            </div>
          </div>

          <div class="grid gap-3">
            <article
              v-for="(item, index) in reactComparisonRows"
              :key="item.label"
              class="rounded-[18px] border px-4 py-4"
              :class="item.label === 'ART'
                ? 'border-blue-100 bg-blue-50/55'
                : 'border-emerald-100 bg-emerald-50/55'"
              v-bind="motion('card', index)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p
                    class="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    :class="item.label === 'ART' ? 'text-blue-600' : 'text-emerald-600'"
                  >
                    {{ item.label }}
                  </p>
                  <h4 class="mt-1 text-[16px] font-semibold leading-6 text-slate-900">
                    {{ item.title }}
                  </h4>
                </div>
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  :class="item.label === 'ART'
                    ? 'bg-white text-blue-700'
                    : 'bg-white text-emerald-700'"
                >
                  {{ item.label === 'ART' ? '单点增强' : '多轮闭环' }}
                </span>
              </div>
              <p class="mt-2 text-[13px] leading-6 text-slate-600">
                {{ item.detail }}
              </p>
            </article>
          </div>

          <div class="rounded-[18px] border border-amber-200/80 bg-amber-50/80 px-4 py-3">
            <p class="slide-label mb-2 text-amber-700">
              {{ reactDistinctionSummary.title }}
            </p>
            <p class="text-[12.5px] font-medium leading-6 text-amber-900">
              {{ reactDistinctionSummary.body }}
            </p>
            <p class="mt-3 text-[12px] leading-5 text-amber-900/85">
              {{ slide.payload.takeaway }}
            </p>
            <div class="mt-3 space-y-2">
              <p
                v-for="(item, index) in reactKeyNotes"
                :key="item"
                class="text-[12px] leading-5 text-amber-900/85"
                v-bind="motion('checkpoint', index)"
              >
                <span class="mr-2 text-amber-500">•</span>
                {{ item }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 min-w-0">
        <div
          v-if="slide.payload.promptPanel"
          class="flex min-h-0 h-full flex-col overflow-hidden rounded-[24px] border border-slate-200/60 bg-white/80 shadow-lg"
          v-bind="motion('rail')"
        >
          <div class="shrink-0 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div class="flex items-start justify-between gap-6">
              <div class="max-w-2xl">
                <p class="slide-label mb-2 text-blue-700/80">
                  Incident Workspace
                </p>
                <p class="text-[18px] font-semibold leading-7 text-slate-900">
                  {{ slide.payload.promptPanel.title }}
                </p>
                <p
                  v-if="slide.payload.promptPanel.background"
                  class="mt-2 text-[13px] leading-6 text-slate-600"
                >
                  <span class="font-semibold text-slate-900">场景背景：</span>{{ slide.payload.promptPanel.background }}
                </p>
              </div>

              <span class="slide-ribbon !px-3 !py-1.5 !text-[10px]">
                Thought → Action → Observation
              </span>
            </div>
          </div>

          <div class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 px-6 py-4">
            <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <article class="rounded-[20px] border border-blue-100/80 bg-blue-50/45 px-5 py-4 shadow-sm">
                <p class="slide-label mb-2 text-blue-700/80">
                  任务与判断目标
                </p>
                <p class="text-[14px] font-semibold leading-6 text-slate-900">
                  {{ slide.payload.promptPanel.task }}
                </p>
                <p class="mt-2 text-[12.5px] leading-6 text-slate-600">
                  重点不是立刻回答，而是先决定下一步最该取哪一类证据。
                </p>
              </article>

              <article class="rounded-[20px] border border-slate-200/80 bg-white/82 px-5 py-4 shadow-sm">
                <p class="slide-label mb-2 text-blue-700/80">
                  可用工具
                </p>
                <div class="grid gap-2.5">
                  <article
                    v-for="(tool, index) in slide.payload.promptPanel.tools"
                    :key="tool.name"
                    class="rounded-[16px] border border-slate-200/80 bg-slate-50/85 px-4 py-3"
                    v-bind="motion('card', index)"
                  >
                    <p class="text-[12px] font-semibold text-slate-900">
                      {{ tool.name }}
                    </p>
                    <p class="mt-1 text-[12px] leading-5 text-slate-600">
                      {{ tool.detail }}
                    </p>
                  </article>
                </div>
              </article>
            </div>

            <div class="grid min-h-0 gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <article class="flex min-h-0 flex-col rounded-[22px] border border-slate-200/80 bg-white/82 px-5 py-4 shadow-sm">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <p class="slide-label text-blue-700/80">
                    ReAct 执行闭环
                  </p>
                  <span class="rounded-full bg-blue-50/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Agent Routine
                  </span>
                </div>

                <div class="grid flex-1 gap-3 md:grid-cols-3 [grid-auto-rows:1fr]">
                  <article
                    v-for="(step, index) in reactLogicSteps"
                    :key="step.key"
                    class="flex h-full flex-col rounded-[18px] border px-3.5 py-3.5"
                    :class="step.tone === 'blue'
                      ? 'border-blue-100 bg-blue-50/55'
                      : step.tone === 'emerald'
                        ? 'border-emerald-100 bg-emerald-50/55'
                        : 'border-slate-200 bg-slate-50/80'"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                        :class="step.tone === 'blue'
                          ? 'bg-white text-blue-700'
                          : step.tone === 'emerald'
                            ? 'bg-white text-emerald-700'
                            : 'bg-white text-slate-600'"
                      >
                        {{ index + 1 }}
                      </span>
                      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {{ step.key }}
                      </p>
                    </div>
                    <h4 class="mt-2.5 text-[14px] font-semibold leading-5 text-slate-900">
                      {{ step.title }}
                    </h4>
                    <p class="mt-2 text-[11px] leading-[1.5] text-slate-600">
                      {{ step.detail }}
                    </p>
                  </article>
                </div>

              </article>

              <article class="flex min-h-0 flex-col rounded-[22px] border border-slate-200/80 bg-white/82 px-5 py-4 shadow-sm">
                <p class="slide-label mb-2 text-blue-700/80">
                  最终交付长什么样
                </p>

                <div class="grid gap-2.5">
                  <article
                    v-for="item in reactOutputNotes"
                    :key="item.label"
                    class="rounded-[16px] border border-slate-200/80 bg-slate-50/80 px-4 py-3"
                  >
                    <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {{ item.label }}
                    </p>
                    <p class="mt-1.5 text-[13px] font-semibold leading-5 text-slate-900">
                      {{ item.value }}
                    </p>
                  </article>
                </div>

                <div class="mt-2 rounded-[18px] border border-emerald-200/80 bg-emerald-50/75 px-4 py-2.5">
                  <p class="slide-label mb-2 text-emerald-700">
                    什么时候优先用 ReAct
                  </p>
                  <p class="text-[11.5px] leading-[1.45] text-slate-700">
                    适合线上故障排查、多系统联动分析这类
                    <span class="font-semibold text-slate-900">边查边决定下一步</span>
                    的问题。
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="isReasoningToolOverviewSlide"
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.82fr_1.18fr] gap-6"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5">
        <div
          v-if="slide.payload.scenario"
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white px-7 py-5 shadow-sm"
          v-bind="motion('lead')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
            {{ slide.payload.scenarioLabel ?? 'Technique' }}
          </p>
          <h3 class="mt-2 text-[22px] font-black leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
          <p
            class="mt-3 text-[13px] leading-relaxed text-slate-500"
          >
            {{ slide.payload.description }}
          </p>
        </div>

        <div
          class="flex min-h-0 flex-col rounded-[22px] border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm overflow-hidden"
          v-bind="motion('panel')"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <p class="slide-label flex items-center gap-2 text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-blue-500"
              >
                <rect
                  width="16"
                  height="16"
                  x="4"
                  y="4"
                  rx="2"
                />
                <rect
                  width="6"
                  height="6"
                  x="9"
                  y="9"
                  rx="1"
                />
                <path d="M15 2v2" />
                <path d="M15 20v2" />
                <path d="M2 15h2" />
                <path d="M2 11h2" />
                <path d="M20 15h2" />
                <path d="M20 11h2" />
                <path d="M9 2v2" />
                <path d="M9 20v2" />
              </svg>
              {{ slide.payload.challengeLabel ?? diagramLabel }}
            </p>

            <div class="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1">
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">{{ overviewLoopLead }}</span>
              <span class="mx-2 text-slate-300">→</span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Action</span>
              <span class="mx-2 text-slate-300">→</span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Obs</span>
            </div>
          </div>

          <ul
            v-if="challengePoints.length > 0"
            class="space-y-3"
          >
            <li
              v-for="(item, index) in challengePoints"
              :key="item"
              class="rounded-xl bg-slate-50/80 px-4 py-3 text-[13.5px] leading-relaxed text-slate-600"
              v-bind="motion('checkpoint', index)"
            >
              {{ item }}
            </li>
          </ul>

          <div class="mt-4 rounded-[18px] border border-blue-100/80 bg-blue-50/50 px-4 py-3">
            <p class="slide-label mb-1.5 text-blue-700/80">
              执行顺序
            </p>
            <p class="text-[12px] leading-5 text-slate-600">
              {{ overviewExecutionSummary }}
            </p>
          </div>
        </div>

        <div
          class="slide-quote-card shrink-0 px-5 py-4 bg-amber-50/60 border-amber-200/50"
          v-bind="motion('quote')"
        >
          <p class="slide-label mb-3 text-amber-700 font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            {{ takeawayLabel }}
          </p>
          <p class="relative text-[13px] font-medium leading-6 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>

          <div
            v-if="artTips.length > 0"
            class="mt-4"
          >
            <ul class="space-y-2.5">
              <li
                v-for="(item, index) in artTips"
                :key="item"
                class="text-[12.5px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2.5"
                v-bind="motion('card', index)"
              >
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="min-h-0 min-w-0">
        <div
          v-if="slide.payload.promptPanel"
          class="flex min-h-0 h-full flex-col overflow-hidden rounded-[24px] border border-slate-200/60 bg-white/80 shadow-lg"
          v-bind="motion('rail')"
        >
          <div class="shrink-0 border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
            <div class="flex items-start justify-between gap-6">
              <div class="max-w-2xl">
                <p class="slide-label mb-2 text-blue-700/80">
                  {{ overviewWorkspaceLabel }}
                </p>
                <p class="text-[18px] font-semibold leading-7 text-slate-900">
                  {{ slide.payload.promptPanel.title }}
                </p>
                <p
                  v-if="slide.payload.promptPanel.background"
                  class="mt-2 text-[13px] leading-6 text-slate-600"
                >
                  <span class="font-semibold text-slate-900">场景背景：</span>{{ slide.payload.promptPanel.background }}
                </p>
              </div>

              <div class="grid shrink-0 grid-cols-3 gap-2">
                <article
                  v-for="item in overviewCaseStats"
                  :key="item.label"
                  class="min-w-[106px] rounded-[18px] border border-slate-200/80 bg-white/80 px-3 py-2"
                >
                  <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {{ item.label }}
                  </p>
                  <p class="mt-1 text-[12px] font-semibold text-slate-900">
                    {{ item.value }}
                  </p>
                </article>
              </div>
            </div>
          </div>

          <div class="grid min-h-0 flex-1 gap-3 px-6 py-4 grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
            <div class="min-h-0">
              <div class="flex min-h-0 h-full flex-col rounded-[22px] border border-slate-200/80 bg-white/78 px-5 py-4 shadow-sm">
                <div>
                  <p class="slide-label mb-2 text-blue-700/80">
                    {{ slide.payload.promptPanel.instructionTitle ?? '提示词设计' }}
                  </p>
                  <p class="text-[13px] leading-6 text-slate-700">
                    {{ slide.payload.promptPanel.instruction }}
                  </p>
                </div>

                <div class="mt-4">
                  <p class="slide-label mb-2 text-blue-700/80">
                    {{ slide.payload.promptPanel.toolsTitle ?? '可用工具' }}
                  </p>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <article
                      v-for="(tool, index) in slide.payload.promptPanel.tools"
                      :key="tool.name"
                      class="rounded-[18px] border border-slate-200/80 bg-slate-50/85 px-4 py-3.5"
                      v-bind="motion('card', index)"
                    >
                      <p class="text-[12px] font-semibold text-slate-900">
                        {{ tool.name }}
                      </p>
                      <p class="mt-1.5 text-[12px] leading-5 text-slate-600">
                        {{ tool.detail }}
                      </p>
                    </article>
                  </div>
                </div>

                <div class="mt-4 rounded-[20px] border border-blue-100/80 bg-gradient-to-br from-blue-50/70 to-white px-4 py-3.5">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <p class="slide-label text-blue-700/80">
                      执行策略
                    </p>
                    <span class="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Agent Routine
                    </span>
                  </div>
                  <div class="grid gap-2.5 sm:grid-cols-3">
                    <article
                      v-for="(step, index) in overviewLogicSteps"
                      :key="`workspace-${step.key}`"
                      class="rounded-[16px] border px-3 py-3"
                      :class="step.tone === 'blue'
                        ? 'border-blue-100 bg-white/80'
                        : step.tone === 'emerald'
                          ? 'border-emerald-100 bg-white/80'
                          : 'border-slate-200 bg-white/80'"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                          :class="step.tone === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : step.tone === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'"
                        >
                          {{ index + 1 }}
                        </span>
                        <p class="text-[12px] font-semibold text-slate-900">
                          {{ step.title }}
                        </p>
                      </div>
                      <p class="mt-2 text-[11px] leading-5 text-slate-600">
                        {{ step.detail }}
                      </p>
                    </article>
                  </div>
                </div>

                <div class="mt-3 rounded-[20px] border border-amber-200/80 bg-amber-50/85 px-4 py-3.5 shadow-sm">
                  <p class="slide-label mb-2 text-amber-700">
                    {{ slide.payload.promptPanel.taskLabel ?? 'Task' }}
                  </p>
                  <p class="text-[14px] font-semibold leading-6 text-amber-950">
                    {{ slide.payload.promptPanel.task }}
                  </p>
                </div>
              </div>
            </div>

            <div class="grid min-h-0 gap-2.5 grid-rows-[auto_minmax(0,1fr)]">
              <div class="rounded-[22px] border border-blue-200/70 bg-blue-50/45 px-5 py-3.5 shadow-sm">
                <p class="slide-label mb-2 text-blue-700/80">
                  {{ overviewGoalLabel }}
                </p>
                <p class="text-[12.5px] leading-[1.65] text-slate-700">
                  {{ overviewGoalDescription }}
                </p>
              </div>

              <div class="flex min-h-0 flex-col rounded-[22px] border border-slate-200/80 bg-white/78 px-5 pt-3.5 pb-4 shadow-sm">
                <p class="slide-label mb-2.5 text-blue-700/80">
                  判断准则与适用场景
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="item in overviewDecisionChecklist"
                    :key="item"
                    class="flex items-start gap-2.5 text-[11.5px] leading-[1.55] text-slate-700"
                  >
                    <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {{ item }}
                  </li>
                </ul>

                <div class="mt-2.5 grid gap-2">
                  <article
                    v-for="item in overviewScenarioFits"
                    :key="item.title"
                    class="rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-2"
                  >
                    <p class="text-[12px] font-semibold text-slate-900">
                      {{ item.title }}
                    </p>
                    <p class="mt-1 text-[10.5px] leading-[1.45] text-slate-600">
                      {{ item.detail }}
                    </p>
                  </article>
                </div>

                <div class="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  <article
                    v-for="item in overviewOutputNotes"
                    :key="item.label"
                    class="rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-2"
                  >
                    <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {{ item.label }}
                    </p>
                    <p class="mt-1 text-[11.5px] font-semibold leading-[1.45] text-slate-900">
                      {{ item.value }}
                    </p>
                  </article>
                </div>

                <div class="mt-2.5 rounded-[18px] border border-white/80 bg-blue-50/55 px-4 py-2.5">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                    {{ overviewWhyLabel }}
                  </p>
                  <p class="mt-1 text-[11px] leading-[1.45] text-slate-600">
                    {{ overviewWhyDescription }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="isRuntimeLoopSlide"
      ref="runtimeRootEl"
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.74fr_1.26fr] gap-4"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-5">
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 via-white to-white px-7 py-5 shadow-sm"
          v-bind="motion('lead')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
            {{ slide.payload.scenarioLabel ?? 'TOOL LOOP' }}
          </p>
          <h3 class="mt-2 text-[22px] font-black leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
          <p class="mt-3 max-w-[92%] text-[13px] leading-relaxed text-slate-500">
            {{ slide.payload.description }}
          </p>
        </div>

        <div
          class="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
          v-bind="motion('rail')"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <p class="slide-label flex items-center gap-2 text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-blue-500"
              >
                <rect
                  width="16"
                  height="16"
                  x="4"
                  y="4"
                  rx="2"
                />
                <rect
                  width="6"
                  height="6"
                  x="9"
                  y="9"
                  rx="1"
                />
                <path d="M15 2v2" />
                <path d="M15 20v2" />
                <path d="M2 15h2" />
                <path d="M2 11h2" />
                <path d="M20 15h2" />
                <path d="M20 11h2" />
                <path d="M9 2v2" />
                <path d="M9 20v2" />
              </svg>
              {{ slide.payload.challengeLabel ?? '后端处理链路' }}
            </p>

            <div class="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1">
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">Loop</span>
              <span class="mx-2 text-slate-300">→</span>
              <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Backend</span>
            </div>
          </div>

          <div class="relative flex-1">
            <div class="space-y-3">
              <article
                v-for="(item, index) in challengePoints"
                :key="item"
                class="relative rounded-[18px] border border-slate-200/75 bg-white/84 px-4 py-3.5 shadow-[0_12px_26px_rgba(148,163,184,0.08)]"
                v-bind="motion('checkpoint', index)"
              >
                <div class="grid grid-cols-[32px_1fr] items-start gap-3">
                  <span class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[12px] font-semibold text-blue-600 shadow-[0_8px_18px_rgba(96,165,250,0.16)]">
                    {{ index + 1 }}
                  </span>
                  <p class="pt-1 text-[13px] leading-6 text-slate-700">
                    {{ item }}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>

        <div
          class="slide-quote-card px-5 py-4 bg-amber-50/60 border-amber-200/50"
          v-bind="motion('quote')"
        >
          <p class="slide-label mb-3 text-amber-700 font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            {{ takeawayLabel }}
          </p>
          <p class="text-[13px] font-medium leading-6 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>
          <ul class="mt-3 space-y-2.5">
            <li
              v-for="(item, index) in artTips"
              :key="item"
              class="text-[12px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2.5"
              v-bind="motion('card', index)"
            >
              <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <div
        class="art-runtime-panel flex min-h-0 flex-col overflow-hidden rounded-[24px]"
        v-bind="motion('panel')"
      >
        <div class="art-runtime-panel__header shrink-0 px-6 py-3.5">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
            执行链路展示
          </p>
        </div>
        <div class="flex-1 min-h-0 overflow-hidden px-3 pb-4">
          <AgentRuntimeDemo
            v-if="runtimeChat.length > 0"
            :conversation="runtimeChat"
          />
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full min-h-0 gap-6"
      :class="rootLayoutClass"
    >
      <div
        class="grid min-h-0 gap-5"
        :class="leftColumnClass"
      >
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('panel')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ diagramLabel }}
          </p>
          <p class="text-base leading-7 text-slate-700">
            {{ slide.payload.description }}
          </p>
        </div>

        <div
          v-if="layout === 'control' && slide.payload.promptPanel"
          class="slide-rail-card min-h-0 px-6 py-5"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.promptPanel.title }}
          </p>

          <div class="space-y-4 text-slate-700">
            <p class="text-[15px] leading-6">
              {{ slide.payload.promptPanel.instruction }}
            </p>

            <div class="grid gap-3 sm:grid-cols-2">
              <article
                v-for="(tool, index) in slide.payload.promptPanel.tools"
                :key="tool.name"
                class="rounded-[22px] border border-slate-200/80 bg-white/70 px-4 py-3"
                v-bind="motion('card', index)"
              >
                <p class="text-sm font-semibold text-slate-900">
                  {{ tool.name }}
                </p>
                <p class="mt-1 text-[13px] leading-5 text-slate-600">
                  {{ tool.detail }}
                </p>
              </article>
            </div>

            <div class="rounded-[22px] border border-amber-200/80 bg-amber-50/80 px-4 py-3">
              <p class="slide-label mb-1 text-amber-700">
                Task
              </p>
              <p class="text-[15px] font-medium leading-6 text-amber-900">
                {{ slide.payload.promptPanel.task }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="hasDiagram"
          class="slide-stage min-h-0 p-5"
          v-bind="motion('diagram')"
        >
          <div
            ref="diagramRef"
            class="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          />
        </div>
      </div>

      <div
        class="grid min-h-0 gap-5"
        :class="sideColumnClass"
      >
        <div
          v-if="checkpoints.length > 0"
          class="grid min-h-0 gap-4"
        >
          <article
            v-for="(item, index) in checkpoints"
            :key="item"
            class="slide-rail-card flex items-start gap-4 pl-10 pr-5 py-4"
            v-bind="motion('checkpoint', index)"
          >
            <span class="slide-number-chip !h-10 !w-10 !text-base">
              {{ index + 1 }}
            </span>
            <p
              class="pt-1 text-slate-700"
              :class="layout === 'loop' ? 'text-[15px] leading-6' : 'text-base leading-7'"
            >
              {{ item }}
            </p>
          </article>
        </div>

        <div
          class="slide-quote-card px-6 py-5"
          v-bind="motion('quote')"
        >
          <p class="slide-label relative mb-3 text-amber-700">
            {{ takeawayLabel }}
          </p>
          <p class="relative text-base font-medium leading-7 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>
        </div>
      </div>
    </div>
  </SlideShell>
</template>

<style scoped>
.art-runtime-panel {
  position: relative;
  isolation: isolate;
  border: 1px solid rgba(226, 236, 250, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(241, 247, 255, 0.08)),
    radial-gradient(circle at top right, rgba(152, 191, 255, 0.2), transparent 26%),
    radial-gradient(circle at left center, rgba(255, 255, 255, 0.12), transparent 34%);
  backdrop-filter: blur(24px) saturate(1.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 18px 44px rgba(148, 163, 184, 0.08);
}

.art-runtime-panel::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  border-radius: inherit;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 34%),
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.24), transparent 30%);
}

.art-runtime-panel::after {
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 18px;
  content: '';
  pointer-events: none;
  box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.1);
}

.art-runtime-panel__header {
  position: relative;
  z-index: 1;
}

.fold-panel-enter-active,
.fold-panel-leave-active {
  transition: all 220ms ease;
  overflow: hidden;
}

.fold-panel-enter-from,
.fold-panel-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.fold-panel-enter-to,
.fold-panel-leave-from {
  max-height: 320px;
  opacity: 1;
  transform: translateY(0);
}
</style>
