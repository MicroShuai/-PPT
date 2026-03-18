<script setup lang="ts">
import { toRef } from 'vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import type { AnySlideDefinition } from '@/types/slide';

const props = withDefaults(
  defineProps<{
    slide: AnySlideDefinition;
    align?: 'start' | 'center';
  }>(),
  {
    align: 'start'
  }
);

const { shellMotion } = useSlideMotion(toRef(props, 'slide'));
</script>

<template>
  <div
    class="slide-shell"
    :class="slide.fullBleed ? 'slide-shell--full-bleed' : ''"
  >
    <div
      v-if="!slide.fullBleed"
      class="pointer-events-none absolute inset-0"
    >
      <div class="absolute left-12 top-10 h-px w-36 bg-gradient-to-r from-blue-300/70 to-transparent" />
      <div class="absolute right-12 top-10 h-px w-48 bg-gradient-to-l from-blue-200/70 to-transparent" />
      <div class="absolute bottom-12 left-14 h-20 w-20 rounded-full border border-blue-100/80" />
      <div class="absolute bottom-10 right-14 h-px w-56 bg-gradient-to-l from-slate-300/70 to-transparent" />
    </div>

    <div
      class="slide-inner"
      :class="[
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        slide.hideHeader ? 'gap-0' : 'gap-7',
        slide.fullBleed ? 'slide-inner--full-bleed' : ''
      ]"
    >
      <header
        v-if="!slide.hideHeader"
        class="space-y-4"
      >
        <p
          v-if="slide.eyebrow"
          class="slide-eyebrow"
          v-bind="shellMotion('eyebrow')"
        >
          {{ slide.eyebrow }}
        </p>
        <div class="space-y-3">
          <h1
            class="slide-title"
            v-bind="shellMotion('title')"
          >
            {{ slide.title }}
          </h1>
          <p
            v-if="slide.subtitle"
            class="slide-subtitle"
            v-bind="shellMotion('subtitle')"
          >
            {{ slide.subtitle }}
          </p>
        </div>
      </header>

      <div class="min-h-0 w-full flex-1">
        <slot />
      </div>
    </div>
  </div>
</template>
