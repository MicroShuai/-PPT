<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { CoverSlideDefinition } from '@/types/slide';

defineProps<{
  slide: CoverSlideDefinition;
}>();
</script>

<template>
  <SlideShell
    :slide="slide"
    align="center"
  >
    <div class="grid h-full w-full grid-cols-[1.35fr_0.95fr] gap-8">
      <div class="flex flex-col justify-between">
        <div class="slide-panel p-8 text-left">
          <p class="slide-label mb-4 text-blue-700/80">
            Session Thesis
          </p>
          <p class="text-[34px] font-semibold leading-[1.45] text-slate-900">
            {{ slide.payload.headline }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <span
            v-for="item in slide.payload.highlights"
            :key="item"
            class="rounded-full border border-blue-200 bg-blue-50/90 px-5 py-3 text-lg font-medium text-blue-700"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div class="slide-panel flex-1 p-8">
          <p class="slide-label mb-6">
            Presentation Snapshot
          </p>
          <div class="grid gap-4">
            <div
              v-for="metric in slide.payload.metrics"
              :key="metric.label"
              class="slide-panel-soft flex items-end justify-between px-5 py-5"
            >
              <div class="text-left">
                <p class="slide-label mb-2">
                  {{ metric.label }}
                </p>
                <p class="text-2xl font-semibold text-slate-900">
                  {{ metric.value }}
                </p>
              </div>
              <div class="h-12 w-12 rounded-2xl border border-blue-200 bg-blue-50/90" />
            </div>
          </div>
        </div>

        <div class="slide-panel px-8 py-6 text-left">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="slide-label mb-2">
                Speaker
              </p>
              <p class="text-lg font-medium text-slate-800">
                {{ slide.payload.speaker }}
              </p>
            </div>
            <p class="max-w-sm text-sm leading-6 text-slate-600">
              {{ slide.payload.footer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
