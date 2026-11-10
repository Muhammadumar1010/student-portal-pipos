import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Backgrounds
          page: 'var(--color-page, #ffffff)',
          card: 'var(--color-card, #f8f9fa)',
          subtle: 'var(--color-subtle, #f1f5f9)',

          // Text
          'text-primary': 'var(--color-text-primary, #0f172a)',
          'text-secondary': 'var(--color-text-secondary, #334155)',
          'text-muted': 'var(--color-text-muted, #64748b)',

          // Borders
          'border-default': 'var(--color-border, #e2e8f0)',
          'border-hover': 'var(--color-border-hover, #cbd5e1)',
          'border-strong': 'var(--color-border-strong, #94a3b8)',

          // Accent — use sparingly, small elements only
          accent: 'var(--color-accent, #4338CA)',

          // Semantic status colors
          success: 'var(--color-success, #16a34a)',
          'success-bg': 'var(--color-success-bg, #DCFCE7)',
          'success-border': 'var(--color-success-border, #BBF7D0)',

          warning: 'var(--color-warning, #ca8a04)',
          'warning-bg': 'var(--color-warning-bg, #FEF9C3)',
          'warning-border': 'var(--color-warning-border, #FDE68A)',

          danger: 'var(--color-danger, #dc2626)',
          'danger-bg': 'var(--color-danger-bg, #FEE2E2)',
          'danger-border': 'var(--color-danger-border, #FECACA)',
        },
      },
    },
  },
};

export default config;
