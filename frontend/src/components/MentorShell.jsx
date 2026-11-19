import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

const NAV = [
  { to: "/", label: "Meetings", end: true },
  { to: "/availability", label: "Availability" },
  { to: "/profile", label: "My profile" },
];

export default function MentorShell({ me, profile, title, onLogout, children }) {
  const name = profile ? `${profile.first_name} ${profile.last_name}` : me.email;
  const initials = profile
    ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
    : me.email[0].toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="Massachusetts Science + Engineering Fair" />
        </div>

        <nav>
          <p className="side-label">MENTOR WORKSPACE</p>
          <div className="nav-list">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="side-spacer" />

        <div className="account">
          <div className="avatar-initials">{initials}</div>
          <div className="account-text">
            <div className="account-name">{name}</div>
            <div className="account-role">Science fair mentor</div>
          </div>
          <button className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
              <span aria-hidden="true">×</span>
          </button>
        </div>
      </aside>

      <div className="workspace">
        <div className="workspace-bar">
          <span className="muted">MSEF mentor workspace</span>
          <span aria-hidden="true">›</span>
          <strong>{title}</strong>
        </div>
        <div className="workspace-body">{children}</div>
      </div>
    </div>
  );
}
