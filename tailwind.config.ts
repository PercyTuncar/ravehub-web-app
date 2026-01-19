import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Ravehub specific colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        'acid-yellow': '#ccff00',
        'acid-pink': '#ff0099',
        'neon-green': '#39ff14',
        // Extended orange palette
        orange: {
          50: 'hsl(24, 100%, 97%)',
          100: 'hsl(24, 100%, 94%)',
          200: 'hsl(24, 95%, 87%)',
          300: 'hsl(24, 95%, 76%)',
          400: 'hsl(24, 95%, 64%)',
          500: 'hsl(24, 95%, 53%)', // Main brand color
          600: 'hsl(24, 95%, 45%)',
          700: 'hsl(24, 95%, 37%)',
          800: 'hsl(24, 45%, 25%)',
          900: 'hsl(24, 45%, 15%)',
          950: 'hsl(24, 45%, 9%)',
        },
        // Ravehub brand colors
        ravehub: {
          primary: '#FBA905',
          'primary-alt': '#F1A000',
          emphasis: '#007BDF',
          'emphasis-alt': '#006DC6',
          'emphasis-secondary': '#00CBFF',
          'emphasis-secondary-alt': '#00BFF0',
          background: '#282D31',
          'background-alt': '#141618',
          text: '#FAFDFF',
          'text-secondary': '#53575A',
          border: '#DFE0E0',
          error: '#FF3C32',
          'error-alt': '#FF2419',
          success: '#28a745',
          'success-alt': '#218838',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;