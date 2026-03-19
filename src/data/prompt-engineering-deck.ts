import rawDeck from './prompt-engineering-deck.json'
import type { PresentationDeck } from '@/types/slide'

const slideVariantMap: Record<string, string> = {
  'cover-overview': 'hero',
  'agenda-map': 'route',
  'positioning-scenarios': 'signal',
  'pain-points': 'stack',
  'security-threats': 'alert',
  'why-this-topic': 'spotlight',
  'input-quality': 'spotlight',
  'prompt-engineering-meaning': 'spotlight',
  'application-overview': 'spotlight',
  'ai-strengths': 'matrix',
  'prompt-value': 'matrix',
  'ape': 'manifesto',
  'active-prompt': 'workflow',
  'self-consistency': 'interactive-chat',
  'defense-depth': 'layers',
  'absolute-mode': 'manifesto',
  'cot-transaction': 'interactive-chat',
  'rag': 'manifesto',
  'tree-of-thoughts': 'interactive-chat',
  'reflexion': 'dossier',
  'personal-assistant': 'workflow',
  'team-review': 'workflow',
  'team-review-routes': 'dossier',
  'prompt-chaining': 'route',
  'art': 'control',
  'react': 'storyboard',
  'react-execution-map': 'diagram-only',
  'chapter-outline': 'diagram-only',
  'summary-close': 'closing',
  'zero-shot': 'interactive-chat',
  'few-shot': 'interactive-chat',
  'cot': 'interactive-chat',
  'meta-prompting': 'interactive-chat',
  'generated-knowledge': 'interactive-chat'
}

const baseDeck = rawDeck as PresentationDeck

export const promptEngineeringDeck: PresentationDeck = {
  ...baseDeck,
  slides: baseDeck.slides.map(slide => ({
    ...slide,
    variant: slideVariantMap[slide.id] ?? slide.variant
  }))
}
