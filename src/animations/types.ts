import type { SlideType } from '@/types/slide';

export type MotionEffect = 'rise' | 'glide-left' | 'glide-right' | 'focus' | 'soft-scale';

export type MotionSlot =
  | 'intro'
  | 'lead'
  | 'media'
  | 'metric'
  | 'chip'
  | 'panel'
  | 'card'
  | 'column'
  | 'quote'
  | 'tag'
  | 'rail'
  | 'code'
  | 'diagram'
  | 'checkpoint'
  | 'footer'
  | 'aside'
  | 'chat'
  | 'list-item';

export type ShellMotionSlot = 'eyebrow' | 'title' | 'subtitle';

export interface MotionRecipe {
  effect: MotionEffect;
  order: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  distanceX?: number;
  distanceY?: number;
  scaleFrom?: number;
  blur?: number;
  easing?: string;
}

export interface SlideAnimationPreset {
  id: string;
  shell?: Partial<Record<ShellMotionSlot, MotionRecipe>>;
  slots?: Partial<Record<MotionSlot, MotionRecipe>>;
}

export interface SlideAnimationVariantOverride {
  id?: string;
  shell?: Partial<Record<ShellMotionSlot, MotionRecipe>>;
  slots?: Partial<Record<MotionSlot, MotionRecipe>>;
}

export interface SlideAnimationDefinition extends SlideAnimationPreset {
  variants?: Record<string, SlideAnimationVariantOverride>;
}

export type SlideAnimationMap = Record<SlideType, SlideAnimationDefinition>;
