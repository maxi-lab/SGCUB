import { NavLink } from "react-router-dom";
import "./sidebar.css";

function Sidebar() {
  const links = [
    /*
    {
      to: "/padron/personas",
      label: "Personas",
      icon: "bi-person-vcard",
      nested: true,
      active: true,
      
    },
    */
    {
      to: "/padron/socios",
      label: "Socios",
      icon: "bi-people",
      nested: true,
      active: true,
    },
    {
      to: "/padron/jugadores",
      label: "Jugadores",
      icon: "bi-person-badge",
      nested: true,
      active: true,
    },
    {
      to: "/padron/categorias",
      label: "Categorías",
      icon: "bi-collection",
      nested: true,
      active: true,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <h2 className="admin-sidebar-title">Gestión del club</h2>
      </div>
      <nav className="admin-nav">
        <p className="sidebar-group-title">Padrón</p>
        <ul className="sidebar-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `sidebar-link ${link.nested ? "sidebar-link--nested" : ""} ${isActive ? "sidebar-link--active" : ""} ${!link.active ? "sidebar-link--disabled" : ""}`
                }
                onClick={(e) => !link.active && e.preventDefault()}
              >
                <i className={`bi ${link.icon}`}></i>
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
