<script setup lang="ts">
import { toRef } from 'vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import type { AgendaSlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: AgendaSlideDefinition;
}>();

const { motion } = useSlideMotion(toRef(props, 'slide'));
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full min-h-0 w-full grid-cols-[1.08fr_0.92fr] gap-6">
      <div class="relative pl-7">
        <div class="absolute bottom-5 left-[1.55rem] top-6 w-px bg-gradient-to-b from-blue-300 via-blue-200/50 to-transparent" />

        <div class="grid gap-3">
          <article
            v-for="(item, index) in slide.payload.items"
            :key="item.title"
            class="slide-rail-card pl-16 pr-5 py-4"
            v-bind="motion('rail', index)"
          >
            <div class="absolute left-0 top-4 flex h-11 w-11 items-center justify-center rounded-[16px] border border-blue-200 bg-white/90 text-base font-semibold text-blue-700 shadow-sm">
              {{ String(index + 1).padStart(2, '0') }}
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <h3 class="text-[22px] font-semibold text-slate-900">
                  {{ item.title }}
                </h3>
                <span class="slide-ribbon !px-3 !py-1 !tracking-[0.14em]">
                  {{ item.tag }}
                </span>
              </div>
              <p class="text-[15px] leading-6 text-slate-700">
                {{ item.description }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <aside class="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('aside')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            Roadmap Intent
          </p>
          <h3 class="text-[28px] font-semibold leading-tight text-slate-900">
            {{ slide.payload.aside.title }}
          </h3>
        </div>

        <div class="grid gap-3">
          <div
            v-for="(point, index) in slide.payload.aside.points"
            :key="point"
            class="slide-frost px-4 py-3.5"
            v-bind="motion('checkpoint', index)"
          >
            <div class="flex items-start gap-4">
              <span class="slide-number-chip !h-10 !w-10 !rounded-2xl !text-base">
                {{ index + 1 }}
              </span>
              <p class="pt-1 text-[15px] leading-6 text-slate-700">
                {{ point }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2.5">
          <span
            v-for="(item, index) in slide.payload.items"
            :key="`${item.title}-${item.tag}`"
            class="slide-ribbon !px-3 !py-1 !text-[11px]"
            v-bind="motion('tag', index)"
          >
            {{ item.tag }}
          </span>
        </div>
      </aside>
    </div>
  </SlideShell>
</template>
