<script setup lang="ts">
import type { AnySlideDefinition } from '@/types/slide';

withDefaults(
  defineProps<{
    slide: AnySlideDefinition;
    align?: 'start' | 'center';
  }>(),
  {
    align: 'start'
  }
);
</script>

<template>
  <div class="slide-shell">
    <div
      class="slide-inner"
      :class="align === 'center' ? 'items-center text-center' : 'items-start text-left'"
    >
      <header class="space-y-4">
        <p
          v-if="slide.eyebrow"
          class="slide-eyebrow"
        >
          {{ slide.eyebrow }}
        </p>
        <div class="space-y-3">
          <h1 class="slide-title">
            {{ slide.title }}
          </h1>
          <p
            v-if="slide.subtitle"
            class="slide-subtitle"
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

