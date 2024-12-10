import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{html,css}', // Adicionando esta linha pode ajudar a garantir a inclusão do CSS
  ],
  plugins: [react()],
});
