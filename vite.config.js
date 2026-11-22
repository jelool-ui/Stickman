import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permet d'héberger l'interface sur GitHub Pages sans configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
