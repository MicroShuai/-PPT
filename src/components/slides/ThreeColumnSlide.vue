<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { ThreeColumnSlideDefinition } from '@/types/slide';

defineProps<{
  slide: ThreeColumnSlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="flex h-full flex-col gap-6">
      <div class="slide-panel px-6 py-5">
        <p class="text-lg leading-7 text-slate-700">
          {{ slide.payload.intro }}
        </p>
      </div>

      <div class="grid flex-1 grid-cols-3 gap-6">
        <article
          v-for="column in slide.payload.columns"
          :key="column.title"
          class="slide-panel fragment flex h-full flex-col p-6"
        >
          <div class="mb-6 space-y-3">
            <p class="slide-label text-blue-700/80">
              {{ column.caption }}
            </p>
            <h3 class="text-[26px] font-semibold text-slate-900">
              {{ column.title }}
            </h3>
          </div>

          <ul class="space-y-4">
            <li
              v-for="point in column.points"
              :key="point"
              class="rounded-[18px] border border-slate-200/80 bg-white/50 px-4 py-3.5 text-base leading-7 text-slate-700"
            >
              {{ point }}
            </li>
          </ul>
        </article>
      </div>

      <div class="rounded-[24px] border border-blue-200 bg-blue-50/90 px-6 py-5">
        <p class="text-base font-medium leading-7 text-blue-800">
          {{ slide.payload.takeaway }}
        </p>
      </div>
    </div>
  </SlideShell>
</template>
