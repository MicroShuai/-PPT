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

const shellClasses = computed(() =>
  isFullscreen.value
    ? 'presentation-shell presentation-shell-fullscreen px-0 py-0'
    : 'presentation-shell px-4 py-4'
);

const badgeClasses = computed(() =>
  isFullscreen.value
    ? 'inset-x-4 top-4'
    : 'inset-x-8 top-4'
);
const buttonLabel = computed(() => (isFullscreen.value ? '退出全屏' : '全屏演示'));

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
      class="pointer-events-none absolute z-10 flex items-center justify-between text-sm text-slate-500 transition-all duration-300"
      :class="badgeClasses"
    >
      <div class="rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 backdrop-blur-md">
        {{ deck.meta.title }}
      </div>
      <div class="rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 backdrop-blur-md">
        {{ deck.meta.topic }}
      </div>
    </div>

    <div class="absolute bottom-8 left-4 z-20 flex items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center rounded-full border border-slate-200/80 bg-white/78 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition hover:border-blue-200 hover:text-blue-700"
        @click="void toggleFullscreen()"
      >
        {{ buttonLabel }}
      </button>

      <div class="rounded-full border border-slate-200/80 bg-white/60 px-3 py-2 text-xs font-medium text-slate-500 backdrop-blur-md">
        快捷键 F
      </div>
    </div>

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
