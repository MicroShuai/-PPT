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
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr] gap-5">
      <div class="grid grid-cols-4 gap-4">
        <article
          v-for="(pillar, index) in slide.payload.pillars"
          :key="pillar.title"
          class="slide-stage flex h-full flex-col justify-between px-5 py-4"
          v-bind="motion('card', index)"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <p class="slide-label text-blue-700/80">
              要点 {{ index + 1 }}
            </p>
            <span class="slide-number-chip !h-9 !w-9 !text-sm">
              {{ index + 1 }}
            </span>
          </div>
          <div class="space-y-2">
            <h3 class="text-[21px] font-semibold leading-tight text-slate-900">
              {{ pillar.title }}
            </h3>
            <p class="text-[14px] leading-6 text-slate-600">
              {{ pillar.detail }}
            </p>
          </div>
        </article>
      </div>

      <div class="grid min-h-0 grid-cols-[1.12fr_0.88fr] gap-5">
        <div class="grid min-h-0 gap-4">
          <div
            class="slide-stage flex h-full flex-col items-start justify-start gap-8 px-8 py-7"
            v-bind="motion('panel')"
          >
            <span class="slide-ribbon !px-3 !py-1 !text-[11px] !tracking-[0.18em]">
              Final Takeaway
            </span>
            <p class="text-[28px] font-semibold leading-[1.6] text-slate-900">
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

          <div class="min-h-0">
            <ul class="space-y-4">
              <li
                v-for="(item, index) in slide.payload.nextSteps"
                :key="item"
                class="slide-stage flex items-start gap-4 px-5 py-4 text-[15px] leading-7 text-slate-700"
                v-bind="motion('rail', index)"
              >
                <span class="slide-number-chip !h-10 !w-10 !shrink-0 !text-sm">
                  {{ index + 1 }}
                </span>
                <span class="pt-0.5">
                  {{ item }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
