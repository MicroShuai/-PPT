<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { renderMermaid } from '@/lib/mermaid';
import type { FlowSlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: FlowSlideDefinition;
}>();

const diagramRef = ref<HTMLDivElement | null>(null);

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
    <div class="grid h-full grid-cols-[1.15fr_0.85fr] gap-6">
      <div class="slide-panel flex h-full flex-col overflow-hidden p-6">
        <p class="slide-label mb-4 text-blue-700/80">
          Workflow Blueprint
        </p>
        <p class="mb-4 text-base leading-7 text-slate-700">
          {{ slide.payload.description }}
        </p>
        <div class="min-h-0 flex-1 rounded-[20px] border border-slate-200/80 bg-white/80 p-4">
          <div
            ref="diagramRef"
            class="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          />
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <div class="slide-panel flex-1 p-6">
          <p class="slide-label mb-4">
            Checklist
          </p>
          <ul class="space-y-4">
            <li
              v-for="item in slide.payload.checkpoints"
              :key="item"
              class="rounded-[18px] border border-slate-200/80 bg-white/50 px-4 py-3.5 text-base leading-7 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="rounded-[24px] border border-blue-200 bg-blue-50/90 px-6 py-5">
          <p class="slide-label mb-3 text-blue-700">
            Takeaway
          </p>
          <p class="text-base font-medium leading-7 text-blue-800">
            {{ slide.payload.takeaway }}
          </p>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
