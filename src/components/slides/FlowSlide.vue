<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import SlideShell from '@/components/common/SlideShell.vue'
import { useSlideMotion } from '@/composables/useSlideMotion'
import { renderMermaid } from '@/lib/mermaid'
import type { FlowSlideDefinition } from '@/types/slide'

const props = defineProps<{
  slide: FlowSlideDefinition
}>()

const diagramRef = ref<HTMLDivElement | null>(null); // Mermaid 图表容器引用
const layout = computed(() => props.slide.variant ?? 'route'); // 流程图布局变体
const isArtSlide = computed(() => props.slide.id === 'art'); // 是否为 ART (Automatic Reasoning and Tool-use) 幻灯片
const isArtRuntimeSlide = computed(() => props.slide.id === 'art-runtime'); // 是否为 ART 工具调用闭环页
const storyboard = computed(() => props.slide.payload.storyboard); // 故事板数据（用于逐步演示）
const checkpoints = computed(() => props.slide.payload.checkpoints ?? []); // 流程关键节点
const challengePoints = computed(() => props.slide.payload.challenge ?? []); // 面临的挑战或痛点
const takeawayLabel = computed(() => props.slide.payload.takeawayLabel ?? 'Tips'); // 金句/提示标签
const artTips = computed(() => props.slide.payload.tips ?? []); // ART 页额外 tips
const hasDiagram = computed(() => Boolean(props.slide.payload.mermaid)); // 是否包含 Mermaid 流程图定义
const isBareDiagram = computed(() => layout.value === 'diagram-only' && props.slide.hideHeader); // 纯图表模式（隐藏标题）
const { motion } = useSlideMotion(toRef(props, 'slide')); // 动画控制

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
})

watch(
  () => props.slide.payload.mermaid,
  () => {
    void renderDiagram()
  }
)
</script>

