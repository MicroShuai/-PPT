<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { CaseStudySlideDefinition } from '@/types/slide';

defineProps<{
  slide: CaseStudySlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full min-h-0 grid-cols-[0.92fr_1.08fr] gap-5">
      <div class="flex min-h-0 flex-col gap-5">
        <div class="slide-panel p-5">
          <p class="slide-label mb-2 text-blue-700/80">
            {{ slide.payload.scenarioLabel ?? 'Scenario' }}
          </p>
          <h3 class="text-[22px] font-semibold text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
        </div>

        <div class="slide-panel min-h-0 flex-1 p-5">
          <p class="slide-label mb-3">
            {{ slide.payload.challengeLabel ?? '为什么一开始不好用' }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="item in slide.payload.challenge"
              :key="item"
              class="rounded-[18px] border border-slate-200/80 bg-white/50 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="grid grid-cols-3 gap-3.5">
          <div
            v-for="outcome in slide.payload.outcomes"
            :key="outcome.label"
            class="slide-panel-soft px-4 py-4"
          >
            <p class="slide-label mb-1.5">
              {{ outcome.label }}
            </p>
            <p class="text-lg font-semibold text-slate-900">
              {{ outcome.value }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4">
        <article class="slide-panel fragment min-h-0 overflow-hidden p-0">
          <div class="border-b border-slate-200/80 px-5 py-3.5">
            <p class="slide-label text-rose-600/80">
              {{ slide.payload.beforeLabel ?? 'Before' }}
            </p>
          </div>
          <pre class="h-full min-h-0 overflow-auto px-5 py-4 font-mono text-[13px] leading-5 text-slate-700"><code>{{ slide.payload.beforePrompt }}</code></pre>
        </article>

        <article class="slide-panel fragment min-h-0 overflow-hidden p-0">
          <div class="border-b border-slate-200/80 px-5 py-3.5">
            <p class="slide-label text-emerald-600/80">
              {{ slide.payload.afterLabel ?? 'After' }}
            </p>
          </div>
          <pre class="h-full min-h-0 overflow-auto px-5 py-4 font-mono text-[13px] leading-5 text-slate-800"><code>{{ slide.payload.afterPrompt }}</code></pre>
        </article>

        <div class="rounded-[24px] border border-amber-200 bg-amber-50/90 px-5 py-4">
          <p class="slide-label mb-2 text-amber-700">
            {{ slide.payload.learningsLabel ?? 'Learnings' }}
          </p>
          <ul class="space-y-2">
            <li
              v-for="item in slide.payload.learnings"
              :key="item"
              class="text-[13px] leading-5 text-amber-900"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </SlideShell>
</template>
