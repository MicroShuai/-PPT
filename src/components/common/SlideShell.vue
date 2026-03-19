<script setup lang="ts">
import { toRef } from 'vue'
import { useSlideMotion } from '@/composables/useSlideMotion'
import type { AnySlideDefinition } from '@/types/slide'

const props = withDefaults(
  defineProps<{
    slide: AnySlideDefinition
    align?: 'start' | 'center'
  }>(),
  {
    align: 'start'
  }
)

const { shellMotion } = useSlideMotion(toRef(props, 'slide'))
</script>

<template>
  <div
    class="slide-shell"
    :class="slide.fullBleed ? 'slide-shell--full-bleed' : ''"
  >
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
            v-if="slide.subtitle && !['case-study', 'flow'].includes(slide.type)"
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
