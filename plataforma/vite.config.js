import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para que el build funcione abierto desde cualquier carpeta o servidor estático.
export default defineConfig({ plugins: [react()], base: './', server: { port: 5173 } });
