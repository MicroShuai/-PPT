<script setup lang="ts">
import { computed } from 'vue';
import SlideShell from '@/components/common/SlideShell.vue';
import type { CaseStudySlideDefinition } from '@/types/slide';

const props = defineProps<{
  slide: CaseStudySlideDefinition;
}>();

const layout = computed(() => props.slide.variant ?? 'compare');
const examplePairs = computed(() => props.slide.payload.examplePairs ?? []);
</script>

<template>
  <SlideShell :slide="slide">
    <div
      v-if="layout === 'manifesto'"
      class="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-4"
    >
      <div class="grid grid-cols-[1.04fr_0.96fr] gap-4">
        <div class="slide-stage px-6 py-5">
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.scenarioLabel ?? 'Scenario' }}
          </p>
          <h3 class="text-[28px] font-semibold leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
        </div>

        <div class="grid grid-cols-3 gap-3.5">
          <div
            v-for="outcome in slide.payload.outcomes"
            :key="outcome.label"
            class="slide-frost px-4 py-4"
          >
            <p class="slide-label mb-2">
              {{ outcome.label }}
            </p>
            <p class="text-lg font-semibold text-slate-900">
              {{ outcome.value }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid min-h-0 grid-cols-[0.74fr_1.26fr] gap-4">
        <div class="slide-rail-card flex min-h-0 flex-col pl-10 pr-5 py-4">
          <p class="slide-label mb-3">
            {{ slide.payload.challengeLabel ?? '为什么一开始不好用' }}
          </p>
          <ul class="space-y-2.5">
            <li
              v-for="item in slide.payload.challenge"
              :key="item"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-2.5 text-[14px] leading-6 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="grid min-h-0 grid-cols-2 gap-4">
          <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
            <div class="border-b border-slate-200/80 px-5 py-3.5">
              <p class="slide-label text-rose-600/80">
                {{ slide.payload.beforeLabel ?? 'Before' }}
              </p>
            </div>
            <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-700"><code>{{ slide.payload.beforePrompt }}</code></pre>
          </article>

          <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
            <div class="border-b border-slate-200/80 px-5 py-3.5">
              <p class="slide-label text-emerald-600/80">
                {{ slide.payload.afterLabel ?? 'After' }}
              </p>
            </div>
            <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-800"><code>{{ slide.payload.afterPrompt }}</code></pre>
          </article>
        </div>
      </div>

      <div
        class="grid gap-4"
        :class="examplePairs.length ? 'grid-cols-[0.9fr_1.1fr]' : 'grid-cols-1'"
      >
        <div class="slide-quote-card px-5 py-4">
          <p class="slide-label relative mb-2 text-amber-700">
            {{ slide.payload.learningsLabel ?? 'Learnings' }}
          </p>
          <ul class="relative space-y-1.5">
            <li
              v-for="item in slide.payload.learnings"
              :key="item"
              class="text-[13px] leading-5 text-amber-900"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div
          v-if="examplePairs.length"
          class="grid grid-cols-2 gap-3"
        >
          <article
            v-for="pair in examplePairs"
            :key="pair.title"
            class="slide-frost px-4 py-4"
          >
            <p class="slide-label mb-3 text-blue-700/80">
              {{ pair.title }}
            </p>

            <div class="space-y-2">
              <div class="rounded-[16px] border border-rose-200 bg-white/70 px-3 py-2.5">
                <p class="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600/80">
                  错误
                </p>
                <p class="text-[12px] leading-5 text-slate-700">
                  {{ pair.before }}
                </p>
              </div>

              <div class="rounded-[16px] border border-emerald-200 bg-white/70 px-3 py-2.5">
                <p class="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
                  专业
                </p>
                <p class="text-[12px] leading-5 text-slate-800">
                  {{ pair.after }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div
      v-else-if="layout === 'workflow'"
      class="grid h-full min-h-0 grid-cols-[0.92fr_1.08fr] gap-5"
    >
      <div class="grid min-h-0 grid-rows-[auto_auto_1fr] gap-5">
        <div class="slide-stage px-6 py-5">
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.scenarioLabel ?? 'Workflow' }}
          </p>
          <h3 class="text-[24px] font-semibold leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
        </div>

        <div class="grid grid-cols-3 gap-3.5">
          <div
            v-for="outcome in slide.payload.outcomes"
            :key="outcome.label"
            class="slide-frost px-4 py-4"
          >
            <p class="slide-label mb-1.5">
              {{ outcome.label }}
            </p>
            <p class="text-lg font-semibold text-slate-900">
              {{ outcome.value }}
            </p>
          </div>
        </div>

        <div class="slide-rail-card flex min-h-0 flex-col pl-10 pr-5 py-5">
          <p class="slide-label mb-4">
            {{ slide.payload.challengeLabel ?? '关键约束' }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="item in slide.payload.challenge"
              :key="item"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <div class="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4">
        <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
          <div class="border-b border-slate-200/80 px-5 py-3.5">
            <p class="slide-label text-rose-600/80">
              {{ slide.payload.beforeLabel ?? 'Before' }}
            </p>
          </div>
          <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-700"><code>{{ slide.payload.beforePrompt }}</code></pre>
        </article>

        <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
          <div class="border-b border-slate-200/80 px-5 py-3.5">
            <p class="slide-label text-emerald-600/80">
              {{ slide.payload.afterLabel ?? 'After' }}
            </p>
          </div>
          <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-800"><code>{{ slide.payload.afterPrompt }}</code></pre>
        </article>

        <div class="slide-frost px-5 py-4">
          <p class="slide-label mb-2 text-blue-700/80">
            {{ slide.payload.learningsLabel ?? 'Learnings' }}
          </p>
          <ul class="grid grid-cols-3 gap-3">
            <li
              v-for="item in slide.payload.learnings"
              :key="item"
              class="text-[13px] leading-5 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div
      v-else-if="layout === 'dossier'"
      class="grid h-full min-h-0 grid-cols-[1.04fr_0.96fr] gap-5"
    >
      <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
        <div class="slide-stage px-6 py-5">
          <p class="slide-label mb-3 text-blue-700/80">
            {{ slide.payload.scenarioLabel ?? 'Case File' }}
          </p>
          <h3 class="text-[24px] font-semibold leading-tight text-slate-900">
            {{ slide.payload.scenario }}
          </h3>
        </div>

        <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
          <div class="border-b border-slate-200/80 px-5 py-3.5">
            <p class="slide-label text-rose-600/80">
              {{ slide.payload.beforeLabel ?? 'Prompt' }}
            </p>
          </div>
          <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-700"><code>{{ slide.payload.beforePrompt }}</code></pre>
        </article>

        <div class="grid grid-cols-3 gap-3.5">
          <div
            v-for="outcome in slide.payload.outcomes"
            :key="outcome.label"
            class="slide-frost px-4 py-4"
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

      <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
        <div class="slide-rail-card pl-10 pr-5 py-5">
          <p class="slide-label mb-4">
            {{ slide.payload.challengeLabel ?? 'Why It Matters' }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="item in slide.payload.challenge"
              :key="item"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
          <div class="border-b border-slate-200/80 px-5 py-3.5">
            <p class="slide-label text-emerald-600/80">
              {{ slide.payload.afterLabel ?? 'Output' }}
            </p>
          </div>
          <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-800"><code>{{ slide.payload.afterPrompt }}</code></pre>
        </article>

        <div class="slide-quote-card px-5 py-4">
          <p class="slide-label relative mb-2 text-amber-700">
            {{ slide.payload.learningsLabel ?? 'Decision Notes' }}
          </p>
          <ul class="relative space-y-2">
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

    <div
      v-else
      class="grid h-full min-h-0 grid-cols-[1.06fr_0.94fr] gap-5"
    >
      <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
        <div class="slide-stage px-6 py-5">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <p class="slide-label mb-2 text-blue-700/80">
                {{ slide.payload.scenarioLabel ?? 'Scenario' }}
              </p>
              <h3 class="text-[24px] font-semibold leading-tight text-slate-900">
                {{ slide.payload.scenario }}
              </h3>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3.5">
            <div
              v-for="outcome in slide.payload.outcomes"
              :key="outcome.label"
              class="slide-frost px-4 py-4"
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

        <div class="grid min-h-0 grid-cols-2 gap-4">
          <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
            <div class="border-b border-slate-200/80 px-5 py-3.5">
              <p class="slide-label text-rose-600/80">
                {{ slide.payload.beforeLabel ?? 'Before' }}
              </p>
            </div>
            <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-700"><code>{{ slide.payload.beforePrompt }}</code></pre>
          </article>

          <article class="slide-stage fragment min-h-0 overflow-hidden p-0">
            <div class="border-b border-slate-200/80 px-5 py-3.5">
              <p class="slide-label text-emerald-600/80">
                {{ slide.payload.afterLabel ?? 'After' }}
              </p>
            </div>
            <pre class="h-full min-h-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13px] leading-5 text-slate-800"><code>{{ slide.payload.afterPrompt }}</code></pre>
          </article>
        </div>
      </div>

      <div class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
        <div class="slide-rail-card flex min-h-0 flex-col pl-10 pr-5 py-5">
          <p class="slide-label mb-4">
            {{ slide.payload.challengeLabel ?? '为什么一开始不好用' }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="item in slide.payload.challenge"
              :key="item"
              class="rounded-[18px] border border-slate-200/80 bg-white/60 px-4 py-3 text-[15px] leading-6 text-slate-700"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="slide-quote-card px-5 py-4">
          <p class="slide-label relative mb-2 text-amber-700">
            {{ slide.payload.learningsLabel ?? 'Learnings' }}
          </p>
          <ul class="relative space-y-2">
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
