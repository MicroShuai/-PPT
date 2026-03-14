<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { CoverSlideDefinition } from '@/types/slide';

defineProps<{
  slide: CoverSlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full min-h-0 w-full grid-cols-[1.18fr_0.82fr] gap-8">
      <div class="relative flex min-h-0 flex-col justify-between pl-5 text-left">
        <div class="absolute bottom-10 left-0 top-3 w-px bg-gradient-to-b from-blue-300 via-blue-200/60 to-transparent" />

        <div class="space-y-6">
          <span class="slide-ribbon">
            Session Thesis
          </span>

          <div class="max-w-4xl space-y-5">
            <p class="text-[42px] font-semibold leading-[1.3] text-slate-900">
              {{ slide.payload.headline }}
            </p>
            <p class="max-w-3xl text-[18px] leading-8 text-slate-600">
              {{ slide.subtitle }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <span
            v-for="item in slide.payload.highlights"
            :key="item"
            class="rounded-full border border-blue-200/90 bg-white/75 px-5 py-3 text-base font-medium tracking-[0.03em] text-blue-700 shadow-sm"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div class="grid min-h-0 grid-rows-[auto_1fr_auto] gap-5">
        <div class="slide-frost px-6 py-4 text-left">
          <p class="slide-label mb-2 text-blue-700/80">
            Presentation Snapshot
          </p>
          <p class="text-base leading-7 text-slate-600">
            用一套前端化演示系统，把提示词工程方法论转成可演讲、可复用、可扩展的业务表达结构。
          </p>
        </div>

        <div class="grid gap-4">
          <div
            v-for="metric in slide.payload.metrics"
            :key="metric.label"
            class="slide-stage flex items-end justify-between px-5 py-5 text-left"
          >
            <div>
              <p class="slide-label mb-2">
                {{ metric.label }}
              </p>
              <p class="text-[28px] font-semibold text-slate-900">
                {{ metric.value }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-[18px] border border-blue-200/80 bg-blue-50/90">
              <div class="h-5 w-5 rounded-full bg-blue-300/80" />
            </div>
          </div>
        </div>

        <div class="slide-quote-card px-6 py-5 text-left">
          <div class="relative flex items-end justify-between gap-6">
            <div>
              <p class="slide-label mb-2 text-amber-700">
                Speaker
              </p>
              <p class="text-lg font-medium text-slate-800">
                {{ slide.payload.speaker }}
              </p>
            </div>
            <p class="max-w-[18rem] text-sm leading-6 text-slate-600">
              {{ slide.payload.footer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
