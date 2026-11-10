import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../lib/api";

export function Register() {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-intro">
        <p className="eyebrow">ACCESO DE EQUIPO</p>
        <h1>El cuidado del stock<br /><span>empieza aquí.</span></h1>
        <p className="auth-copy">Solicita una cuenta para consultar existencias y registrar movimientos.</p>
        <Link to="/login" className="back-link"><ArrowLeft size={16} />Volver al inicio de sesión</Link>
      </section>
      <section className="auth-panel">
        {submitted ? (
          <div className="success-state">
            <span className="success-icon"><CheckCircle2 size={26} /></span>
            <p className="eyebrow">SOLICITUD ENVIADA</p>
            <h2>Queda pendiente.</h2>
            <p className="muted">Un administrador debe aprobar tu cuenta antes de que puedas acceder al inventario.</p>
            <Link to="/login" className="button button-dark button-wide">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <>
            <p className="eyebrow">NUEVO USUARIO</p>
            <h2>Solicitar acceso</h2>
            <p className="muted">La cuenta quedará pendiente de aprobación.</p>
            <form className="form-stack" onSubmit={handleSubmit}>
              <label>Correo electrónico<input autoComplete="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Contraseña<input autoComplete="new-password" type="password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>Mínimo 8 caracteres.</small></label>
              <label>Confirmar contraseña<input autoComplete="new-password" type="password" minLength={8} required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-lime button-wide" disabled={busy}>{busy ? "Enviando..." : "Enviar solicitud"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}