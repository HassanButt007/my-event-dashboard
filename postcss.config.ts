import type { Plugin } from 'postcss';

const config: { plugins: Record<string, Plugin | {}> } = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;