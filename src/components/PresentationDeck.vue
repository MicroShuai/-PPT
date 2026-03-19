<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Reveal from 'reveal.js';
import SlideRenderer from '@/components/SlideRenderer.vue';
import type { PresentationDeck as PresentationDeckModel } from '@/types/slide';

const props = defineProps<{
  deck: PresentationDeckModel;
}>();

const deckFrame = ref<HTMLDivElement | null>(null);
const revealRoot = ref<HTMLDivElement | null>(null);
const isFullscreen = ref(false);
let deckInstance: Reveal | null = null;
let layoutTimer: number | null = null;

// Cleanup unused variables
const shellClasses = computed(() =>
  isFullscreen.value
    ? 'presentation-shell presentation-shell-fullscreen px-0 py-0'
    : 'presentation-shell px-4 py-4'
);

function syncFullscreenState(): void {
  isFullscreen.value = document.fullscreenElement === deckFrame.value;
}

function relayoutReveal(): void {
  if (!deckInstance) {
    return;
  }

  deckInstance.layout();
  deckInstance.sync();
  window.dispatchEvent(new Event('resize'));
}

function scheduleRevealLayout(delay = 0): void {
  if (layoutTimer !== null) {
    window.clearTimeout(layoutTimer);
  }

  layoutTimer = window.setTimeout(() => {
    void nextTick().then(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          relayoutReveal();
        });
      });
    });
  }, delay);
}

async function toggleFullscreen(): Promise<void> {
  if (!deckFrame.value) {
    return;
  }

  try {
    if (document.fullscreenElement === deckFrame.value) {
      await document.exitFullscreen();
      return;
    }

    await deckFrame.value.requestFullscreen({ navigationUI: 'hide' });
  } catch (error) {
    console.error('Failed to toggle fullscreen mode', error);
  }
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  const isEditable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable;

  if (isEditable) {
    return;
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault();
    void toggleFullscreen();
  }
}

function handleResize(): void {
  scheduleRevealLayout(0);
}

function handleFullscreenChange(): void {
  syncFullscreenState();
  scheduleRevealLayout(320);
}

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
    controls: false,
    controlsLayout: 'bottom-right',
    controlsBackArrows: 'faded',
    progress: false,
    slideNumber: 'c/t',
    center: false,
    transition: 'fade',
    backgroundTransition: 'none',
    navigationMode: 'linear'
  });

  await deckInstance.initialize();
}

onMounted(() => {
  syncFullscreenState();
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);
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
  if (layoutTimer !== null) {
    window.clearTimeout(layoutTimer);
  }

  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
  deckInstance?.destroy();
});
</script>

<template>
  <div
    ref="deckFrame"
    class="relative h-screen w-screen overflow-hidden transition-all duration-300"
    :class="shellClasses"
  >
    <div
      ref="revealRoot"
      class="reveal relative z-0 h-full w-full"
      @dblclick="void toggleFullscreen()"
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
