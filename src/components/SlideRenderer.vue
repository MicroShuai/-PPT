<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { Component } from 'vue';
import CoverSlide from '@/components/slides/CoverSlide.vue';
import AgendaSlide from '@/components/slides/AgendaSlide.vue';
import ThreeColumnSlide from '@/components/slides/ThreeColumnSlide.vue';
import ConceptSlide from '@/components/slides/ConceptSlide.vue';
import CaseStudySlide from '@/components/slides/CaseStudySlide.vue';
import FlowSlide from '@/components/slides/FlowSlide.vue';
import SummarySlide from '@/components/slides/SummarySlide.vue';
import { useSlideMotion } from '@/composables/useSlideMotion';
import type { AnySlideDefinition, SlideType } from '@/types/slide';

const props = defineProps<{
  slide: AnySlideDefinition;
}>();

const componentMap: Record<SlideType, Component> = {
  cover: CoverSlide,
  agenda: AgendaSlide,
  'three-column': ThreeColumnSlide,
  concept: ConceptSlide,
  'case-study': CaseStudySlide,
  flow: FlowSlide,
  summary: SummarySlide
};

const currentComponent = computed(() => componentMap[props.slide.type]);
const { scopeAttrs } = useSlideMotion(toRef(props, 'slide'));
</script>

<template>
  <div
    class="h-full w-full"
    v-bind="scopeAttrs"
    :data-slide-type="slide.type"
    :data-slide-variant="slide.variant ?? 'default'"
  >
    <component
      :is="currentComponent"
      :slide="slide"
    />
  </div>
</template>
