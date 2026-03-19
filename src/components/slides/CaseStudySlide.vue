<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import SlideShell from '@/components/common/SlideShell.vue'
import CorrectionCard from '@/components/common/CorrectionCard.vue'
import StreamingChat from '@/components/common/StreamingChat.vue'
import { useSlideMotion } from '@/composables/useSlideMotion'
import type { CaseStudySlideDefinition } from '@/types/slide'

const props = defineProps<{
  slide: CaseStudySlideDefinition
}>()

const isApeCorrected = ref(false) // 是否显示 APE 优化后的内容
const layout = computed(() => props.slide.variant ?? 'compare') // 幻灯片布局变体
const examplePairs = computed(() => props.slide.payload.examplePairs ?? []) // 示例对比组
const { motion } = useSlideMotion(toRef(props, 'slide')) // 动画控制

const isOutputLabel = (label: string | undefined) => {
  if (!label) return false
  const l = label.trim()
  return /AI|输出|结果|结论|回答|推理|决策|模拟|展示|ToT|RAG|Ans|Prop|Refiner/i.test(l)
}

// 解析混合了 Prompt 和 Response 的字符串（旧版数据格式支持）
const parseCombined = (str: string | undefined) => {
  if (!str) return null
  const cleanStr = str
    .replace(/^(Prompt|提示词|提示词 \(Prompt\))\s*[:：]\s*/i, '')
    .trim()

  const splitters = [
    'AI 输出：', 'AI 输出结果：', 'AI 输出结果', 'AI 输出摘录：',
    'AI 输出', '结果：', '普通输出：', '普通输出'
  ]
  for (const s of splitters) {
    if (cleanStr.includes(s)) {
      const parts = cleanStr.split(s)
      return {
        prompt: parts[0].trim().replace(/\*\*.*?\*\*/g, ''),
        response: parts[1]?.trim() || ''
      }
    }
  }
  return { prompt: cleanStr, response: '' }
}

const normalizePromptHeader = () => 'Prompt'

const normalizeResponseHeader = () => 'AI 输出'

// 构建聊天项目列表，处理单轮对话、多轮对话以及旧版数据的兼容
const chatItems = computed(() => {
  const payload = props.slide.payload
  const items: Array<{
    prompt: string
    response: string
    label?: string
    responseLabel?: string
  }> = []

  if (payload.interactiveChat) {
    items.push({
      prompt: payload.interactiveChat.prompt,
      response: payload.interactiveChat.response,
      label: payload.interactiveChat.promptLabel || undefined
    })
    return items
  }

  // Segmented case: We have a prompt in beforePrompt and a response in afterPrompt OR afterResponse
  const hasPrompt = !!payload.beforePrompt
  const hasAfterPromptResponse = payload.afterPrompt && isOutputLabel(payload.afterLabel)
  const hasExplicitResponse = !!(payload.afterResponse || payload.beforeResponse)

  if (hasPrompt && (hasAfterPromptResponse || hasExplicitResponse)) {
    items.push({
      prompt: payload.beforePrompt.trim(),
      response: (payload.afterResponse || payload.beforeResponse || payload.afterPrompt || '').trim(),
      label: normalizePromptHeader(),
      responseLabel: normalizeResponseHeader()
    })
  } else {
    // Legacy / Split Prompt-Response in same field case
    if (payload.beforePrompt) {
      const parsed = parseCombined(payload.beforePrompt)
      if (parsed) {
        items.push({
          prompt: parsed.prompt,
          response: payload.beforeResponse || parsed.response,
          label: payload.beforeLabel || '普通提示',
          responseLabel: 'AI 输出'
        })
      }
    }
    if (payload.afterPrompt) {
      const parsed = parseCombined(payload.afterPrompt)
      if (parsed) {
        items.push({
          prompt: parsed.prompt,
          response: payload.afterResponse || parsed.response,
          label: payload.afterLabel || '优化提示',
          responseLabel: 'AI 输出'
        })
      }
    }
  }

  return items
})

// 在 Manifesto 布局中，判断是否需要显示“优化前/后”的切换开关
const manifestoUsesToggle = computed(() => {
  const payload = props.slide.payload
  return Boolean(payload.beforePrompt?.trim() && payload.afterPrompt?.trim())
})

