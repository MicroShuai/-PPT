<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { ConceptSlideDefinition } from '@/types/slide';

defineProps<{
  slide: ConceptSlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="flex h-full flex-col gap-6">
      <div class="slide-panel px-6 py-5">
        <p class="text-lg leading-7 text-slate-700">
          {{ slide.payload.lead }}
        </p>
      </div>

      <div
        class="grid flex-1 gap-5"
        :class="slide.payload.blocks.length > 3 ? 'grid-cols-2' : 'grid-cols-3'"
      >
        <article
          v-for="block in slide.payload.blocks"
          :key="`${block.label}-${block.value}`"
          class="slide-panel fragment flex flex-col justify-between gap-8 p-6"
        >
          <div class="space-y-4">
            <p class="slide-label text-blue-700/80">
              {{ block.label }}
            </p>
            <p class="text-[30px] font-semibold text-slate-900">
              {{ block.value }}
            </p>
          </div>
          <p class="text-base leading-7 text-slate-600">
            {{ block.description }}
          </p>
        </article>
      </div>

      <div class="grid grid-cols-[1.05fr_0.95fr] gap-6">
        <div class="rounded-[24px] border border-blue-200 bg-blue-50/90 px-6 py-5">
          <p class="slide-label mb-3 text-blue-700">
            {{ slide.payload.emphasis.title }}
          </p>
          <p class="text-base font-medium leading-7 text-blue-800">
            {{ slide.payload.emphasis.body }}
          </p>
        </div>

        <div
          v-if="slide.payload.quote"
          class="slide-panel px-6 py-5"
        >
          <p class="slide-label mb-3">
            Shareable Line
          </p>
          <p class="text-base leading-7 text-slate-700">
            “{{ slide.payload.quote }}”
          </p>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
