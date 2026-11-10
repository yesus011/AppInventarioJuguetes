import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Boxes, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const conditionClass = { Nuevo: "tag-green", Usado: "tag-blue", Dañado: "tag-red" };

export function Inventory() {
  const { token } = useAuth();
  const [data, setData] = useState({ items: [], exits: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/inventory", { token })
      .then(setData)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [token]);

  const totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = data.items.filter((item) => item.quantity < 5).length;

  return (
    <main className="content-wrap">
      <div className="page-heading">
        <div><p className="eyebrow">RESUMEN / EXISTENCIAS</p><h1>Inventario</h1><p className="muted">Disponibilidad actual y registro de salidas.</p></div>
        <span className="date-chip">Actualizado al consultar</span>
      </div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <section className="metric-grid" aria-label="Resumen de inventario">
        <article className="metric"><span className="metric-icon"><Boxes size={19} /></span><span>Artículos distintos</span><strong>{data.items.length}</strong><small>Referencias registradas</small></article>
        <article className="metric metric-highlight"><span className="metric-icon"><ArrowUpRight size={19} /></span><span>Unidades disponibles</span><strong>{totalUnits}</strong><small>Existencias actuales</small></article>
        <article className="metric"><span className="metric-icon"><ArrowDownLeft size={19} /></span><span>Stock bajo</span><strong>{lowStock}</strong><small>Menos de 5 unidades</small></article>
      </section>

      <section className="data-section">
        <div className="section-heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Artículos disponibles</h2></div><span className="count-label">{data.items.length} referencias</span></div>
        {loading ? <p className="empty-state">Cargando inventario...</p> : data.items.length === 0 ? <p className="empty-state">Todavía no hay artículos registrados.</p> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Condición</th><th>Existencias</th></tr></thead><tbody>
            {data.items.map((item) => <tr key={item.id}>
              <td><div className="item-cell">{item.image_url ? <img src={item.image_url} alt={item.description} /> : <span className="item-placeholder"><ImageIcon size={18} /></span>}<span>{item.description}</span></div></td>
              <td><span className={`tag ${conditionClass[item.condition] || "tag-blue"}`}>{item.condition}</span></td>
              <td><span className={item.quantity < 5 ? "quantity-low" : "quantity-value"}>{item.quantity}</span><span className="unit-label"> unidades</span></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="data-section exit-section">
        <div className="section-heading"><div><p className="eyebrow">TRAZABILIDAD</p><h2>Últimas salidas</h2></div><span className="count-label">{data.exits.length} movimientos</span></div>
        {loading ? <p className="empty-state">Cargando movimientos...</p> : data.exits.length === 0 ? <p className="empty-state">Las salidas registradas aparecerán aquí.</p> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Destino</th><th>Fecha</th><th>Cantidad</th><th>Registrado por</th></tr></thead><tbody>
            {data.exits.map((entry) => <tr key={entry.id}><td className="table-primary">{entry.item_description}</td><td>{entry.destination}</td><td>{entry.exit_date}</td><td><span className="exit-amount">-{entry.quantity}</span></td><td>{entry.created_by}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </main>
  );
}