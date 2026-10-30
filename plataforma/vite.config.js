import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Las carpetas de public/ (página principal y fronts de venta) se abren por su dirección de carpeta,
// por ejemplo /pagina-principal/ o /fronts/estandar/?rifa=R-101. El servidor de Vite no busca el
// index.html de una carpeta y respondería con el panel (que vuelve a mandar a la página principal):
// aquí se le indica que sirva el index.html de esa carpeta.
const carpetasConIndex = () => {
  const reescribir = (req, res, next) => {
    const [ruta, query] = req.url.split('?');
    if (/^\/(pagina-principal|fronts)(\/[\w-]+)?\/?$/.test(ruta)) {
      if (!ruta.endsWith('/')) { res.statusCode = 301; res.setHeader('Location', ruta + '/' + (query ? '?' + query : '')); return res.end(); }
      req.url = ruta + 'index.html' + (query ? '?' + query : '');
    }
    next();
  };
  return { name: 'carpetas-con-index', configureServer: s => { s.middlewares.use(reescribir); }, configurePreviewServer: s => { s.middlewares.use(reescribir); } };
};

// base './' para que el build funcione abierto desde cualquier carpeta o servidor estático.
export default defineConfig({ plugins: [react(), carpetasConIndex()], base: './', server: { port: 5173 } });