// 获取当前 Manifesto 布局应显示的聊天内容
const manifestoChatItem = computed(() => {
  if (manifestoUsesToggle.value) {
    return {
      prompt: isApeCorrected.value
        ? (props.slide.payload.afterPrompt || '')
        : (props.slide.payload.beforePrompt || ''),
      response: isApeCorrected.value
        ? (props.slide.payload.afterResponse || '')
        : (props.slide.payload.beforeResponse || '')
    }
  }

  const [firstItem] = chatItems.value
  return {
    prompt: firstItem?.prompt || props.slide.payload.beforePrompt || '',
    response: firstItem?.response || props.slide.payload.afterResponse || props.slide.payload.beforeResponse || ''
  }
})

// 根据标签文本自动映射相应的图标
const labelToIcon = (label: string | undefined): string => {
  if (!label) return 'alert'
  if (label.includes('核心逻辑') || label.includes('核心心法') || label.includes('核心策略')) return 'tech'
  if (label.includes('操作准则') || label.includes('核心准则') || label.includes('核心原则') || label.includes('实践建议') || label.includes('可落地做法')) return 'zap'
  if (label.includes('应用范式') || label.includes('应用方式') || label.includes('典型场景')) return 'path'
  if (label.includes('核心价值') || label.includes('核心优势') || label.includes('设计哲学') || label.includes('定义规范')) return 'shield'
  if (label.includes('实战点评') || label.includes('专家点评') || label.includes('Tips')) return 'wand'
  if (label.includes('决策维度') || label.includes('分支')) return 'branch'
  if (label.includes('反馈') || label.includes('循环')) return 'nodes'
  if (label.includes('案例') || label.includes('场景')) return 'concept'
  if (label.includes('维度') || label.includes('结构')) return 'database'
  if (label.includes('痛点') || label.includes('难题') || label.includes('挑战')) return 'alert'
  return 'alert'
}

const activeIcon = computed(() => props.slide.payload.icon || labelToIcon(props.slide.payload.challengeLabel))
</script>

