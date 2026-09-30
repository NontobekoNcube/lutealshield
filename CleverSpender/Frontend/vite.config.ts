import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    appType: 'mpa',
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          onboarding: path.resolve(__dirname, 'onboarding.html'),
          setup: path.resolve(__dirname, 'setup.html'),
          statement: path.resolve(__dirname, 'statement.html'),
          nudge: path.resolve(__dirname, 'nudge.html'),
          mountain: path.resolve(__dirname, 'mountain.html'),
          rewards: path.resolve(__dirname, 'rewards.html'),
          insights: path.resolve(__dirname, 'insights.html'),
          profile: path.resolve(__dirname, 'profile.html'),
        },
      },
    },
  };
});

