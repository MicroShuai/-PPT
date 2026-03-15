<script setup lang="ts">
import type { SlideMedia } from '@/types/slide';

withDefaults(
  defineProps<{
    media: SlideMedia;
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);
</script>

<template>
  <figure
    class="slide-stage flex h-full min-h-0 flex-col"
    :class="compact ? 'gap-3 p-4' : 'gap-4 p-5'"
  >
    <div class="relative min-h-0 flex-1 overflow-hidden rounded-[24px] border border-white/60 bg-white/55">
      <img
        :src="media.src"
        :alt="media.alt"
        class="h-full w-full"
        :class="media.fit === 'cover' ? 'object-cover' : 'object-contain p-4'"
      >
    </div>

    <figcaption
      v-if="media.caption"
      class="text-sm leading-6 text-slate-600"
    >
      {{ media.caption }}
    </figcaption>
  </figure>
</template>
