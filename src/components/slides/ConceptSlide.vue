<script setup lang="ts">
import { computed, toRef } from 'vue';
import SlideMediaPanel from '@/components/common/SlideMediaPanel.vue';
import SlideShell from '@/components/common/SlideShell.vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import type { ConceptSlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: ConceptSlideDefinition;
}>();

const layout = computed(() => props.slide.variant ?? (props.slide.payload.blocks.length > 3 ? 'matrix' : 'spotlight'));
const { motion } = useSlideMotion(toRef(props, 'slide'));
</script>

<template>
  <SlideShell :slide="slide">
    <div
      v-if="layout === 'layers'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5"
    >
      <div
        class="grid gap-5"
        :class="slide.media ? 'grid-cols-[0.92fr_0.56fr_0.72fr]' : 'grid-cols-[1.08fr_0.92fr]'"
      >
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('lead')"
        >
          <p class="text-lg leading-7 text-slate-700">
            {{ slide.payload.lead }}
          </p>
        </div>

        <SlideMediaPanel
          v-if="slide.media"
          :media="slide.media"
          compact
          v-bind="motion('media')"
        />

        <div
          class="slide-frost px-6 py-5"
          v-bind="motion('panel')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.emphasis.title }}
          </p>
          <p class="text-base font-medium leading-7 text-slate-700">
            {{ slide.payload.emphasis.body }}
          </p>
        </div>
      </div>

      <div class="grid min-h-0 grid-cols-2 gap-5">
        <article
          v-for="(block, index) in slide.payload.blocks"
          :key="`${block.label}-${block.value}`"
          class="slide-stage flex flex-col justify-between gap-6 p-6"
          v-bind="motion('card', index)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-3">
              <p class="slide-label text-blue-700/80">
                {{ block.label }}
              </p>
              <p class="text-[28px] font-semibold leading-tight text-slate-900">
                {{ block.value }}
              </p>
            </div>
            <span class="slide-number-chip !h-10 !w-10 !text-base">
              {{ index + 1 }}
            </span>
          </div>
          <p class="text-base leading-7 text-slate-600">
            {{ block.description }}
          </p>
        </article>
      </div>

      <div
        v-if="slide.payload.quote"
        class="slide-quote-card px-6 py-4"
        v-bind="motion('quote')"
      >
        <p class="relative text-base leading-7 text-amber-900">
          “{{ slide.payload.quote }}”
        </p>
      </div>
    </div>

    <div
      v-else-if="layout === 'selector'"
      class="grid h-full min-h-0 grid-cols-[0.96fr_1.04fr] gap-5"
    >
      <div class="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
        <div
          class="slide-stage px-6 py-4"
          v-bind="motion('lead')"
        >
          <p class="text-base leading-7 text-slate-700">
            {{ slide.payload.lead }}
          </p>
        </div>

        <div
          class="slide-frost flex min-h-0 flex-col justify-between px-6 py-4"
          v-bind="motion('panel')"
        >
          <div>
            <p class="slide-label mb-3 text-blue-700/80">
              {{ slide.payload.emphasis.title }}
            </p>
            <p class="text-[22px] font-semibold leading-[1.45] text-slate-900">
              {{ slide.payload.emphasis.body }}
            </p>
          </div>
        </div>

        <div
          v-if="slide.payload.quote"
          class="slide-ribbon !px-3 !py-1.5"
          v-bind="motion('tag')"
        >
          {{ slide.payload.quote }}
        </div>
      </div>

      <div class="grid min-h-0 gap-3">
        <article
          v-for="(block, index) in slide.payload.blocks"
          :key="`${block.label}-${block.value}`"
          class="slide-rail-card pl-10 pr-5 py-4"
          v-bind="motion('rail', index)"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="slide-label text-blue-700/80">
              {{ block.label }}
            </p>
            <span class="slide-ribbon !px-3 !py-1">
              Option {{ index + 1 }}
            </span>
          </div>
          <p class="mb-2 text-[24px] font-semibold text-slate-900">
            {{ block.value }}
          </p>
          <p class="text-[15px] leading-6 text-slate-600">
            {{ block.description }}
          </p>
        </article>
      </div>
    </div>

    <div
      v-else-if="layout === 'matrix'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5"
    >
      <div
        class="grid gap-5"
        :class="slide.media ? 'grid-cols-[0.86fr_0.56fr_0.58fr]' : 'grid-cols-[1.1fr_0.9fr]'"
      >
        <div
          class="slide-stage px-6 py-5"
          v-bind="motion('lead')"
        >
          <p class="text-lg leading-7 text-slate-700">
            {{ slide.payload.lead }}
          </p>
        </div>

        <SlideMediaPanel
          v-if="slide.media"
          :media="slide.media"
          compact
          v-bind="motion('media')"
        />

        <div
          class="slide-frost px-6 py-5"
          v-bind="motion('panel')"
        >
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.emphasis.title }}
          </p>
          <p class="text-base font-medium leading-7 text-slate-700">
            {{ slide.payload.emphasis.body }}
          </p>
        </div>
      </div>

      <div class="grid min-h-0 grid-cols-2 gap-5">
        <article
          v-for="(block, index) in slide.payload.blocks"
          :key="`${block.label}-${block.value}`"
          class="slide-stage flex flex-col justify-between gap-6 p-6"
          :class="index % 2 === 1 ? 'translate-y-4' : ''"
          v-bind="motion('card', index)"
        >
          <div class="space-y-4">
            <p class="slide-label text-blue-700/80">
              {{ block.label }}
            </p>
            <p class="text-[28px] font-semibold leading-tight text-slate-900">
              {{ block.value }}
            </p>
          </div>
          <p class="text-base leading-7 text-slate-600">
            {{ block.description }}
          </p>
        </article>
      </div>

      <div
        v-if="slide.payload.quote"
        class="slide-ribbon"
        v-bind="motion('quote')"
      >
        {{ slide.payload.quote }}
      </div>
    </div>

    <div
      v-else
      class="grid h-full min-h-0 grid-cols-[0.98fr_1.02fr] gap-6"
    >
      <div
        class="grid min-h-0 gap-5"
        :class="slide.media ? 'grid-rows-[auto_minmax(0,0.9fr)_1fr_auto]' : 'grid-rows-[auto_1fr_auto]'"
      >
        <div
          class="slide-stage px-6 py-6"
          v-bind="motion('lead')"
        >
          <p class="text-[22px] leading-8 text-slate-700">
            {{ slide.payload.lead }}
          </p>
        </div>

        <SlideMediaPanel
          v-if="slide.media"
          :media="slide.media"
          compact
          v-bind="motion('media')"
        />

        <div
          class="slide-frost flex min-h-0 flex-col justify-between px-6 py-6"
          v-bind="motion('panel')"
        >
          <div>
            <p class="slide-label mb-3 text-blue-700/80">
              {{ slide.payload.emphasis.title }}
            </p>
            <p class="text-[24px] font-semibold leading-[1.55] text-slate-900">
              {{ slide.payload.emphasis.body }}
            </p>
          </div>
        </div>

        <div
          v-if="slide.payload.quote"
          class="slide-quote-card px-6 py-4"
          v-bind="motion('quote')"
        >
          <p class="relative text-base leading-7 text-amber-900">
            “{{ slide.payload.quote }}”
          </p>
        </div>
      </div>

      <div class="grid min-h-0 gap-4">
        <article
          v-for="(block, index) in slide.payload.blocks"
          :key="`${block.label}-${block.value}`"
          class="slide-stage flex flex-col justify-between gap-6 p-6"
          :class="index === 1 ? 'ml-6' : index === 2 ? 'ml-12' : ''"
          v-bind="motion('card', index)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-3">
              <p class="slide-label text-blue-700/80">
                {{ block.label }}
              </p>
              <p class="text-[28px] font-semibold leading-tight text-slate-900">
                {{ block.value }}
              </p>
            </div>
            <span class="slide-ribbon !px-3 !py-1">
              {{ index + 1 }}
            </span>
          </div>

          <p class="text-base leading-7 text-slate-600">
            {{ block.description }}
          </p>
        </article>
      </div>
    </div>
  </SlideShell>
</template>
