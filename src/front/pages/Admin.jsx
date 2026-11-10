import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, ShieldCheck, X } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function Admin() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const loadUsers = useCallback(() => apiRequest("/admin/users", { token }).then(setUsers), [token]);

  useEffect(() => {
    loadUsers().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [loadUsers]);

  async function setStatus(userId, status) {
    setError("");
    try {
      await apiRequest(`/admin/users/${userId}/status`, { token, method: "PATCH", body: JSON.stringify({ status }) });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const pendingCount = users.filter((user) => user.status === "pending").length;

  return (
    <main className="content-wrap">
      <div className="page-heading"><div><p className="eyebrow">CONTROL DE ACCESO</p><h1>Administración</h1><p className="muted">Revisa las solicitudes y administra el acceso al inventario.</p></div><span className="admin-badge"><ShieldCheck size={16} />Administrador</span></div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <section className="metric-grid admin-metrics"><article className="metric"><span>Usuarios registrados</span><strong>{users.length}</strong><small>Cuentas en el sistema</small></article><article className="metric metric-highlight"><span>Pendientes</span><strong>{pendingCount}</strong><small>Requieren revisión</small></article><article className="metric"><span>Con acceso</span><strong>{users.filter((user) => user.status === "approved").length}</strong><small>Cuentas aprobadas</small></article></section>
      <section className="data-section">
        <div className="section-heading"><div><p className="eyebrow">USUARIOS</p><h2>Solicitudes y cuentas</h2></div><button className="icon-button refresh-button" title="Actualizar usuarios" aria-label="Actualizar usuarios" onClick={() => loadUsers().catch((requestError) => setError(requestError.message))}><RefreshCw size={17} /></button></div>
        {loading ? <p className="empty-state">Cargando usuarios...</p> : users.length === 0 ? <p className="empty-state">No hay usuarios registrados.</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Correo electrónico</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          {users.map((user) => <tr key={user.id}><td className="table-primary">{user.email}</td><td>{user.role === "admin" ? "Administrador" : "Usuario"}</td><td><span className={`tag ${user.status === "approved" ? "tag-green" : user.status === "rejected" ? "tag-red" : "tag-amber"}`}>{user.status === "approved" ? "Aprobado" : user.status === "rejected" ? "Rechazado" : "Pendiente"}</span></td><td>{user.role === "admin" ? <span className="muted">Cuenta protegida</span> : <div className="admin-actions"><button className="action-approve" onClick={() => setStatus(user.id, "approved")}><Check size={15} />Aprobar</button><button className="action-reject" onClick={() => setStatus(user.id, "rejected")}><X size={15} />Rechazar</button></div>}</td></tr>)}
        </tbody></table></div>}
      </section>
    </main>
  );
}