<template>
  <SlideShell :slide="slide">
    <div
      v-if="layout === 'storyboard' && storyboard"
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
      v-else-if="isBareDiagram"
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
      v-else-if="layout === 'diagram-only'"
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
      v-else-if="isArtSlide"
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.8fr_1.2fr] gap-4"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
        <div
          v-if="slide.payload.scenario"
          class="slide-stage px-5 py-4"
          v-bind="motion('lead')"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            {{ slide.payload.scenarioLabel ?? 'Technique' }}
          </p>
          <h3 class="text-[26px] font-semibold leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
          <p
            class="mt-3 text-[14px] leading-6 text-slate-600"
          >
            {{ slide.payload.description }}
          </p>
        </div>

        <div
          class="slide-frost px-5 py-4"
          v-bind="motion('panel')"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            {{ slide.payload.challengeLabel ?? diagramLabel }}
          </p>
          <ul
            v-if="challengePoints.length > 0"
            class="space-y-2.5"
          >
            <li
              v-for="(item, index) in challengePoints"
              :key="item"
              class="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-[13px] leading-5 text-slate-600"
              v-bind="motion('checkpoint', index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div
          class="slide-quote-card min-h-0 px-5 py-4"
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
          <p class="relative text-[14px] font-medium leading-6 text-amber-900">
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
              class="text-[13px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2.5"
              v-bind="motion('card', index)"
              >
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="grid min-h-0 min-w-0">
        <div
          v-if="slide.payload.promptPanel"
          class="slide-rail-card min-h-0 overflow-hidden px-5 py-4"
          v-bind="motion('rail')"
        >
          <div class="mb-3 flex items-start justify-between gap-4">
            <div>
              <p class="slide-label mb-2 text-blue-700/80">
                {{ slide.payload.promptPanel.title }}
              </p>
              <p
                v-if="slide.payload.promptPanel.background"
                class="text-[13px] leading-5 text-slate-600"
              >
                <span class="font-semibold text-slate-900">场景背景：</span>{{ slide.payload.promptPanel.background }}
              </p>
            </div>
          </div>

          <div class="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.96fr)]">
            <div class="space-y-3 min-w-0">
              <div class="rounded-[22px] border border-slate-200/80 bg-white/75 px-4 py-3.5">
                <p class="slide-label mb-2 text-blue-700/80">
                  {{ slide.payload.promptPanel.instructionTitle ?? '提示词设计' }}
                </p>
                <p class="text-[13px] leading-5 text-slate-700">
                  {{ slide.payload.promptPanel.instruction }}
                </p>

                <div class="mt-3">
                  <p class="slide-label mb-2 text-blue-700/80">
                    {{ slide.payload.promptPanel.toolsTitle ?? '可用工具' }}
                  </p>
                  <div class="grid gap-2 sm:grid-cols-2">
                    <article
                      v-for="(tool, index) in slide.payload.promptPanel.tools"
                      :key="tool.name"
                      class="rounded-[18px] border border-slate-200/80 bg-slate-50/85 px-3.5 py-3"
                      v-bind="motion('card', index)"
                    >
                      <p class="text-[12px] font-semibold text-slate-900">
                        {{ tool.name }}
                      </p>
                      <p class="mt-1 text-[11px] leading-5 text-slate-600">
                        {{ tool.detail }}
                      </p>
                    </article>
                  </div>
                </div>

                <div class="mt-3 rounded-[18px] border border-amber-200/80 bg-amber-50/85 px-3.5 py-3">
                  <p class="slide-label mb-1 text-amber-700">
                    {{ slide.payload.promptPanel.taskLabel ?? 'Task' }}
                  </p>
                  <p class="text-[13px] font-medium leading-5 text-amber-900">
                    {{ slide.payload.promptPanel.task }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-[22px] border border-blue-200/70 bg-blue-50/40 px-4 py-3.5">
              <p class="slide-label mb-2 text-blue-700/80">
                场景目标
              </p>
              <p class="text-[13px] leading-6 text-slate-700">
                通过数据库查询和精确计算，判断批次 <span class="font-semibold text-slate-900">LOT-20260314</span> 的物料损耗率是否超标，并输出可执行结论。
              </p>

              <div class="mt-4 rounded-[18px] border border-white/80 bg-white/75 px-4 py-3">
                <p class="slide-label mb-2 text-blue-700/80">
                  适合场景
                </p>
                <ul class="space-y-2">
                  <li class="flex items-start gap-2.5 text-[12px] leading-5 text-slate-700">
                    <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    精准计算
                  </li>
                  <li class="flex items-start gap-2.5 text-[12px] leading-5 text-slate-700">
                    <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    实时状态查询
                  </li>
                  <li class="flex items-start gap-2.5 text-[12px] leading-5 text-slate-700">
                    <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    外部系统集成
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="isArtRuntimeSlide"
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.82fr_1.18fr] gap-4"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
        <div
          class="slide-stage px-5 py-4"
          v-bind="motion('lead')"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            {{ slide.payload.scenarioLabel ?? 'TOOL LOOP' }}
          </p>
          <h3 class="text-[26px] font-semibold leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
          <p class="mt-3 text-[14px] leading-6 text-slate-600">
            {{ slide.payload.description }}
          </p>
        </div>

        <div
          class="slide-rail-card min-h-0 overflow-hidden px-5 py-4"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.promptPanel?.trackTitle ?? '执行轨迹' }}
          </p>
          <div class="space-y-2.5">
            <article
              v-for="(step, index) in slide.payload.promptPanel?.track ?? []"
              :key="`${step.label}-${index}`"
              class="rounded-[18px] border border-slate-200/80 bg-white/75 px-4 py-3"
              v-bind="motion('checkpoint', index)"
            >
              <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {{ step.label }}
              </p>
              <div class="space-y-1.5 text-[12px] leading-5 text-slate-700">
                <p v-if="step.thought">
                  <span class="font-semibold text-slate-900">Reason：</span>{{ step.thought }}
                </p>
                <p
                  v-if="step.action"
                  class="text-emerald-950/85"
                >
                  <span class="font-semibold text-emerald-800">Action：</span>{{ step.action }}
                </p>
                <p v-if="step.observation">
                  <span class="font-semibold text-slate-900">Observation：</span>{{ step.observation }}
                </p>
                <p
                  v-if="step.conclusion"
                  class="font-medium text-amber-900"
                >
                  {{ step.conclusion }}
                </p>
              </div>
            </article>
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

      <div class="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_minmax(260px,0.72fr)] gap-3">
        <div
          class="slide-rail-card min-h-0 overflow-hidden px-5 py-4"
          v-bind="motion('code')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.promptPanel?.snippetsTitle ?? '工具调用 / 后端处理' }}
          </p>
          <div class="grid min-h-0 gap-3 md:grid-cols-2">
            <article
              v-for="(snippet, index) in slide.payload.promptPanel?.snippets ?? []"
              :key="`${snippet.label}-${index}`"
              class="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              v-bind="motion('code', index)"
            >
              <div class="border-b border-white/10 bg-slate-900/90 px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {{ snippet.label }}
                </p>
              </div>
              <div class="px-3 py-2.5">
                <code class="block whitespace-pre-wrap font-mono text-[10px] leading-[1.5] text-slate-100">{{ snippet.code }}</code>
              </div>
            </article>
          </div>
        </div>

        <div
          class="slide-stage min-h-0 min-w-0 overflow-hidden px-5 py-4"
          v-bind="motion('diagram')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            流程图
          </p>
          <div
            v-if="hasDiagram"
            ref="diagramRef"
            class="h-[calc(100%-1.5rem)] w-full min-w-0 overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-full"
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
