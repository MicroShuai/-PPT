export type SlideType =
  | 'cover'
  | 'agenda'
  | 'three-column'
  | 'concept'
  | 'case-study'
  | 'flow'
  | 'summary';

export interface DeckMeta {
  title: string;
  topic: string;
  theme: 'corporate-tech';
  ratio: '16:9';
  backgroundImage: string;
}

export interface SlideMedia {
  src: string;
  alt: string;
  caption?: string;
  fit?: 'cover' | 'contain';
}

export interface PresentationDeck {
  meta: DeckMeta;
  slides: AnySlideDefinition[];
}

export interface BaseSlideDefinition<T extends SlideType, P> {
  id: string;
  type: T;
  variant?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  media?: SlideMedia;
  payload: P;
}

export interface MetricItem {
  label: string;
  value: string;
}

export interface CoverSlidePayload {
  speaker: string;
  headline: string;
  highlights: string[];
  metrics: MetricItem[];
  footer: string;
}

export interface AgendaItem {
  title: string;
  description: string;
  tag: string;
}

export interface AgendaAside {
  title: string;
  points: string[];
}

export interface AgendaSlidePayload {
  items: AgendaItem[];
  aside: AgendaAside;
}

export interface ThreeColumnItem {
  title: string;
  caption: string;
  points: string[];
}

export interface ThreeColumnSlidePayload {
  intro: string;
  columns: ThreeColumnItem[];
  takeaway: string;
}

export interface ConceptBlock {
  label: string;
  value: string;
  description: string;
}

export interface ConceptEmphasis {
  title: string;
  body: string;
}

export interface ConceptSlidePayload {
  lead: string;
  blocks: ConceptBlock[];
  emphasis: ConceptEmphasis;
  quote?: string;
}

export interface CaseStudyExamplePair {
  title: string;
  before: string;
  after: string;
}

export interface CaseStudySlidePayload {
  scenarioLabel?: string;
  challengeLabel?: string;
  beforeLabel?: string;
  afterLabel?: string;
  learningsLabel?: string;
  scenario: string;
  challenge: string[];
  beforePrompt: string;
  afterPrompt: string;
  examplePairs?: CaseStudyExamplePair[];
  outcomes: MetricItem[];
  learnings: string[];
}

export interface FlowSlidePayload {
  description: string;
  mermaid: string;
  checkpoints: string[];
  takeaway: string;
  promptPanel?: {
    title: string;
    instruction: string;
    tools: Array<{
      name: string;
      detail: string;
    }>;
    task: string;
  };
}

export interface SummaryPillar {
  title: string;
  detail: string;
}

export interface SummarySlidePayload {
  pillars: SummaryPillar[];
  nextSteps: string[];
  closing: string;
}

export type CoverSlideDefinition = BaseSlideDefinition<'cover', CoverSlidePayload>;
export type AgendaSlideDefinition = BaseSlideDefinition<'agenda', AgendaSlidePayload>;
export type ThreeColumnSlideDefinition = BaseSlideDefinition<'three-column', ThreeColumnSlidePayload>;
export type ConceptSlideDefinition = BaseSlideDefinition<'concept', ConceptSlidePayload>;
export type CaseStudySlideDefinition = BaseSlideDefinition<'case-study', CaseStudySlidePayload>;
export type FlowSlideDefinition = BaseSlideDefinition<'flow', FlowSlidePayload>;
export type SummarySlideDefinition = BaseSlideDefinition<'summary', SummarySlidePayload>;

export type AnySlideDefinition =
  | CoverSlideDefinition
  | AgendaSlideDefinition
  | ThreeColumnSlideDefinition
  | ConceptSlideDefinition
  | CaseStudySlideDefinition
  | FlowSlideDefinition
  | SummarySlideDefinition;
