<script setup lang="ts">
import { computed, toRef } from 'vue';
import SlideMediaPanel from '@/components/common/SlideMediaPanel.vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import type { ThreeColumnSlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: ThreeColumnSlideDefinition;
}>();

const layout = computed(() => props.slide.variant ?? 'signal');
const { motion } = useSlideMotion(toRef(props, 'slide'));
</script>

<template>
  <SlideShell :slide="slide">
    <div
      v-if="layout === 'alert'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5"
    >
      <div class="grid grid-cols-[1.08fr_0.92fr] gap-5">
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('intro')"
        >
          <p class="text-lg leading-7 text-slate-700">
            {{ slide.payload.intro }}
          </p>
        </div>

        <SlideMediaPanel
          v-if="slide.media"
          :media="slide.media"
          compact
          v-bind="motion('media')"
        />

        <div
          v-else
          class="slide-frost flex items-center justify-between px-6 py-5"
          v-bind="motion('media')"
        >
          <div>
            <p class="slide-label mb-2 text-blue-700/80">
              Threat Model
            </p>
            <p class="text-lg font-medium leading-7 text-slate-800">
              {{ slide.payload.columns.length }} categories
            </p>
          </div>
          <div class="h-14 w-14 rounded-full border border-blue-200/80 bg-blue-50/80" />
        </div>
      </div>

      <div class="grid min-h-0 grid-cols-3 gap-5">
        <article
          v-for="(column, index) in slide.payload.columns"
          :key="column.title"
          class="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/75 shadow-panel backdrop-blur-md"
          v-bind="motion('column', index)"
        >
          <div
            class="px-5 py-4"
            :class="index === 0 ? 'bg-rose-50/80' : index === 1 ? 'bg-amber-50/80' : 'bg-blue-50/80'"
          >
            <p
              class="slide-label mb-2"
              :class="index === 0 ? 'text-rose-700/80' : index === 1 ? 'text-amber-700/80' : 'text-blue-700/80'"
            >
              {{ column.caption }}
            </p>
            <h3 class="text-[24px] font-semibold text-slate-900">
              {{ column.title }}
            </h3>
          </div>

          <ul class="flex-1 space-y-3 px-5 py-5">
            <li
              v-for="point in column.points"
              :key="point"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ point }}
            </li>
          </ul>
        </article>
      </div>

      <div
        class="slide-quote-card px-6 py-4"
        v-bind="motion('quote')"
      >
        <p class="relative text-base font-medium leading-7 text-amber-900">
          {{ slide.payload.takeaway }}
        </p>
      </div>
    </div>

    <div
      v-else-if="layout === 'stack'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5"
    >
      <div class="grid grid-cols-[1.15fr_0.85fr] gap-5">
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('intro')"
        >
          <p class="text-lg leading-7 text-slate-700">
            {{ slide.payload.intro }}
          </p>
        </div>

        <SlideMediaPanel
          v-if="slide.media"
          :media="slide.media"
          compact
          v-bind="motion('media')"
        />

        <div
          v-else
          class="flex flex-wrap content-start gap-3"
        >
          <span
            v-for="(column, index) in slide.payload.columns"
            :key="column.caption"
            class="slide-ribbon"
            v-bind="motion('tag', index)"
          >
            {{ column.caption }}
          </span>
        </div>
      </div>

      <div class="grid min-h-0 grid-cols-3 gap-5">
        <article
          v-for="(column, index) in slide.payload.columns"
          :key="column.title"
          class="slide-rail-card flex h-full flex-col pl-10 pr-5 py-5"
          v-bind="motion('rail', index)"
        >
          <div class="mb-5 flex items-start justify-between gap-3">
            <div class="space-y-3">
              <p class="slide-label text-blue-700/80">
                {{ column.caption }}
              </p>
              <h3 class="text-[24px] font-semibold text-slate-900">
                {{ column.title }}
              </h3>
            </div>
            <span class="slide-number-chip !h-10 !w-10 !text-base">
              {{ index + 1 }}
            </span>
          </div>

          <ul class="space-y-3">
            <li
              v-for="point in column.points"
              :key="point"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ point }}
            </li>
          </ul>
        </article>
      </div>

      <div
        class="slide-frost px-6 py-4"
        v-bind="motion('quote')"
      >
        <p class="text-base font-medium leading-7 text-slate-700">
          {{ slide.payload.takeaway }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5"
    >
      <div class="grid grid-cols-[1.05fr_0.95fr] gap-5">
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('intro')"
        >
          <p class="text-lg leading-7 text-slate-700">
            {{ slide.payload.intro }}
          </p>
        </div>

        <SlideMediaPanel
          v-if="slide.media"
          :media="slide.media"
          compact
          v-bind="motion('media')"
        />

        <div
          v-else
          class="slide-frost px-6 py-5"
          v-bind="motion('media')"
        >
          <p class="slide-label mb-2 text-blue-700/80">
            Method Frame
          </p>
          <p class="text-base leading-7 text-slate-700">
            {{ slide.payload.takeaway }}
          </p>
        </div>
      </div>

      <div class="grid min-h-0 grid-cols-3 gap-5">
        <article
          v-for="(column, index) in slide.payload.columns"
          :key="column.title"
          class="slide-stage flex h-full flex-col p-6"
          :class="index === 1 ? 'translate-y-6' : index === 2 ? 'translate-y-12' : ''"
          v-bind="motion('column', index)"
        >
          <div class="mb-5 flex items-start justify-between gap-4">
            <div class="space-y-3">
              <p class="slide-label text-blue-700/80">
                {{ column.caption }}
              </p>
              <h3 class="text-[24px] font-semibold text-slate-900">
                {{ column.title }}
              </h3>
            </div>
            <span class="slide-number-chip">
              {{ index + 1 }}
            </span>
          </div>

          <ul class="space-y-3">
            <li
              v-for="point in column.points"
              :key="point"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ point }}
            </li>
          </ul>
        </article>
      </div>
    </div>
  </SlideShell>
</template>
