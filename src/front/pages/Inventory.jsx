import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Boxes, Image as ImageIcon, Printer } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ExitPlanilla } from "../components/ExitPlanilla";

const conditionClass = { Nuevo: "tag-green", Usado: "tag-blue", Dañado: "tag-red" };
const emptyFilterValue = "__sin_dato__";

export function Inventory() {
  const { token, user } = useAuth();
  const canPrintExits = user?.role === "admin" || user?.role === "inventory_manager";
  const [data, setData] = useState({ items: [], exits: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ brand: "", condition: "", age: "" });
  const [planilla, setPlanilla] = useState(null);

  useEffect(() => {
    apiRequest("/inventory", { token })
      .then(setData)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [token]);

  const totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = data.items.filter((item) => item.quantity < 5).length;
  const brands = useMemo(() => [...new Set(data.items.map((item) => item.brand).filter(Boolean))].sort(), [data.items]);
  const ages = useMemo(() => [...new Set(data.items.map((item) => item.age).filter(Boolean))].sort(), [data.items]);
  const filteredItems = data.items.filter((item) =>
    (!filters.brand || (filters.brand === emptyFilterValue ? !item.brand : item.brand === filters.brand))
    && (!filters.condition || item.condition === filters.condition)
    && (!filters.age || (filters.age === emptyFilterValue ? !item.age : item.age === filters.age))
  );

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

      {planilla && <ExitPlanilla entry={planilla} onClose={() => setPlanilla(null)} />}
      <section className="data-section">
        <div className="section-heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Artículos disponibles</h2></div><span className="count-label">{filteredItems.length} de {data.items.length} referencias</span></div>
        <div className="inventory-filters" aria-label="Filtros de inventario">
          <label>Marca<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Todas las marcas</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}{data.items.some((item) => !item.brand) && <option value={emptyFilterValue}>Sin marca</option>}</select></label>
          <label>Condición<select value={filters.condition} onChange={(event) => setFilters({ ...filters, condition: event.target.value })}><option value="">Todas las condiciones</option><option>Nuevo</option><option>Usado</option><option>Dañado</option></select></label>
          <label>Edad<select value={filters.age} onChange={(event) => setFilters({ ...filters, age: event.target.value })}><option value="">Todas las edades</option>{ages.map((age) => <option key={age}>{age}</option>)}{data.items.some((item) => !item.age) && <option value={emptyFilterValue}>Sin edad</option>}</select></label>
        </div>
        {loading ? <p className="empty-state">Cargando inventario...</p> : data.items.length === 0 ? <p className="empty-state">Todavía no hay artículos registrados.</p> : filteredItems.length === 0 ? <p className="empty-state">No hay artículos que coincidan con los filtros.</p> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Marca</th><th>Edad</th><th>Condición</th><th>Existencias</th></tr></thead><tbody>
            {filteredItems.map((item) => <tr key={item.id}>
              <td><div className="item-cell">{item.image_url ? <img src={item.image_url} alt={item.description} /> : <span className="item-placeholder"><ImageIcon size={18} /></span>}<span>{item.description}</span></div></td>
              <td>{item.brand || "—"}</td><td>{item.age || "—"}</td>
              <td><span className={`tag ${conditionClass[item.condition] || "tag-blue"}`}>{item.condition}</span></td>
              <td><span className={item.quantity < 5 ? "quantity-low" : "quantity-value"}>{item.quantity}</span><span className="unit-label"> unidades</span></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="data-section exit-section">
        <div className="section-heading"><div><p className="eyebrow">TRAZABILIDAD</p><h2>Últimas salidas</h2></div><span className="count-label">{data.exits.length} movimientos</span></div>
        {loading ? <p className="empty-state">Cargando movimientos...</p> : data.exits.length === 0 ? <p className="empty-state">Las salidas registradas aparecerán aquí.</p> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Destino</th><th>Fecha</th><th>Cantidad</th><th>Registrado por</th>{canPrintExits && <th>Planilla</th>}</tr></thead><tbody>
            {data.exits.map((entry) => <tr key={entry.id}><td className="table-primary">{entry.item_description}</td><td>{entry.destination}</td><td>{entry.exit_date}</td><td><span className="exit-amount">-{entry.quantity}</span></td><td>{entry.created_by}</td>{canPrintExits && <td><button className="planilla-button" onClick={() => setPlanilla(entry)}><Printer size={14} />Imprimir</button></td>}</tr>)}
          </tbody></table></div>
        )}
      </section>
    </main>
  );
}