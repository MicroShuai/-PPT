<script setup lang="ts">
import SlideShell from '@/components/common/SlideShell.vue';
import type { AgendaSlideDefinition } from '@/types/slide';

defineProps<{
  slide: AgendaSlideDefinition;
}>();
</script>

<template>
  <SlideShell :slide="slide">
    <div class="grid h-full w-full grid-cols-[1.3fr_0.8fr] gap-8">
      <div class="grid gap-3">
        <article
          v-for="(item, index) in slide.payload.items"
          :key="item.title"
          class="slide-panel fragment flex items-start gap-4 p-4"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/90 text-xl font-semibold text-blue-700">
            {{ String(index + 1).padStart(2, '0') }}
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <h3 class="text-[22px] font-semibold text-slate-900">
                {{ item.title }}
              </h3>
              <span class="rounded-full border border-slate-200 bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {{ item.tag }}
              </span>
            </div>
            <p class="text-base leading-7 text-slate-700">
              {{ item.description }}
            </p>
          </div>
        </article>
      </div>

      <aside class="slide-panel flex h-full flex-col justify-between p-5">
        <div>
          <p class="slide-label mb-4 text-blue-700/80">
            Focus
          </p>
          <h3 class="text-[26px] font-semibold text-slate-900">
            {{ slide.payload.aside.title }}
          </h3>
        </div>

        <div class="space-y-3">
          <div
            v-for="point in slide.payload.aside.points"
            :key="point"
            class="slide-panel-soft fragment px-4 py-3.5"
          >
            <p class="text-base leading-7 text-slate-700">
              {{ point }}
            </p>
          </div>
        </div>

        <div class="rounded-[20px] border border-amber-200 bg-amber-50/90 px-5 py-4">
          <p class="text-sm font-medium leading-6 text-amber-800">
            目标不是把 AI 讲成万能工具，而是把它落成一套团队可以复用的方法论。
          </p>
        </div>
      </aside>
    </div>
  </SlideShell>
</template>
