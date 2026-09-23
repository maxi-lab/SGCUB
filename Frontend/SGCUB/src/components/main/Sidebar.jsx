import { Link, NavLink, useLocation } from 'react-router-dom';
import './sidebar.css';

export default function Sidebar({ collapsed, onToggle }) {
  const { pathname } = useLocation();
  const personasActive = ['/padron/socios', '/padron/jugadores', '/padron/docentes']
    .some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const finanzasActive = ['/resumen-financiero', '/morosidad', '/caja']
    .some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <aside className={`app-sidebar ${collapsed ? 'app-sidebar--collapsed' : ''}`}>
      <div className="app-sidebar-content">
        <div className="app-sidebar-brand">
          <Link to="/" className="app-sidebar-brand-inner" aria-label="Ir al inicio">
            <img alt="Escudo C.U.B." className="app-sidebar-logo object-contain shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw0qMmPJt8lyOTUmLIk2OChr72lPBKBGM0Ooi5EsWTcQZWPwF5tQmcpOwUne1Zxvpblwrqju3Ys1pdkaOSi34oNgho0Y76qWMARu8muV-uLxCVofMILAo-WMwrMhxHWo7N0XKSs-p6SKceU_y2aFDakmlV0aTgH7l298a2hTMGf6K42RthvVubA8eQ3HLriAqS7KCzLAq2-eCRowuPbM4J1up9LxuGkNPWtzwmSTe0gxDIedSLAHvNQWCoLL3q4m1gGQ" />
            <div className="app-sidebar-brand-copy">
              <span className="app-sidebar-brand-name text-on-surface">C.U.B.</span>
              <span className="app-sidebar-brand-subtitle text-on-surface-variant">Club Univ. Berisso</span>
            </div>
          </Link>
        </div>
        <div className="app-sidebar-scroll">
          <nav className="app-sidebar-nav">
            <NavLink end to="/" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-2 rounded transition-colors font-title-md font-semibold ${isActive ? 'app-sidebar-link--active' : ''}`}>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span className="font-body-md text-body-md">Inicio</span>
              </div>
            </NavLink>
            
            {/* Sección Personas */}
            <div className="flex flex-col gap-0.5">
              <div className={`app-sidebar-section flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant font-medium select-none cursor-pointer ${personasActive ? 'app-sidebar-section--active' : ''}`}>
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                  <span className="font-body-md text-body-md font-semibold text-on-surface">Personas</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 pl-6 border-l-2 border-outline-variant/30 ml-4 my-0.5">
                <NavLink to="/padron/socios" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
                  <span className="app-sidebar-subitem-main">
                    <span className="app-sidebar-subitem-icon material-symbols-outlined" aria-hidden="true">person</span>
                    <span className="font-body-sm text-body-sm">Socios</span>
                  </span>
                </NavLink>
                <NavLink to="/padron/jugadores" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
                  <span className="app-sidebar-subitem-main">
                    <span className="app-sidebar-subitem-icon material-symbols-outlined" aria-hidden="true">sports</span>
                    <span className="font-body-sm text-body-sm">Jugadores</span>
                  </span>
                </NavLink>
                <NavLink to="/padron/docentes" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
                  <span className="app-sidebar-subitem-main">
                    <span className="app-sidebar-subitem-icon material-symbols-outlined" aria-hidden="true">school</span>
                    <span className="font-body-sm text-body-sm">Docentes</span>
                  </span>
                </NavLink>
              </div>
            </div>

            {/* Sección Finanzas */}
            <div className="flex flex-col gap-0.5">
              <div className={`app-sidebar-section flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant font-medium select-none cursor-pointer ${finanzasActive ? 'app-sidebar-section--active' : ''}`}>
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  <span className="font-body-md text-body-md font-semibold text-on-surface">Finanzas</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 pl-6 border-l-2 border-outline-variant/30 ml-4 my-0.5">
                <NavLink to="/resumen-financiero" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
                  <span className="app-sidebar-subitem-main">
                    <span className="app-sidebar-subitem-icon material-symbols-outlined" aria-hidden="true">account_balance</span>
                    <span className="font-body-sm text-body-sm">Resumen financiero</span>
                  </span>
                </NavLink>
                <NavLink to="/morosidad" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
                  <span className="app-sidebar-subitem-main">
                    <span className="app-sidebar-subitem-icon material-symbols-outlined" aria-hidden="true">warning</span>
                    <span className="font-body-sm text-body-sm">Reporte de morosidad</span>
                  </span>
                </NavLink>
                <NavLink to="/caja" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
                  <span className="app-sidebar-subitem-main">
                    <span className="app-sidebar-subitem-icon material-symbols-outlined" aria-hidden="true">point_of_sale</span>
                    <span className="font-body-sm text-body-sm">Caja y cobros</span>
                  </span>
                </NavLink>
              </div>
            </div>

            <NavLink to="/documental" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                <span className="font-body-md text-body-md">Documental</span>
              </div>

              {/* Aca el uno habria que cambiarlo por un valor real o eliminar la notificacion */}
              
              <span className="bg-error-container text-on-error-container px-1.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">8</span>
            </NavLink>
            
            <NavLink to="/padron/categorias" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
                <span className="font-body-md text-body-md">Categorías</span>
              </div>
            </NavLink>

            <NavLink to="/comunicaciones" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
                <span className="font-body-md text-body-md">Comunicaciones</span>
              </div>
            </NavLink>

            <NavLink to="/reportes" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                <span className="font-body-md text-body-md">Reportes y COMET</span>
              </div>
            </NavLink>

            <NavLink to="/administracion" className={({ isActive }) => `app-sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${isActive ? 'app-sidebar-link--active' : ''}`}>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <span className="font-body-md text-body-md">Administración</span>
              </div>
            </NavLink>
          </nav>
        </div>
      </div>
      <div className="app-sidebar-footer">
        <button
          type="button"
          className="app-sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
          title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
        >
          <span className="app-sidebar-toggle-label">{collapsed ? 'Mostrar menú' : 'Contraer menú'}</span>
          <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
        </button>
        <div className="app-sidebar-version">
          <p className="font-label-sm text-label-sm text-on-surface-variant">SGCUB - Sistema Interno</p>
        </div>
      </div>
    </aside>
  );
}