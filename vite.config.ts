import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: command === 'build' ? '/ThinkAloud/' : '/',
    optimizeDeps: {
      exclude: ['js-big-decimal'],
    },
    plugins: [
      react({ devTarget: 'es2022' }),
    ],
  };
});
