<script setup lang="ts">
import { computed } from 'vue';
import InspectReporter from '@/components/InspectReporter.vue';
import SlideRenderer from '@/components/SlideRenderer.vue';
import PresentationDeck from '@/components/PresentationDeck.vue';
import { promptEngineeringDeck } from '@/data/prompt-engineering-deck';

const searchParams = new URLSearchParams(window.location.search);
const inspectParam = searchParams.get('inspect');
const inspectMode = inspectParam === '1';
const inspectAllMode = inspectParam === 'all';
const requestedSlide = Number.parseInt(searchParams.get('slide') ?? '0', 10);

const inspectSlideIndex = computed(() => {
  if (Number.isNaN(requestedSlide)) {
    return 0;
  }

  return Math.min(Math.max(requestedSlide, 0), promptEngineeringDeck.slides.length - 1);
});

const inspectSlide = computed(() => promptEngineeringDeck.slides[inspectSlideIndex.value]);
</script>

<template>
  <main class="min-h-screen bg-transparent text-deck-text">
    <div
      v-if="inspectMode"
      class="flex min-h-screen items-center justify-center p-4"
    >
      <div
        class="inspect-stage relative h-[900px] w-[1600px]"
        :data-slide-index="inspectSlideIndex"
        :data-slide-id="inspectSlide.id"
        :data-slide-type="inspectSlide.type"
      >
        <SlideRenderer :slide="inspectSlide" />
      </div>

      <InspectReporter />

      <div
        id="inspect-report"
        :data-slide-index="inspectSlideIndex"
        :data-slide-id="inspectSlide.id"
        :data-slide-type="inspectSlide.type"
      />
    </div>

    <div
      v-else-if="inspectAllMode"
      class="flex min-h-screen flex-col items-center gap-8 p-4"
    >
      <div
        v-for="(slide, index) in promptEngineeringDeck.slides"
        :key="slide.id"
        class="inspect-stage relative h-[900px] w-[1600px]"
        :data-slide-index="index"
        :data-slide-id="slide.id"
        :data-slide-type="slide.type"
      >
        <SlideRenderer :slide="slide" />
      </div>

      <InspectReporter />
      <div id="inspect-report" />
    </div>

    <PresentationDeck
      v-else
      :deck="promptEngineeringDeck"
    />
  </main>
</template>
