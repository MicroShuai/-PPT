<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { renderMermaid } from '@/lib/mermaid';
import type { FlowSlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: FlowSlideDefinition;
}>();

const diagramRef = ref<HTMLDivElement | null>(null);
const layout = computed(() => props.slide.variant ?? 'route');
const diagramLabel = computed(() => {
  if (layout.value === 'loop') {
    return 'Reasoning Loop';
  }

  if (layout.value === 'control') {
    return 'Action Grid';
  }

  return 'Workflow Blueprint';
});

async function renderDiagram(): Promise<void> {
  if (!diagramRef.value) {
    return;
  }

  try {
    await renderMermaid(diagramRef.value, `${props.slide.id}-diagram`, props.slide.payload.mermaid);
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
    <div class="grid h-full min-h-0 grid-cols-[1.08fr_0.92fr] gap-6">
      <div class="grid min-h-0 grid-rows-[auto_1fr] gap-5">
        <div class="slide-stage px-6 py-5">
          <p class="slide-label mb-3 text-blue-700/80">
            {{ diagramLabel }}
          </p>
          <p class="text-base leading-7 text-slate-700">
            {{ slide.payload.description }}
          </p>
        </div>

        <div class="slide-stage min-h-0 p-5">
          <div
            ref="diagramRef"
            class="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          />
        </div>
      </div>

      <div class="grid min-h-0 grid-rows-[1fr_auto] gap-5">
        <div class="grid min-h-0 gap-4">
          <article
            v-for="(item, index) in slide.payload.checkpoints"
            :key="item"
            class="slide-rail-card fragment flex items-start gap-4 pl-10 pr-5 py-4"
          >
            <span class="slide-number-chip !h-10 !w-10 !text-base">
              {{ index + 1 }}
            </span>
            <p class="pt-1 text-base leading-7 text-slate-700">
              {{ item }}
            </p>
          </article>
        </div>

        <div class="slide-quote-card px-6 py-5">
          <p class="slide-label relative mb-3 text-amber-700">
            Takeaway
          </p>
          <p class="relative text-base font-medium leading-7 text-amber-900">
            {{ slide.payload.takeaway }}
          </p>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
