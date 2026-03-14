<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { SummarySlideDefinition } from '@/types/slide';

defineProps<{
  slide: SummarySlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full grid-rows-[auto_1fr_auto] gap-6">
      <div class="grid grid-cols-4 gap-5">
        <article
          v-for="pillar in slide.payload.pillars"
          :key="pillar.title"
          class="slide-panel fragment p-5"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            Pillar
          </p>
          <h3 class="mb-3 text-[24px] font-semibold text-slate-900">
            {{ pillar.title }}
          </h3>
          <p class="text-base leading-7 text-slate-600">
            {{ pillar.detail }}
          </p>
        </article>
      </div>

      <div class="grid grid-cols-[1.1fr_0.9fr] gap-6">
        <div class="slide-panel flex h-full items-center p-7">
          <p class="text-[26px] font-semibold leading-[1.5] text-slate-900">
            {{ slide.payload.closing }}
          </p>
        </div>

        <div class="slide-panel flex h-full flex-col justify-between p-6">
          <div>
            <p class="slide-label mb-4">
              Next Steps
            </p>
            <ul class="space-y-4">
              <li
                v-for="item in slide.payload.nextSteps"
                :key="item"
                class="rounded-[18px] border border-slate-200/80 bg-white/50 px-4 py-3.5 text-base leading-7 text-slate-700"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="rounded-[24px] border border-slate-200/80 bg-white/60 px-6 py-4">
        <p class="text-sm leading-6 text-slate-600">
          这套 deck 已经按 JSON 驱动渲染，后续可以直接由 AI 生成 slide 数据，再交给统一的 SlideRenderer 输出页面。
        </p>
      </div>
    </div>
  </SlideShell>
</template>
