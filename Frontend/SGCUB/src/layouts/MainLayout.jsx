import { NavLink, Link, Outlet } from "react-router-dom";
import "../App.css";
import Sidebar from "../components/main/Sidebar";

export default function MainLayout() {
  const navLinks = [
    { path: "/admin", label: "Admin" },
  ];

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="SGCUB inicio">
          <span className="brand-mark">CU</span>
          <span className="brand-name">SGCUB</span>
        </Link>

        <nav className="main-nav" aria-label="Navegación principal">
          {navLinks.map((link) => (
            /* NavLink sabe automáticamente si está "activo" o no */
            <NavLink
              to={link.path}
              key={link.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <footer className="site-footer">
        <span>Sistema Gestión Club Universitario Berisso</span>
      </footer>
    </div>
  );
}
