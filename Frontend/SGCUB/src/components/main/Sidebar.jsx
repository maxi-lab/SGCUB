import { NavLink } from "react-router-dom";
import "./sidebar.css";

function Sidebar() {
  const links = [
    {
      to: "/padron",
      label: "Padrón",
      icon: "bi-box-seam",
      active: true,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <h2 className="admin-sidebar-title">Gestión del club</h2>
      </div>
      <nav className="admin-nav">
        {/*<h2>Admin Panel</h2>*/}
        <ul className="sidebar-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link--active" : ""} ${!link.active ? "sidebar-link--disabled" : ""}`
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
