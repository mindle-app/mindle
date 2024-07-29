import typographyPlugin from '@tailwindcss/typography'
import { type Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import radixPlugin from 'tailwindcss-radix'
import { marketingPreset } from './app/routes/_marketing+/tailwind-preset'
import { extendedTheme } from './app/utils/extended-theme.ts'

export default {
  content: ['./app/**/*.{ts,tsx,jsx,js}'],
  safelist: ['ProseMirror'],
  darkMode: 'class',
  theme: {
    extend: extendedTheme,
  },
  presets: [marketingPreset],
  plugins: [animatePlugin, radixPlugin, typographyPlugin],
} satisfies Config
