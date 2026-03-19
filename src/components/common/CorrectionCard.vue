<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  before: string
  beforeResponse?: string
  after: string
  afterResponse?: string
  beforeLabel?: string
  afterLabel?: string
  title?: string
  compact?: boolean
  isCorrected?: boolean
}>()

const emit = defineEmits<{
  'update:isCorrected': [value: boolean]
}>()

const localIsCorrected = ref(false)

const handleToggle = () => {
  if (props.isCorrected !== undefined) {
    emit('update:isCorrected', !props.isCorrected)
  } else {
    localIsCorrected.value = !localIsCorrected.value
  }
}

const activeCorrected = computed(() => 
  props.isCorrected !== undefined ? props.isCorrected : localIsCorrected.value
)
</script>

<template>
  <div
    class="correction-card group"
    :class="{ 'is-corrected': activeCorrected, 'is-compact': compact }"
    @click="handleToggle"
  >
    <div
      v-if="title"
      class="correction-header"
    >
      <span class="correction-title">{{ title }}</span>
      <div class="correction-badge">
        <span
          v-if="!activeCorrected"
          class="badge-wrong"
        >待优化</span>
        <span
          v-else
          class="badge-right"
        >已进化</span>
      </div>
    </div>

    <div class="correction-content">
      <div class="code-wrapper">
        <!-- Before Content -->
        <div
          class="content-layer before-layer"
          :class="{ 'fade-out': activeCorrected }"
        >
          <div class="layer-label">
            {{ beforeLabel || '错误示范' }}
          </div>
          <div class="prompt-section">
            <span class="section-tag">Prompt</span>
            <pre class="code-text"><code>{{ before }}</code></pre>
          </div>
          <div
            v-if="isCorrected === undefined && beforeResponse"
            class="response-section mt-3"
          >
            <span class="section-tag tag-ai">AI Result</span>
            <div class="response-text">
              {{ beforeResponse }}
            </div>
          </div>
          <div
            v-if="activeCorrected"
            class="strikethrough-line"
          />
        </div>

        <!-- After Content -->
        <div
          class="content-layer after-layer"
          :class="{ 'fade-in': activeCorrected }"
        >
          <div class="layer-label">
            {{ afterLabel || '专业指令' }}
          </div>
          <div class="prompt-section">
            <span class="section-tag">Prompt</span>
            <pre class="code-text"><code>{{ after }}</code></pre>
          </div>
          <div
            v-if="isCorrected === undefined && afterResponse"
            class="response-section mt-3"
          >
            <span class="section-tag tag-ai">AI Result</span>
            <div class="response-text">
              {{ afterResponse }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="correction-footer">
      <span class="hint-text">
        {{ activeCorrected ? '点击还原对比' : '点击查看优化结果' }}
      </span>
      <div class="interaction-icon">
        <svg
          v-if="!activeCorrected"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.correction-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.correction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.85);
}

.is-corrected {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.correction-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.correction-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.badge-wrong {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #fef2f2;
  color: #ef4444;
  font-weight: 500;
}

.badge-right {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #ecfdf5;
  color: #10b981;
  font-weight: 500;
}

.correction-content {
  flex: 1;
  position: relative;
  padding: 16px 20px;
  min-height: 120px;
}

.code-wrapper {
  position: relative;
  height: 100%;
}

.content-layer {
  width: 100%;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.after-layer {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
}

.fade-out {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
}

.fade-in {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.layer-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 12px;
}

.before-layer .layer-label { color: #f43f5e; }
.after-layer .layer-label { color: #10b981; }

.section-tag {
  display: inline-block;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 6px;
  border: 1px solid #e2e8f0;
}

.tag-ai {
  background: #eff6ff;
  color: #3b82f6;
  border-color: #dbeafe;
}

.code-text {
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.response-text {
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
  background: rgba(0, 0, 0, 0.02);
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed rgba(0, 0, 0, 0.05);
  font-style: italic;
}

.is-corrected .code-text {
  color: #0f172a;
}

.strikethrough-line {
  position: absolute;
  top: 30%;
  left: -5%;
  width: 110%;
  height: 2px;
  background: #f43f5e;
  transform: rotate(-1deg);
  transform-origin: center;
  animation: strike 0.4s ease-out forwards;
}

@keyframes strike {
  from { width: 0; opacity: 0; }
  to { width: 110%; opacity: 0.4; }
}

.correction-footer {
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
  background: rgba(248, 250, 252, 0.5);
}

.hint-text {
  font-size: 12px;
  color: #94a3b8;
}

.interaction-icon {
  color: #475569;
  transition: transform 0.3s ease;
}

.correction-card:hover .interaction-icon {
  transform: translateX(3px);
  color: #3b82f6;
}

.is-compact .correction-content {
  min-height: 80px;
  padding: 12px 16px;
}

.is-compact .code-text,
.is-compact .response-text {
  font-size: 11px;
}
</style>
