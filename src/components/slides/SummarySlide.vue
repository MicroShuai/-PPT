<script setup lang="ts">
import { toRef } from 'vue';
import SlideMediaPanel from '@/components/common/SlideMediaPanel.vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import type { SummarySlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: SummarySlideDefinition;
}>();

const { motion } = useSlideMotion(toRef(props, 'slide'));
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr] gap-6">
      <div class="grid grid-cols-4 gap-4">
        <article
          v-for="(pillar, index) in slide.payload.pillars"
          :key="pillar.title"
          class="slide-frost px-5 py-4"
          v-bind="motion('card', index)"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            要点 {{ index + 1 }}
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
        <div
          class="grid min-h-0 gap-4"
          :class="slide.media ? 'grid-cols-[0.9fr_0.7fr]' : 'grid-cols-1'"
        >
          <div
            class="slide-stage flex h-full items-center px-8 py-8"
            v-bind="motion('panel')"
          >
            <p class="text-[30px] font-semibold leading-[1.55] text-slate-900">
              {{ slide.payload.closing }}
            </p>
          </div>

          <SlideMediaPanel
            v-if="slide.media"
            :media="slide.media"
            compact
            v-bind="motion('media')"
          />
        </div>

        <div class="grid min-h-0 grid-rows-[auto_1fr] gap-4">
          <div class="slide-ribbon">
            落地建议
          </div>

          <div>
            <ul class="space-y-4">
              <li
                v-for="(item, index) in slide.payload.nextSteps"
                :key="item"
                class="slide-rail-card px-5 py-4 pl-10 text-base leading-7 text-slate-700"
                v-bind="motion('rail', index)"
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