<template>
  <SlideShell :slide="slide">
    <!-- ════════════════════════════════════════════════════════ -->
    <!-- MANIFESTO Layout                                        -->
    <!--   Left col:  Pain Points box + Tips box                 -->
    <!--   Right col: CorrectionCard + AI Output (stacked)       -->
    <!-- ════════════════════════════════════════════════════════ -->
    <div
      v-if="layout === 'manifesto'"
      class="grid h-full min-h-0 grid-cols-[0.7fr_1.3fr] gap-6"
    >
      <!-- LEFT COLUMN: Description + Pain Points + Tips -->
      <div class="flex flex-col min-h-0 gap-5">
        <!-- Description Card -->
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white p-6 shadow-sm"
          v-bind="motion('panel')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2">
            {{ slide.payload.scenarioLabel ?? 'Technique' }}
          </p>
          <h3 class="text-[20px] font-black text-slate-900 leading-tight mb-2">
            {{ slide.payload.scenario }}
          </h3>
          <p
            v-if="slide.subtitle"
            class="text-[13px] leading-relaxed text-slate-500"
          >
            {{ slide.subtitle }}
          </p>
        </div>

        <!-- Pain Points Card (compact, shrink-to-fit) -->
        <div
          class="shrink-0 rounded-[22px] border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-4 flex items-center gap-2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-rose-500"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            {{ slide.payload.challengeLabel ?? '协作痛点' }}
          </p>
          <ul class="space-y-2.5">
            <li
              v-for="(item, idx) in (slide.payload.challenge || [])"
              :key="item"
              class="rounded-xl bg-slate-50/80 px-4 py-2.5 text-[13px] leading-relaxed text-slate-600"
              v-bind="motion('list-item', idx)"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Tips Card -->
        <div
          class="slide-quote-card shrink-0 px-6 py-5 bg-amber-50/60 border-amber-200/50"
          v-bind="motion('quote')"
        >
          <p class="slide-label mb-4 text-amber-700 font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            {{ slide.payload.learningsLabel ?? 'Tips' }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="item in (slide.payload.learnings || [])"
              :key="item"
              class="text-[13px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2.5"
            >
              <span class="mt-2 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <!-- RIGHT COLUMN: Toggle compare only when there are truly two prompt states -->
      <div
        v-if="manifestoUsesToggle"
        class="flex flex-col min-h-0 overflow-hidden rounded-[24px] border border-slate-200/60 bg-white/80 shadow-lg"
        v-bind="motion('chat')"
      >
        <div class="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <span class="text-[13px] font-bold text-slate-700">
            {{ slide.payload.panelTitle ?? `${slide.title} Prompt Evolution` }}
          </span>

          <div
            class="ape-toggle flex items-center rounded-full border p-0.5 cursor-pointer select-none transition-all duration-300"
            :class="isApeCorrected
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-slate-100 border-slate-200'"
            @click="isApeCorrected = !isApeCorrected"
          >
            <span
              class="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300"
              :class="!isApeCorrected
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400'"
            >
              {{ slide.payload.beforeLabel || '原始提示' }}
            </span>
            <span
              class="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300"
              :class="isApeCorrected
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-400'"
            >
              {{ slide.payload.afterLabel || 'APE 优化' }}
            </span>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-auto px-6 py-5 custom-scrollbar-chat">
          <StreamingChat
            :key="isApeCorrected ? 'manifesto-opt' : 'manifesto-raw'"
            :prompt="manifestoChatItem.prompt"
            :response="manifestoChatItem.response"
            compact
            auto-start
          />
        </div>
      </div>

      <div
        v-else
        class="min-h-0"
        v-bind="motion('chat')"
      >
        <StreamingChat
          key="manifesto-single"
          :prompt="manifestoChatItem.prompt"
          :response="manifestoChatItem.response"
          compact
          auto-start
        />
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- INTERACTIVE CHAT / COMPARE layout                       -->
    <!-- ════════════════════════════════════════════════════════ -->
    <div
      v-else-if="layout === 'interactive-chat' || layout === 'compare'"
      class="grid h-full min-h-0 grid-cols-[0.88fr_1.12fr] gap-6"
    >
      <div class="grid min-h-0 grid-rows-[auto_1fr_auto] gap-5">
        <!-- Description Card -->
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white px-7 py-5 shadow-sm"
          v-bind="motion('panel')"
        >
          <div class="flex justify-between items-start mb-2">
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
              {{ slide.payload.scenarioLabel ?? 'Technique' }}
            </p>
          </div>
          <h3 class="text-[22px] font-black leading-tight text-slate-900 mb-2">
            {{ slide.payload.scenario }}
          </h3>
          <p
            v-if="slide.subtitle"
            class="text-[13px] leading-relaxed text-slate-500 mt-2"
          >
            {{ slide.subtitle }}
          </p>
        </div>

        <!-- Challenge Card -->
        <div
          class="flex min-h-0 flex-col rounded-[22px] border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm overflow-hidden"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-4 flex items-center gap-2 text-slate-500">
            <svg
              v-if="!activeIcon || activeIcon === 'mechanisms' || activeIcon === 'alert'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-rose-500"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" /><path d="M12 17h.01" />
            </svg>
            <svg
              v-else-if="activeIcon === 'concept' || activeIcon === 'idea'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" /><path d="M10 22h4" />
            </svg>
            <svg
              v-else-if="activeIcon === 'cpu' || activeIcon === 'tech'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-blue-500"
            >
              <rect
                width="16"
                height="16"
                x="4"
                y="4"
                rx="2"
              />
              <rect
                width="6"
                height="6"
                x="9"
                y="9"
                rx="1"
              />
              <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 11h2" /><path d="M20 15h2" /><path d="M20 11h2" /><path d="M9 2v2" /><path d="M9 20v2" />
            </svg>
            <svg
              v-else-if="activeIcon === 'zap' || activeIcon === 'energy'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-yellow-500"
            >
              <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z" />
            </svg>
            <svg
              v-else-if="activeIcon === 'shield' || activeIcon === 'security'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-emerald-500"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <svg
              v-else-if="activeIcon === 'wand' || activeIcon === 'magic'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-purple-500"
            >
              <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8 19 13" /><path d="M15 9h0" /><path d="M17.8 6.2 19 5" /><path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" />
            </svg>
            <svg
              v-else-if="activeIcon === 'database' || activeIcon === 'storage'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-cyan-500"
            >
              <ellipse
                cx="12"
                cy="5"
                rx="9"
                ry="3"
              />
              <path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
            <svg
              v-else-if="activeIcon === 'branch' || activeIcon === 'path'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-indigo-500"
            >
              <line
                x1="6"
                x2="6"
                y1="3"
                y2="15"
              />
              <circle
                cx="18"
                cy="6"
                r="3"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
              />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            <svg
              v-else-if="activeIcon === 'search' || activeIcon === 'magnifier'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-blue-500"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <svg
              v-else-if="activeIcon === 'compass' || activeIcon === 'guide'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-orange-500"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
            </svg>
            <svg
              v-else-if="activeIcon === 'network' || activeIcon === 'nodes'"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-teal-500"
            >
              <circle
                cx="12"
                cy="12"
                r="3"
              />
              <line
                x1="12"
                x2="12"
                y1="2"
                y2="9"
              />
              <line
                x1="12"
                x2="12"
                y1="15"
                y2="22"
              />
              <line
                x1="2"
                x2="9"
                y1="12"
                y2="12"
              />
              <line
                x1="15"
                x2="22"
                y1="12"
                y2="12"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-400"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <line
                x1="12"
                x2="12"
                y1="16"
                y2="12"
              />
              <line
                x1="12"
                x2="12.01"
                y1="8"
                y2="8"
              />
            </svg>
            {{ slide.payload.challengeLabel ?? 'Key Mechanisms' }}
          </p>
          <ul class="space-y-3 overflow-auto pr-1 custom-scrollbar flex-1">
            <li
              v-for="(item, idx) in slide.payload.challenge"
              :key="item"
              class="rounded-xl bg-slate-50/80 px-4 py-3 text-[13.5px] leading-relaxed text-slate-600"
              v-bind="motion('list-item', idx)"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Tips Card -->
        <div
          class="slide-quote-card shrink-0 px-6 py-5 bg-amber-50/60 border-amber-200/50"
          v-bind="motion('quote')"
        >
          <p class="slide-label mb-3 text-amber-700 font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            {{ slide.payload.learningsLabel ?? 'Best Practices' }}
          </p>
          <ul class="space-y-2.5">
            <li
              v-for="item in slide.payload.learnings"
              :key="item"
              class="text-[13px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2.5"
            >
              <span class="mt-2 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <div
        class="flex flex-col min-h-0 gap-4 overflow-auto pr-1 custom-scrollbar-chat"
        v-bind="motion('chat')"
      >
        <template
          v-for="item in chatItems"
          :key="item.prompt"
        >
          <div class="chat-item shrink-0">
            <StreamingChat
              :prompt="item.prompt"
              :response="item.response"
              :prompt-label="item.label"
              :response-label="item.responseLabel"
              auto-start
            />
          </div>
        </template>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- DOSSIER layout                                          -->
    <!-- ════════════════════════════════════════════════════════ -->
    <div
      v-else-if="layout === 'dossier'"
      class="grid h-full min-h-0 grid-cols-[0.96fr_1.04fr] gap-4"
    >
      <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3.5">
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white px-5 py-4 shadow-sm"
          v-bind="motion('panel')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-1">
            {{ slide.payload.scenarioLabel ?? 'Case File' }}
          </p>
          <h3 class="text-[20px] font-black leading-tight text-slate-900 mb-2">
            {{ slide.payload.scenario }}
          </h3>
          <p
            v-if="slide.subtitle"
            class="text-[13px] leading-relaxed text-slate-500"
          >
            {{ slide.subtitle }}
          </p>
        </div>
        <div
          class="min-h-0 flex flex-col rounded-[22px] border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm overflow-hidden"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-4 flex items-center gap-2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-rose-500"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            {{ slide.payload.challengeLabel ?? 'Key Mechanisms' }}
          </p>
          <ul class="space-y-2 overflow-auto pr-1 custom-scrollbar flex-1">
            <li
              v-for="item in slide.payload.challenge"
              :key="item"
              class="rounded-xl bg-slate-50/80 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-600"
            >
              {{ item }}
            </li>
          </ul>
        </div>
        <div
          class="slide-quote-card shrink-0 px-5 py-4 bg-amber-50/60 border-amber-200/50"
          v-bind="motion('quote')"
        >
          <p class="slide-label mb-2.5 text-amber-700 font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500"
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            {{ slide.payload.learningsLabel ?? 'Insights' }}
          </p>
          <ul class="space-y-2">
            <li
              v-for="item in slide.payload.learnings"
              :key="item"
              class="text-[12px] leading-relaxed text-amber-900/80 font-medium flex items-start gap-2"
            >
              <span class="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
      <div
        class="min-h-0 flex flex-col gap-4 overflow-auto pr-1 custom-scrollbar-chat"
        v-bind="motion('chat')"
      >
        <template
          v-for="(item, idx) in chatItems"
          :key="item.prompt"
        >
          <div class="chat-item shrink-0">
            <StreamingChat
              :prompt="item.prompt"
              :response="item.response"
              :prompt-label="item.label"
              :response-label="item.responseLabel"
              :variant="idx === 0 && chatItems.length > 1 ? 'error' : 'default'"
              auto-start
            />
          </div>
        </template>
        <div
          v-if="examplePairs.length"
          class="grid gap-3"
          v-bind="motion('card')"
        >
          <CorrectionCard
            v-for="pair in examplePairs"
            :key="pair.title"
            :before="pair.before"
            :before-response="pair.beforeResponse"
            :after="pair.after"
            :after-response="pair.afterResponse"
            :title="pair.title || ''"
            compact
          />
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- WORKFLOW layout                                          -->
    <!-- ════════════════════════════════════════════════════════ -->
    <div
      v-else-if="layout === 'workflow'"
      class="grid h-full min-h-0 grid-cols-[0.9fr_1.1fr] gap-5"
    >
      <div class="grid min-h-0 grid-rows-[auto_auto_1fr] gap-5">
        <div
          class="shrink-0 rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white px-6 py-5 shadow-sm"
          v-bind="motion('panel')"
        >
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2">
            {{ slide.payload.scenarioLabel ?? 'Workflow' }}
          </p>
          <h3 class="text-[22px] font-black leading-tight text-slate-900 mb-2">
            {{ slide.payload.scenario }}
          </h3>
          <p
            v-if="slide.subtitle"
            class="text-[13px] leading-relaxed text-slate-500"
          >
            {{ slide.subtitle }}
          </p>
        </div>
        <div
          class="flex min-h-0 flex-col rounded-[22px] border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm overflow-hidden"
          v-bind="motion('rail')"
        >
          <p class="slide-label mb-4 flex items-center gap-2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-rose-500"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            {{ slide.payload.challengeLabel ?? 'Constraints' }}
          </p>
          <ul class="space-y-3 overflow-auto custom-scrollbar flex-1">
            <li
              v-for="(item, idx) in slide.payload.challenge"
              :key="item"
              class="rounded-xl bg-slate-50/80 px-4 py-3 text-[13.5px] leading-relaxed text-slate-600"
              v-bind="motion('list-item', idx)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
      <div
        class="min-h-0 flex-1 flex flex-col gap-4 overflow-auto pr-1 custom-scrollbar-chat"
        v-bind="motion('chat')"
      >
        <template
          v-for="item in chatItems"
          :key="item.prompt"
        >
          <div class="chat-item shrink-0">
            <StreamingChat
              :prompt="item.prompt"
              :response="item.response"
              :prompt-label="item.label"
              :response-label="item.responseLabel"
              auto-start
            />
          </div>
        </template>
      </div>
    </div>
  </SlideShell>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar,
.custom-scrollbar-chat::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track,
.custom-scrollbar-chat::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb,
.custom-scrollbar-chat::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover,
.custom-scrollbar-chat::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}
</style>
