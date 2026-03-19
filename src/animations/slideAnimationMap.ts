import type { AnySlideDefinition } from '@/types/slide'
import type {
  MotionRecipe,
  MotionSlot,
  ShellMotionSlot,
  SlideAnimationMap,
  SlideAnimationPreset
} from '@/animations/types'

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_SOFT = 'cubic-bezier(0.16, 1, 0.3, 1)'

function step(effect: MotionRecipe['effect'], order: number, overrides: Partial<MotionRecipe> = {}): MotionRecipe {
  return {
    effect,
    order,
    stagger: 70,
    duration: 620,
    delay: 0,
    distanceX: 0,
    distanceY: 24,
    scaleFrom: 0.985,
    blur: 12,
    easing: EASE_OUT,
    ...overrides
  }
}

const defaultShell: Record<ShellMotionSlot, MotionRecipe> = {
  eyebrow: step('rise', 0, { duration: 420, distanceY: 16, blur: 8 }),
  title: step('focus', 90, { duration: 680, distanceY: 22, scaleFrom: 0.972, blur: 16 }),
  subtitle: step('rise', 190, { duration: 560, distanceY: 20, blur: 10 })
}

const defaultSlots: Record<MotionSlot, MotionRecipe> = {
  intro: step('rise', 260),
  lead: step('focus', 260, { duration: 700, distanceY: 22, blur: 14 }),
  media: step('glide-right', 380, { duration: 760, distanceX: 34, distanceY: 8, blur: 10, scaleFrom: 0.99 }),
  metric: step('rise', 420, { stagger: 55, duration: 540, distanceY: 18, blur: 8 }),
  chip: step('rise', 430, { stagger: 45, duration: 440, distanceY: 14, blur: 6 }),
  panel: step('rise', 300, { duration: 620, distanceY: 22, blur: 10 }),
  card: step('soft-scale', 380, { stagger: 70, duration: 560, distanceY: 18, scaleFrom: 0.965, blur: 8 }),
  column: step('rise', 380, { stagger: 85, duration: 560, distanceY: 26, blur: 10 }),
  quote: step('focus', 640, { duration: 640, distanceY: 18, scaleFrom: 0.97, blur: 10 }),
  tag: step('rise', 520, { stagger: 40, duration: 400, distanceY: 10, blur: 6 }),
  rail: step('glide-left', 360, { stagger: 80, duration: 560, distanceX: -30, distanceY: 8, blur: 10 }),
  code: step('soft-scale', 460, { stagger: 70, duration: 620, distanceY: 16, scaleFrom: 0.974, blur: 7 }),
  diagram: step('focus', 380, {
    duration: 820,
    distanceY: 18,
    scaleFrom: 0.965,
    blur: 8,
    easing: EASE_SOFT
  }),
  checkpoint: step('rise', 520, { stagger: 60, duration: 520, distanceY: 16, blur: 8 }),
  footer: step('rise', 700, { duration: 520, distanceY: 14, blur: 8 }),
  aside: step('glide-right', 340, { duration: 620, distanceX: 28, distanceY: 10, blur: 10 }),
  chat: step('focus', 460, { duration: 800, distanceY: 20, scaleFrom: 0.96, blur: 15 }),
  'list-item': step('rise', 400, { stagger: 60, duration: 500, distanceY: 12, blur: 6 })
}

