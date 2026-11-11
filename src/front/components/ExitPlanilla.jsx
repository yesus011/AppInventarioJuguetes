import { Printer, X } from "lucide-react";

export function ExitPlanilla({ entry, onClose }) {
  return (
    <div className="exit-planilla-overlay" role="dialog" aria-modal="true" aria-labelledby="planilla-title">
      <article className="exit-planilla">
        <div className="exit-planilla-actions">
          <button className="button button-dark" onClick={() => window.print()}><Printer size={16} />Imprimir planilla</button>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar planilla"><X size={18} /></button>
        </div>
        <header className="planilla-header">
          <div>
            <p className="eyebrow">CONTROL DE INVENTARIO</p>
            <h1 id="planilla-title">Planilla de salida</h1>
          </div>
          <div className="planilla-meta"><span>Folio: {entry.id}</span><span>Fecha: {entry.exit_date}</span></div>
        </header>
        <table className="planilla-table">
          <thead><tr><th>N.º</th><th>Descripción</th><th>Cantidad</th><th>Destino</th><th>Observación</th></tr></thead>
          <tbody><tr>
            <td>1</td>
            <td>{entry.item_description}{(entry.item_brand || entry.item_age) && <small>{[entry.item_brand, entry.item_age].filter(Boolean).join(" · ")}</small>}</td>
            <td>{entry.quantity}</td>
            <td>{entry.destination}</td>
            <td>{entry.observations || ""}</td>
          </tr>{Array.from({ length: 4 }, (_, index) => <tr className="planilla-empty-row" key={index}><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>)}</tbody>
        </table>
        <div className="planilla-signatures">
          <section>
            <h2>Entregué conforme</h2>
            <div className="signature-line" />
            <p>Firma</p>
            <p>Nombre y apellido: <span /></p>
            <p>N.º de cédula: <span /></p>
            <p>N.º de teléfono: <span /></p>
          </section>
          <section>
            <h2>Recibí conforme</h2>
            <div className="signature-line" />
            <p>Firma</p>
            <p>Nombre y apellido: <span /></p>
            <p>N.º de cédula: <span /></p>
            <p>N.º de teléfono: <span /></p>
          </section>
        </div>
      </article>
    </div>
  );
}
