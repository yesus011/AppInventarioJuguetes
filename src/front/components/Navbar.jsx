import { Link, NavLink, useNavigate } from "react-router-dom";
import { Boxes, ClipboardList, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
 const { user, logout } = useAuth();
 const navigate = useNavigate();
 const linkClass = ({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`;

	return (
		<nav className="topbar">
			<div className="topbar-inner">
				<Link to={user ? "/inventory" : "/login"} className="brand-mark">
					<span className="brand-symbol"><Boxes size={19} /></span>
					<span>Juguetes<span className="brand-light"> / stock</span></span>
				</Link>
				{user ? (
					<div className="nav-session">
						<NavLink to="/inventory" className={linkClass}><Boxes size={16} />Inventario</NavLink>
						{["admin", "inventory_manager", "inventory_editor"].includes(user.role) && <NavLink to="/inventory/manage" className={linkClass}><ClipboardList size={16} />Movimientos</NavLink>}
						{user.role === "admin" && <NavLink to="/admin" className={linkClass}><ShieldCheck size={16} />Administración</NavLink>}
						<span className="nav-email">{user.email}</span>
						<button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => { logout(); navigate("/login"); }}><LogOut size={17} /></button>
					</div>
				) : (
					<div className="nav-session">
						<NavLink to="/login" className={linkClass}>Iniciar sesión</NavLink>
						<Link to="/register" className="button button-dark">Crear cuenta</Link>
					</div>
				)}
			</div>
		</nav>
	);
};