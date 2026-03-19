export type SlideType
    = 'cover'
    | 'agenda'
    | 'three-column'
    | 'concept'
    | 'case-study'
    | 'flow'
    | 'summary'

export interface DeckMeta {
  title: string
  topic: string
  theme: 'corporate-tech'
  ratio: '16:9'
  backgroundImage: string
}

export interface SlideMedia {
  src: string
  alt: string
  caption?: string
  fit?: 'cover' | 'contain'
}

export interface PresentationDeck {
  meta: DeckMeta
  slides: AnySlideDefinition[]
}

export interface BaseSlideDefinition<T extends SlideType, P> {
  id: string
  type: T
  variant?: string
  hideHeader?: boolean
  fullBleed?: boolean
  eyebrow?: string
  title: string
  subtitle?: string
  media?: SlideMedia
  payload: P
}

export interface MetricItem {
  label: string
  value: string
}

export interface CoverSlidePayload {
  speaker: string
  headline: string
  highlights: string[]
  metrics: MetricItem[]
  footer: string
}

export interface AgendaItem {
  title: string
  description: string
  tag: string
}

export interface AgendaAside {
  title: string
  points: string[]
}

export interface AgendaSlidePayload {
  items: AgendaItem[]
  aside: AgendaAside
}

export interface ThreeColumnItem {
  title: string
  caption: string
  points: string[]
}

export interface ThreeColumnSlidePayload {
  intro: string
  columns: ThreeColumnItem[]
  takeaway: string
}

export interface ConceptBlock {
  label: string
  value: string
  description: string
}

export interface ConceptEmphasis {
  title: string
  body: string
}

export interface ConceptSlidePayload {
  lead: string
  blocks: ConceptBlock[]
  emphasis: ConceptEmphasis
  quote?: string
}

export interface CaseStudyExamplePair {
  title: string
  before: string
  beforeResponse?: string
  after: string
  afterResponse?: string
}

// 案例学习幻灯片的数据载体
export interface CaseStudySlidePayload {
  icon?: string
  scenarioLabel?: string
  challengeLabel?: string
  panelTitle?: string
  beforeLabel?: string
  afterLabel?: string
  learningsLabel?: string
  scenario: string
  challenge: string[]
  beforePrompt: string
  beforeResponse?: string
  afterPrompt: string
  afterResponse?: string
  examplePairs?: CaseStudyExamplePair[]
  outcomes: MetricItem[]
  learnings: string[]
  interactiveChat?: {
    prompt: string
    response: string
    promptLabel?: string
    responseLabel?: string
  }
}

// 流程图幻灯片的数据载体
export interface FlowSlidePayload {
  scenarioLabel?: string
  scenario?: string
  challengeLabel?: string
  challenge?: string[]
  takeawayLabel?: string
  tips?: string[]
  runtimeSequence?: Array<{
    type: 'user' | 'model' | 'tool' | 'final'
    label: string
    title: string
    body?: string
    codeBlock?: {
      language?: string
      label?: string
      code: string
    }
    result?: {
      title: string
      language?: string
      content: string
    }
  }>
  runtimeChat?: Array<{
    prompt: string
    response: string
    thinkingText?: string
    promptLabel?: string
    responseLabel?: string
    variant?: 'default' | 'error' | 'success' | 'warning'
  }>
  description: string
  mermaid?: string
  checkpoints?: string[]
  takeaway: string
  promptPanel?: {
    title: string
    instruction: string
    background?: string
    instructionTitle?: string
    toolsTitle?: string
    tools: Array<{
      name: string
      detail: string
    }>
    task: string
    taskLabel?: string
    trackTitle?: string
    track?: Array<{
      label: string
      thought?: string
      action?: string
      observation?: string
      conclusion?: string
    }>
    snippetsTitle?: string
    snippets?: Array<{
      label: string
      language?: string
      code: string
    }>
  }
  storyboard?: {
    conceptTitle: string
    conceptBody: string
    logicTitle: string
    logicBody: string
    task: string
    steps: Array<{
      label: string
      thought: string
      action?: string
      observation?: string
    }>
    finalOutput: string
  }
}

export interface SummaryPillar {
  title: string
  detail: string
}

export interface SummarySlidePayload {
  pillars: SummaryPillar[]
  nextSteps: string[]
  closing: string
}

export type CoverSlideDefinition = BaseSlideDefinition<'cover', CoverSlidePayload>
export type AgendaSlideDefinition = BaseSlideDefinition<'agenda', AgendaSlidePayload>
export type ThreeColumnSlideDefinition = BaseSlideDefinition<'three-column', ThreeColumnSlidePayload>
export type ConceptSlideDefinition = BaseSlideDefinition<'concept', ConceptSlidePayload>
export type CaseStudySlideDefinition = BaseSlideDefinition<'case-study', CaseStudySlidePayload>
export type FlowSlideDefinition = BaseSlideDefinition<'flow', FlowSlidePayload>
export type SummarySlideDefinition = BaseSlideDefinition<'summary', SummarySlidePayload>

export type AnySlideDefinition
    = CoverSlideDefinition
    | AgendaSlideDefinition
    | ThreeColumnSlideDefinition
    | ConceptSlideDefinition
    | CaseStudySlideDefinition
    | FlowSlideDefinition
    | SummarySlideDefinition
