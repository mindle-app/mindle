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
    container: {
      center: true,
      padding: {
        DEFAULT: '0.5rem',
        sm: '0.5rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: extendedTheme,
  },
  presets: [marketingPreset],
  plugins: [animatePlugin, radixPlugin, typographyPlugin],
} satisfies Config
