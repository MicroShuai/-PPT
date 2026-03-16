import rawDeck from './prompt-engineering-deck.json';
import type { PresentationDeck } from '@/types/slide';

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
  'active-prompt': 'workflow',
  'self-consistency': 'dossier',
  'defense-depth': 'layers',
  'absolute-mode': 'manifesto',
  'cot-transaction': 'compare',
  'rag': 'dossier',
  'tree-of-thoughts': 'dossier',
  'reflexion': 'dossier',
  'personal-assistant': 'workflow',
  'team-review': 'workflow',
  'team-review-routes': 'dossier',
  'prompt-chaining': 'route',
  'art': 'control',
  'react': 'runtime',
  'react-execution-map': 'canvas',
  'summary-close': 'closing'
};

const baseDeck = rawDeck as PresentationDeck;

export const promptEngineeringDeck: PresentationDeck = {
  ...baseDeck,
  slides: baseDeck.slides.map((slide) => ({
    ...slide,
    variant: slideVariantMap[slide.id]
  }))
};
