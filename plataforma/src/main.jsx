import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { API, useRoute } from './lib.js';
import { Shell } from './shell.jsx';
import { Empty, LinkButton } from './ui.jsx';
import { Inicio, Actividad } from './pages/inicio.jsx';
import { Rifas, NuevaRifa, Ganadores, RifaDetalle } from './pages/rifas.jsx';
import { Pagos, Taquilla, Verificador, Reportes } from './pages/ventas.jsx';
import { Clientes, Influencers } from './pages/clientes.jsx';
import { Bandeja, ResumenMsj, Campanas, Automatizaciones, Historial, Contactos, Agentes, Bot, Conexion } from './pages/mensajeria.jsx';
import { Empresa, Usuarios, Cajas, Metodos, Monedas, Pasarelas, Sitio, Dominios, Seguridad } from './pages/ajustes.jsx';
import { AdminInicio, Sala, AdminActividad, Empresas, SupervisorRifas, Extensiones, Denuncias, Cobros, Planes, Plataforma, Loterias, AdminUsuarios, Notas, AdminSeguridad, EditarRifa, RegistrarEmpresa } from './pages/admin.jsx';

const ROUTES = {
  '/': Inicio, '/actividad': Actividad,
  '/rifas': Rifas, '/rifas/nueva': NuevaRifa, '/rifas/ganadores': Ganadores,
  '/ventas/pagos': Pagos, '/ventas/taquilla': Taquilla, '/ventas/verificador': Verificador, '/ventas/reportes': Reportes,
  '/clientes': Clientes, '/clientes/influencers': Influencers,
  '/mensajeria/bandeja': Bandeja, '/mensajeria/resumen': ResumenMsj, '/mensajeria/campanas': Campanas, '/mensajeria/automatizaciones': Automatizaciones,
  '/mensajeria/historial': Historial, '/mensajeria/contactos': Contactos, '/mensajeria/agentes': Agentes, '/mensajeria/bot': Bot, '/mensajeria/conexion': Conexion,
  '/ajustes/empresa': Empresa, '/ajustes/usuarios': Usuarios, '/ajustes/cajas': Cajas, '/ajustes/metodos': Metodos, '/ajustes/monedas': Monedas,
  '/ajustes/pasarelas': Pasarelas, '/ajustes/sitio': Sitio, '/ajustes/dominios': Dominios, '/ajustes/seguridad': Seguridad
};
const ADMIN = {
  '/admin': AdminInicio, '/admin/sala': Sala, '/admin/actividad': AdminActividad, '/admin/empresas': Empresas, '/admin/empresas/nueva': RegistrarEmpresa, '/admin/rifas': SupervisorRifas, '/admin/rifas/extensiones': Extensiones, '/admin/rifas/editar': EditarRifa,
  '/admin/denuncias': Denuncias, '/admin/facturacion': Cobros, '/admin/facturacion/planes': Planes, '/admin/ajustes': Plataforma, '/admin/ajustes/loterias': Loterias,
  '/admin/ajustes/usuarios': AdminUsuarios, '/admin/ajustes/notas': Notas, '/admin/ajustes/seguridad': AdminSeguridad
};
const ALIAS = { '/ventas': '/ventas/pagos', '/mensajeria': '/mensajeria/bandeja', '/ajustes': '/ajustes/empresa' };

function App() {
  const { path, query } = useRoute();
  // Sin sesión se va a la página principal de LottoGE para iniciar sesión.
  const session = API.session();
  if (!session) { location.replace('./pagina-principal/' + (location.hash ? '#login' : '')); return null; }
  const admin = session.role === 'superadmin' && !session.viewAs;
  if (admin && !path.startsWith('/admin')) { location.replace('#/admin'); return null; }
  if (!admin && path.startsWith('/admin')) { location.replace('#/'); return null; }
  const p = ALIAS[path] || path;
  let page;
  const m = p.match(/^\/rifas\/(R-[\w-]+)(\/editar)?$/);
  if (admin) { const P = ADMIN[p]; page = P ? <P query={query} /> : null; }
  else if (ROUTES[p]) { const P = ROUTES[p]; page = <P query={query} />; }
  else if (m) page = m[2] ? <NuevaRifa id={m[1]} query={query} /> : <RifaDetalle id={m[1]} query={query} />;
  if (!page) page = <div className="card"><Empty title="Esta pantalla no existe" text="Revisa la dirección o vuelve al Inicio." action={<LinkButton href={admin ? '#/admin' : '#/'} variant="primary">Ir al Inicio</LinkButton>} /></div>;
  return <Shell admin={admin} session={session}>{page}</Shell>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
