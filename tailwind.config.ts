import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        deck: {
          bg: '#f2f6fc',
          panel: '#ffffff',
          panelStrong: '#edf4fd',
          line: 'rgba(148, 163, 184, 0.22)',
          text: '#122033',
          muted: '#5b6b82',
          accent: '#5a8dee',
          accentSoft: '#98bfff',
          warning: '#c88a17'
        }
      },
      boxShadow: {
        panel: '0 24px 64px rgba(123, 146, 179, 0.18)'
      },
      backgroundImage: {
        'panel-grid':
          'linear-gradient(rgba(90, 141, 238, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(90, 141, 238, 0.06) 1px, transparent 1px)'
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', '"Consolas"', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
