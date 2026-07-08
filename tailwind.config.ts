import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#007c83',
          deep: '#045157',
        },
        orange: {
          DEFAULT: '#fea74a',
          deep: '#d97f1f',
        },
        sand: {
          DEFAULT: '#dad0bc',
          line: '#c9bda3',
        },
        aqua: '#aafdfa',
        lightteal: '#41bcc2',
        cream: '#f6f1e6',
        paper: '#fffdf8',
        ink: {
          DEFAULT: '#17282b',
          soft: '#3f5559',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)', 'sans-serif'],
        script: ['var(--font-yellowtail)', 'cursive'],
        sans: ['var(--font-nunito-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '28px',
        md: '18px',
        sm: '10px',
      },
      boxShadow: {
        soft: '0 18px 40px -22px rgba(23,40,43,0.35)',
      },
      maxWidth: {
        prose: '65ch',
      },
    },
  },
  plugins: [],
};

export default config;
