<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import { renderMermaid } from '@/lib/mermaid';
import type { FlowSlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: FlowSlideDefinition;
}>();

const diagramRef = ref<HTMLDivElement | null>(null);
const layout = computed(() => props.slide.variant ?? 'route');
const isArtSlide = computed(() => props.slide.id === 'art');
const storyboard = computed(() => props.slide.payload.storyboard);
const checkpoints = computed(() => props.slide.payload.checkpoints ?? []);
const hasDiagram = computed(() => Boolean(props.slide.payload.mermaid));
const isBareDiagram = computed(() => layout.value === 'diagram-only' && props.slide.hideHeader);
const { motion } = useSlideMotion(toRef(props, 'slide'));

const rootLayoutClass = computed(() => {
  if (layout.value === 'loop') {
    return 'grid-cols-[1.18fr_0.82fr]';
  }

  if (layout.value === 'runtime') {
    return 'grid-cols-[1.02fr_0.98fr]';
  }

  return 'grid-cols-[1.08fr_0.92fr]';
});

const leftColumnClass = computed(() =>
  layout.value === 'control' ? 'grid-rows-[auto_auto_1fr]' : 'grid-rows-[auto_1fr]'
);

const sideColumnClass = computed(() =>
  checkpoints.value.length > 0 ? 'grid-rows-[1fr_auto]' : 'grid-rows-[auto]'
);

const diagramLabel = computed(() => {
  if (layout.value === 'storyboard') {
    return '执行流讲解';
  }

  if (layout.value === 'loop') {
    return 'Thought -> Action -> Observation';
  }

  if (layout.value === 'runtime') {
    return 'Agent 后端链路';
  }

  if (layout.value === 'control') {
    return 'Reason -> Tool -> Observation';
  }

  if (layout.value === 'canvas' || layout.value === 'diagram-only') {
    return '执行大图';
  }

  return 'Workflow Blueprint';
});

async function renderDiagram(): Promise<void> {
  if (!diagramRef.value) {
    return;
  }

  if (!props.slide.payload.mermaid) {
    diagramRef.value.textContent = '';
    return;
  }

  try {
    await renderMermaid(diagramRef.value, `${props.slide.id}-diagram`, props.slide.payload.mermaid);

    const svg = diagramRef.value.querySelector('svg');

    if (svg) {
      svg.style.maxWidth = 'none';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to render mermaid diagram', error);
    diagramRef.value.textContent = 'Mermaid 图渲染失败，请检查流程定义。';
  }
}

onMounted(() => {
  void renderDiagram();
});

watch(
  () => props.slide.payload.mermaid,
  () => {
    void renderDiagram();
  }
);
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
          分享金句
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
              分享金句
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
      class="grid h-full min-h-0 min-w-0 grid-cols-[0.9fr_1.1fr] gap-5"
    >
      <div class="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
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
          v-if="slide.payload.promptPanel"
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
          class="slide-quote-card px-6 py-5"
          v-bind="motion('quote')"
        >
          <p class="slide-label relative mb-3 text-amber-700">
            分享金句
          </p>
          <p class="relative text-base font-medium leading-7 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>
        </div>
      </div>

      <div
        class="slide-stage min-h-0 min-w-0 overflow-hidden p-5"
        v-bind="motion('diagram')"
      >
        <div
          v-if="hasDiagram"
          ref="diagramRef"
          class="h-full w-full min-w-0 overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-full"
        />
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
            分享金句
          </p>
          <p class="relative text-base font-medium leading-7 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
