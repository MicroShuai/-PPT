<script setup lang="ts">
import { nextTick, onMounted } from 'vue';

function measure(): void {
  const report = document.getElementById('inspect-report');

  if (!report) {
    return;
  }

  const stages = Array.from(document.querySelectorAll<HTMLElement>('.inspect-stage'));

  const results = stages.map((stage) => {
    const shell = stage.querySelector<HTMLElement>('.slide-shell');
    const inner = stage.querySelector<HTMLElement>('.slide-inner');

    if (!shell || !inner) {
      return {
        slideIndex: Number(stage.dataset.slideIndex ?? -1),
        slideId: stage.dataset.slideId ?? '',
        slideType: stage.dataset.slideType ?? '',
        overflow: true,
        shellOverflow: -1,
        innerOverflow: -1,
        visualOverflow: -1
      };
    }

    const shellRect = shell.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const shellOverflow = shell.scrollHeight - shell.clientHeight;
    const innerOverflow = inner.scrollHeight - inner.clientHeight;
    const visualOverflow = Math.max(0, Math.ceil(innerRect.bottom - shellRect.bottom));
    const overflow = shellOverflow > 1 || innerOverflow > 1 || visualOverflow > 0;

    return {
      slideIndex: Number(stage.dataset.slideIndex ?? -1),
      slideId: stage.dataset.slideId ?? '',
      slideType: stage.dataset.slideType ?? '',
      overflow,
      shellOverflow,
      innerOverflow,
      visualOverflow
    };
  });

  const overflowResults = results.filter((item) => item.overflow);

  report.setAttribute('data-overflow-count', String(overflowResults.length));
  report.setAttribute('data-slide-count', String(results.length));
  report.textContent = JSON.stringify(results);
}

async function scheduleMeasure(): Promise<void> {
  await nextTick();

  window.setTimeout(() => {
    measure();
  }, 1400);
}

onMounted(() => {
  void scheduleMeasure();
});
</script>

<template>
  <div class="hidden" />
</template>
