declare module 'reveal.js' {
  export interface RevealOptions {
    width?: number;
    height?: number;
    margin?: number;
    minScale?: number;
    maxScale?: number;
    hash?: boolean;
    controls?: boolean;
    controlsLayout?: 'bottom-right' | 'edges';
    controlsBackArrows?: 'faded' | 'hidden' | 'visible';
    progress?: boolean;
    slideNumber?: boolean | string;
    center?: boolean;
    transition?: string;
    backgroundTransition?: string;
    navigationMode?: 'default' | 'linear' | 'grid';
  }

  export default class Reveal {
    constructor(root: HTMLElement, options?: RevealOptions);
    initialize(): Promise<void>;
    destroy(): void;
    layout(): void;
    sync(): void;
  }
}
