let isInitialized = false;
let mermaidModule: typeof import('mermaid').default | null = null;

async function getMermaid(): Promise<typeof import('mermaid').default> {
  if (mermaidModule) {
    return mermaidModule;
  }

  const { default: mermaid } = await import('mermaid');
  mermaidModule = mermaid;

  return mermaid;
}

export async function ensureMermaid(): Promise<typeof import('mermaid').default> {
  const mermaid = await getMermaid();

  if (isInitialized) {
    return mermaid;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    themeVariables: {
      darkMode: false,
      background: '#f8fbff',
      primaryColor: '#eef4fd',
      primaryBorderColor: '#7ea6f5',
      primaryTextColor: '#122033',
      secondaryColor: '#f6f9fd',
      secondaryBorderColor: '#8bb7ff',
      secondaryTextColor: '#122033',
      tertiaryColor: '#ffffff',
      tertiaryBorderColor: '#c7d8f7',
      tertiaryTextColor: '#122033',
      lineColor: '#6d93e7',
      textColor: '#122033',
      edgeLabelBackground: '#ffffff'
    }
  });

  isInitialized = true;
  return mermaid;
}

export async function renderMermaid(
  container: HTMLElement,
  id: string,
  definition: string
): Promise<void> {
  const mermaid = await ensureMermaid();
  const { svg, bindFunctions } = await mermaid.render(id, definition);
  container.innerHTML = svg;
  bindFunctions?.(container);
}
