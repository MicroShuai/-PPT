<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Reveal from 'reveal.js';
import SlideRenderer from '@/components/SlideRenderer.vue';
import type { PresentationDeck as PresentationDeckModel } from '@/types/slide';

const props = defineProps<{
  deck: PresentationDeckModel;
}>();

const revealRoot = ref<HTMLDivElement | null>(null);
let deckInstance: Reveal | null = null;

async function initReveal(): Promise<void> {
  if (!revealRoot.value) {
    return;
  }

  await nextTick();

  if (deckInstance) {
    deckInstance.destroy();
    deckInstance = null;
  }

  deckInstance = new Reveal(revealRoot.value, {
    width: 1600,
    height: 900,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 1.6,
    hash: true,
    controls: true,
    controlsLayout: 'bottom-right',
    controlsBackArrows: 'faded',
    progress: true,
    slideNumber: 'c/t',
    center: false,
    transition: 'fade',
    backgroundTransition: 'none',
    navigationMode: 'linear'
  });

  await deckInstance.initialize();
}

onMounted(() => {
  void initReveal();
});

watch(
  () => props.deck,
  () => {
    void initReveal();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  deckInstance?.destroy();
});
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden px-4 py-4">
    <div
      class="pointer-events-none absolute inset-x-8 top-4 z-10 flex items-center justify-between text-sm text-slate-500"
    >
      <div class="rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 backdrop-blur-md">
        {{ deck.meta.title }}
      </div>
      <div class="rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 backdrop-blur-md">
        {{ deck.meta.topic }}
      </div>
    </div>

    <div
      ref="revealRoot"
      class="reveal relative z-0 h-full w-full"
    >
      <div class="slides">
        <section
          v-for="slide in deck.slides"
          :key="slide.id"
          class="h-full"
        >
          <SlideRenderer :slide="slide" />
        </section>
      </div>
    </div>
  </div>
</template>