export const slideAnimationMap: SlideAnimationMap = {
  cover: {
    id: 'cover-hero',
    shell: {
      eyebrow: step('rise', 0, { duration: 380, distanceY: 14, blur: 6 }),
      title: step('focus', 80, { duration: 760, distanceY: 24, blur: 18, scaleFrom: 0.968 }),
      subtitle: step('rise', 210, { duration: 620, distanceY: 18, blur: 9 })
    },
    slots: {
      lead: step('focus', 300, { duration: 780, distanceY: 24, blur: 16, scaleFrom: 0.97 }),
      media: step('glide-right', 360, { duration: 820, distanceX: 40, distanceY: 10, blur: 10 }),
      metric: step('rise', 490, { stagger: 55, duration: 520, distanceY: 16, blur: 7 }),
      chip: step('rise', 400, { stagger: 50, duration: 420, distanceY: 12, blur: 5 }),
      quote: step('focus', 650, { duration: 620, distanceY: 14, blur: 8, scaleFrom: 0.976 }),
      tag: step('rise', 250, { duration: 420, distanceY: 12, blur: 6 }),
      footer: step('rise', 720, { duration: 460, distanceY: 12, blur: 6 })
    }
  },
  agenda: {
    id: 'agenda-route',
    slots: {
      rail: step('glide-left', 300, { stagger: 90, duration: 560, distanceX: -36, distanceY: 8, blur: 10 }),
      aside: step('focus', 280, { duration: 660, distanceY: 18, scaleFrom: 0.972 }),
      checkpoint: step('rise', 430, { stagger: 60, duration: 520, distanceY: 16, blur: 8 }),
      tag: step('rise', 600, { stagger: 35, duration: 380, distanceY: 8, blur: 5 })
    }
  },
  'three-column': {
    id: 'three-column-signal',
    slots: {
      intro: step('rise', 250, { duration: 580, distanceY: 18 }),
      media: step('glide-right', 310, { duration: 720, distanceX: 30, distanceY: 10 }),
      column: step('rise', 390, { stagger: 85, duration: 560, distanceY: 24 }),
      quote: step('focus', 620, { duration: 620, distanceY: 16, scaleFrom: 0.974, blur: 9 }),
      tag: step('rise', 520, { stagger: 35, duration: 400, distanceY: 8, blur: 5 })
    },
    variants: {
      stack: {
        id: 'three-column-stack',
        slots: {
          column: step('glide-left', 380, { stagger: 80, duration: 540, distanceX: -26, distanceY: 10 }),
          quote: step('rise', 620, { duration: 520, distanceY: 14, blur: 7 })
        }
      },
      alert: {
        id: 'three-column-alert',
        slots: {
          column: step('focus', 380, { stagger: 70, duration: 600, distanceY: 20, scaleFrom: 0.972, blur: 9 }),
          quote: step('focus', 650, { duration: 560, distanceY: 14, blur: 8 })
        }
      }
    }
  },
  concept: {
    id: 'concept-spotlight',
    slots: {
      lead: step('focus', 260, { duration: 720, distanceY: 20, blur: 14 }),
      media: step('glide-right', 320, { duration: 720, distanceX: 28, distanceY: 8 }),
      panel: step('rise', 330, { duration: 600, distanceY: 18, blur: 8 }),
      card: step('soft-scale', 430, { stagger: 70, duration: 560, distanceY: 16, scaleFrom: 0.972, blur: 8 }),
      rail: step('glide-left', 420, { stagger: 70, duration: 520, distanceX: -28, distanceY: 8 }),
      quote: step('focus', 650, { duration: 560, distanceY: 12, blur: 8, scaleFrom: 0.978 })
    },
    variants: {
      matrix: {
        id: 'concept-matrix',
        slots: {
          card: step('rise', 390, { stagger: 60, duration: 500, distanceY: 20, blur: 7 }),
          quote: step('rise', 620, { duration: 460, distanceY: 10, blur: 6 })
        }
      },
      selector: {
        id: 'concept-selector',
        slots: {
          panel: step('focus', 320, { duration: 640, distanceY: 18, scaleFrom: 0.97 }),
          rail: step('glide-left', 410, { stagger: 65, duration: 520, distanceX: -30, distanceY: 8 }),
          tag: step('rise', 600, { duration: 360, distanceY: 8, blur: 5 })
        }
      },
      layers: {
        id: 'concept-layers',
        slots: {
          card: step('focus', 410, { stagger: 70, duration: 580, distanceY: 18, scaleFrom: 0.974, blur: 8 }),
          quote: step('rise', 650, { duration: 500, distanceY: 12, blur: 6 })
        }
      }
    }
  },
  'case-study': {
    id: 'case-study-compare',
    slots: {
      panel: step('rise', 280, { duration: 620, distanceY: 18 }),
      metric: step('rise', 360, { stagger: 55, duration: 480, distanceY: 14, blur: 6 }),
      rail: step('glide-left', 420, { stagger: 70, duration: 540, distanceX: -28, distanceY: 8 }),
      code: step('soft-scale', 480, { stagger: 80, duration: 620, distanceY: 16, scaleFrom: 0.974, blur: 7 }),
      quote: step('focus', 680, { duration: 580, distanceY: 14, blur: 8 }),
      card: step('rise', 700, { stagger: 60, duration: 460, distanceY: 12, blur: 6 })
    },
    variants: {
      manifesto: {
        id: 'case-study-manifesto',
        slots: {
          panel: step('focus', 260, { duration: 700, distanceY: 18, scaleFrom: 0.972 }),
          metric: step('rise', 320, { stagger: 45, duration: 420, distanceY: 12 }),
          rail: step('glide-left', 430, { stagger: 60, duration: 500, distanceX: -24, distanceY: 8 }),
          code: step('soft-scale', 490, { stagger: 70, duration: 600, distanceY: 14 }),
          quote: step('focus', 700, { duration: 560, distanceY: 12, blur: 8 }),
          card: step('rise', 740, { stagger: 45, duration: 420, distanceY: 10, blur: 5 })
        }
      },
      'interactive-chat': {
        id: 'case-study-interactive-chat',
        slots: {
          panel: step('focus', 260, { duration: 680, distanceY: 18, scaleFrom: 0.972 }),
          rail: step('glide-left', 340, { stagger: 70, duration: 540, distanceX: -26, distanceY: 8 }),
          chat: step('focus', 480, { duration: 820, distanceY: 20, scaleFrom: 0.965, blur: 12 }),
          quote: step('rise', 660, { duration: 520, distanceY: 12, blur: 7 })
        }
      },
      workflow: {
        id: 'case-study-workflow',
        slots: {
          panel: step('rise', 280, { duration: 560, distanceY: 16 }),
          metric: step('rise', 340, { stagger: 45, duration: 420, distanceY: 12 }),
          rail: step('glide-left', 390, { stagger: 70, duration: 500, distanceX: -24, distanceY: 8 }),
          code: step('soft-scale', 470, { stagger: 70, duration: 580, distanceY: 14 }),
          quote: step('rise', 670, { duration: 460, distanceY: 10, blur: 6 })
        }
      },
      dossier: {
        id: 'case-study-dossier',
        slots: {
          panel: step('focus', 260, { duration: 640, distanceY: 18, scaleFrom: 0.972 }),
          rail: step('glide-left', 340, { stagger: 60, duration: 500, distanceX: -24, distanceY: 8 }),
          code: step('soft-scale', 460, { stagger: 80, duration: 600, distanceY: 16 }),
          metric: step('rise', 380, { stagger: 45, duration: 420, distanceY: 12 }),
          quote: step('focus', 700, { duration: 540, distanceY: 10, blur: 8 })
        }
      }
    }
  },
  flow: {
    id: 'flow-route',
    slots: {
      panel: step('rise', 260, { duration: 580, distanceY: 18 }),
      rail: step('glide-left', 340, { duration: 520, distanceX: -24, distanceY: 8 }),
      diagram: step('focus', 390, {
        duration: 820,
        distanceY: 16,
        scaleFrom: 0.97,
        blur: 6,
        easing: EASE_SOFT
      }),
      checkpoint: step('rise', 560, { stagger: 55, duration: 480, distanceY: 14, blur: 7 }),
      quote: step('focus', 700, { duration: 560, distanceY: 12, blur: 8, scaleFrom: 0.978 })
    },
    variants: {
      control: {
        id: 'flow-control',
        slots: {
          panel: step('rise', 250, { duration: 560, distanceY: 16 }),
          rail: step('glide-left', 330, { duration: 500, distanceX: -22, distanceY: 8 }),
          diagram: step('focus', 460, {
            duration: 780,
            distanceY: 14,
            scaleFrom: 0.972,
            blur: 6,
            easing: EASE_SOFT
          }),
          checkpoint: step('rise', 600, { stagger: 55, duration: 460, distanceY: 12 }),
          quote: step('focus', 720, { duration: 540, distanceY: 10, blur: 7 })
        }
      },
      loop: {
        id: 'flow-loop',
        slots: {
          diagram: step('focus', 360, {
            duration: 840,
            distanceY: 14,
            scaleFrom: 0.972,
            blur: 6,
            easing: EASE_SOFT
          }),
          checkpoint: step('rise', 520, { stagger: 55, duration: 480, distanceY: 12 })
        }
      },
      runtime: {
        id: 'flow-runtime',
        slots: {
          panel: step('rise', 250, { duration: 560, distanceY: 16 }),
          diagram: step('focus', 340, {
            duration: 800,
            distanceY: 14,
            scaleFrom: 0.972,
            blur: 6
          }),
          checkpoint: step('glide-left', 500, { stagger: 55, duration: 500, distanceX: -20, distanceY: 8 }),
          quote: step('focus', 700, { duration: 520, distanceY: 10, blur: 7 })
        }
      },
      storyboard: {
        id: 'flow-storyboard',
        slots: {
          panel: step('rise', 240, { duration: 540, distanceY: 16 }),
          rail: step('focus', 320, { duration: 620, distanceY: 14, scaleFrom: 0.978, blur: 8 }),
          card: step('rise', 430, { stagger: 70, duration: 500, distanceY: 16, blur: 7 }),
          quote: step('focus', 650, { duration: 560, distanceY: 10, scaleFrom: 0.978, blur: 8 }),
          footer: step('rise', 720, { duration: 420, distanceY: 8, blur: 5 })
        }
      },
      canvas: {
        id: 'flow-canvas',
        slots: {
          panel: step('rise', 240, { duration: 540, distanceY: 14 }),
          diagram: step('focus', 320, {
            duration: 900,
            distanceY: 12,
            scaleFrom: 0.976,
            blur: 4,
            easing: EASE_SOFT
          }),
          checkpoint: step('rise', 560, { stagger: 55, duration: 460, distanceY: 10, blur: 6 }),
          quote: step('focus', 470, { duration: 520, distanceY: 10, blur: 6, scaleFrom: 0.98 })
        }
      },
      'diagram-only': {
        id: 'flow-diagram-only',
        slots: {
          panel: step('rise', 230, { duration: 500, distanceY: 12, blur: 7 }),
          diagram: step('focus', 300, {
            duration: 940,
            distanceY: 10,
            scaleFrom: 0.98,
            blur: 4,
            easing: EASE_SOFT
          }),
          quote: step('rise', 620, { duration: 420, distanceY: 8, blur: 5 })
        }
      }
    }
  },
  summary: {
    id: 'summary-closing',
    slots: {
      card: step('rise', 270, { stagger: 55, duration: 460, distanceY: 16, blur: 6 }),
      panel: step('focus', 470, { duration: 680, distanceY: 16, scaleFrom: 0.974, blur: 9 }),
      media: step('glide-right', 560, { duration: 720, distanceX: 28, distanceY: 8 }),
      rail: step('glide-left', 610, { stagger: 60, duration: 500, distanceX: -22, distanceY: 8 }),
      footer: step('rise', 720, { duration: 420, distanceY: 10, blur: 5 })
    }
  }
}

function mergeRecipes(
  base: Partial<Record<ShellMotionSlot | MotionSlot, MotionRecipe>> | undefined,
  override: Partial<Record<ShellMotionSlot | MotionSlot, MotionRecipe>> | undefined
): Partial<Record<ShellMotionSlot | MotionSlot, MotionRecipe>> | undefined {
  if (!base && !override) {
    return undefined
  }

  return {
    ...base,
    ...override
  }
}

export function resolveSlideAnimation(slide: AnySlideDefinition): SlideAnimationPreset {
  const definition = slideAnimationMap[slide.type]
  const override = slide.variant ? definition.variants?.[slide.variant] : undefined

  return {
    id: override?.id ?? definition.id,
    shell: mergeRecipes(defaultShell, mergeRecipes(definition.shell, override?.shell)) as SlideAnimationPreset['shell'],
    slots: mergeRecipes(defaultSlots, mergeRecipes(definition.slots, override?.slots)) as SlideAnimationPreset['slots']
  }
}
