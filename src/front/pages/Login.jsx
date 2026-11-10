import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(form);
      navigate(location.state?.from?.pathname || (user.role === "admin" ? "/admin" : "/inventory"), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <p className="eyebrow">CONTROL DE INVENTARIO</p>
        <h1>Todo en su lugar.<br /><span>Cada salida, también.</span></h1>
        <p className="auth-copy">Una vista clara de las existencias, el estado de cada artículo y su recorrido.</p>
        <div className="auth-stamp"><Boxes size={18} /><span>Gestión de juguetes</span><span className="stamp-dot" /></div>
      </section>
      <section className="auth-panel">
        <p className="eyebrow">BIENVENIDO DE NUEVO</p>
        <h2>Iniciar sesión</h2>
        <p className="muted">Accede con tu cuenta aprobada.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>Correo electrónico<input autoComplete="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Contraseña<input autoComplete="current-password" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-lime button-wide" disabled={busy}>{busy ? "Validando..." : "Entrar"}<ArrowRight size={17} /></button>
        </form>
        <p className="auth-footer">¿Aún no tienes cuenta? <Link to="/register">Solicitar acceso</Link></p>
      </section>
    </main>
  );
}