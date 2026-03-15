import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { resolveSlideAnimation } from '@/animations/slideAnimationMap';
import type { MotionEffect, MotionRecipe, MotionSlot, ShellMotionSlot } from '@/animations/types';
import type { AnySlideDefinition } from '@/types/slide';

export interface MotionBinding {
  class: string[];
  style: Record<string, string>;
  'data-motion-effect': MotionEffect;
  'data-motion-slot': string;
}

const effectDefaults: Record<
  MotionEffect,
  Required<Pick<MotionRecipe, 'distanceX' | 'distanceY' | 'scaleFrom' | 'blur'>>
> = {
  rise: {
    distanceX: 0,
    distanceY: 26,
    scaleFrom: 0.985,
    blur: 12
  },
  'glide-left': {
    distanceX: -32,
    distanceY: 8,
    scaleFrom: 0.99,
    blur: 10
  },
  'glide-right': {
    distanceX: 32,
    distanceY: 8,
    scaleFrom: 0.99,
    blur: 10
  },
  focus: {
    distanceX: 0,
    distanceY: 18,
    scaleFrom: 0.968,
    blur: 16
  },
  'soft-scale': {
    distanceX: 0,
    distanceY: 14,
    scaleFrom: 0.96,
    blur: 8
  }
};

function createMotionBinding(slot: string, recipe: MotionRecipe, index = 0): MotionBinding {
  const defaults = effectDefaults[recipe.effect];
  const order = recipe.order + index * (recipe.stagger ?? 0);

  return {
    class: ['slide-motion-item'],
    style: {
      '--motion-order': `${order}ms`,
      '--motion-delay': `${recipe.delay ?? 0}ms`,
      '--motion-duration': `${recipe.duration ?? 620}ms`,
      '--motion-from-x': `${recipe.distanceX ?? defaults.distanceX}px`,
      '--motion-from-y': `${recipe.distanceY ?? defaults.distanceY}px`,
      '--motion-from-scale': String(recipe.scaleFrom ?? defaults.scaleFrom),
      '--motion-blur': `${recipe.blur ?? defaults.blur}px`,
      '--motion-ease': recipe.easing ?? 'cubic-bezier(0.22, 1, 0.36, 1)'
    },
    'data-motion-effect': recipe.effect,
    'data-motion-slot': slot
  };
}

export function useSlideMotion(slideSource: MaybeRefOrGetter<AnySlideDefinition>) {
  const preset = computed(() => resolveSlideAnimation(toValue(slideSource)));

  const scopeAttrs = computed(() => ({
    class: ['slide-motion-scope', `motion-preset-${preset.value.id}`],
    'data-motion-preset': preset.value.id
  }));

  function motion(slot: MotionSlot, index = 0, override: Partial<MotionRecipe> = {}): MotionBinding {
    const base = preset.value.slots?.[slot];

    if (!base) {
      throw new Error(`Missing motion recipe for slot "${slot}"`);
    }

    return createMotionBinding(slot, { ...base, ...override }, index);
  }

  function shellMotion(slot: ShellMotionSlot, override: Partial<MotionRecipe> = {}): MotionBinding {
    const base = preset.value.shell?.[slot];

    if (!base) {
      throw new Error(`Missing shell motion recipe for slot "${slot}"`);
    }

    return createMotionBinding(`shell-${slot}`, { ...base, ...override }, 0);
  }

  return {
    motion,
    preset,
    scopeAttrs,
    shellMotion
  };
}
