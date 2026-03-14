<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { SummarySlideDefinition } from '@/types/slide';

defineProps<{
  slide: SummarySlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr] gap-6">
      <div class="grid grid-cols-4 gap-4">
        <article
          v-for="(pillar, index) in slide.payload.pillars"
          :key="pillar.title"
          class="slide-frost fragment px-5 py-4"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            Pillar {{ index + 1 }}
          </p>
          <h3 class="mb-2 text-[22px] font-semibold text-slate-900">
            {{ pillar.title }}
          </h3>
          <p class="text-[15px] leading-6 text-slate-600">
            {{ pillar.detail }}
          </p>
        </article>
      </div>

      <div class="grid min-h-0 grid-cols-[1.14fr_0.86fr] gap-6">
        <div class="slide-stage flex h-full items-center px-8 py-8">
          <p class="text-[30px] font-semibold leading-[1.55] text-slate-900">
            {{ slide.payload.closing }}
          </p>
        </div>

        <div class="grid min-h-0 grid-rows-[auto_1fr] gap-4">
          <div class="slide-ribbon">
            Next Steps
          </div>

          <div>
            <ul class="space-y-4">
              <li
                v-for="item in slide.payload.nextSteps"
                :key="item"
                class="slide-rail-card px-5 py-4 pl-10 text-base leading-7 text-slate-700"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
