# 提示词工程与 AI 提效分享

这是一个基于 `Vue 3 + Vite + Reveal.js` 的演示文稿项目，用来展示《提示词工程与 AI 提效分享》。

当前演示内容采用数据驱动方式组织，主内容位于 `src/data/prompt-engineering-deck.json`，现有 37 页幻灯片，覆盖封面、目录、概念说明、案例分析、流程图和总结页等版式。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Reveal.js
- Tailwind CSS
- Mermaid

## 本地启动

仓库同时存在 `package-lock.json` 和 `pnpm-lock.yaml`，下面示例以 `npm` 为主：

```bash
npm install
npm run dev
```

默认启动后可在本地浏览器访问 Vite 输出地址。

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物输出到 `dist/`。

## 项目结构

- `src/data/prompt-engineering-deck.json`：演示内容主数据源
- `src/data/prompt-engineering-deck.ts`：为 slide 注入 `variant` 等二次映射
- `src/types/slide.ts`：整套 deck 的类型定义
- `src/components/PresentationDeck.vue`：Reveal.js 容器、布局和全屏逻辑
- `src/components/SlideRenderer.vue`：按 slide type 分发到具体组件
- `src/components/slides/*.vue`：各类幻灯片版式实现
- `src/components/common/*.vue`：通用组件
- `src/components/InspectReporter.vue`：巡检模式下的溢出检测
- `public/images`：背景图和插画等静态资源

## 如何修改内容

### 1. 修改已有幻灯片文案

直接编辑：

```text
src/data/prompt-engineering-deck.json
```

每一页 slide 都包含：

- `id`
- `type`
- `title`
- `subtitle`
- `payload`

不同 `type` 对应不同 `payload` 结构，具体约束见 `src/types/slide.ts`。

### 2. 调整版式或样式

按 slide 类型修改对应组件，例如：

- `cover` -> `src/components/slides/CoverSlide.vue`
- `agenda` -> `src/components/slides/AgendaSlide.vue`
- `three-column` -> `src/components/slides/ThreeColumnSlide.vue`
- `concept` -> `src/components/slides/ConceptSlide.vue`
- `case-study` -> `src/components/slides/CaseStudySlide.vue`
- `flow` -> `src/components/slides/FlowSlide.vue`
- `summary` -> `src/components/slides/SummarySlide.vue`

### 3. 新增一种 slide 类型

需要同时修改以下几处：

1. 在 `src/types/slide.ts` 中补充类型定义
2. 新建对应的 slide 组件
3. 在 `src/components/SlideRenderer.vue` 中注册组件映射
4. 在 `src/data/prompt-engineering-deck.json` 中增加数据

### 4. 调整变体样式

`src/data/prompt-engineering-deck.ts` 通过 `slideVariantMap` 为特定 slide 注入 `variant`。如果需要按页面做差异化视觉处理，可以从这里入手。

## 演示与巡检

### 正常演示模式

正常访问首页即可进入 Reveal.js 演示模式，支持键盘翻页。

- 按 `F` 可切换全屏
- 双击演示区域也可切换全屏

### 单页巡检模式

用于检查某一页在固定画布中的渲染情况：

```text
/?inspect=1&slide=0
```

其中 `slide` 为从 `0` 开始的索引。

### 全量巡检模式

用于一次性渲染全部 slide，并通过 `InspectReporter` 输出溢出检测结果：

```text
/?inspect=all
```

该模式适合检查内容是否超出 `1600 x 900` 的设计画布。

## 约定说明

- 演示基准尺寸为 `1600 x 900`
- 静态资源统一放在 `public/` 下
- 代码中使用 `@` 作为 `src/` 路径别名

