import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Boxes, Image as ImageIcon, Printer } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const conditionClass = { Nuevo: "tag-green", Usado: "tag-blue", Dañado: "tag-red" };

export function Inventory() {
  const { token } = useAuth();
  const [data, setData] = useState({ items: [], exits: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ brand: "", toy_type: "", age: "" });
  const [printExit, setPrintExit] = useState(null);

  useEffect(() => {
    apiRequest("/inventory", { token })
      .then(setData)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!printExit) return undefined;
    const handleAfterPrint = () => setPrintExit(null);
    window.addEventListener("afterprint", handleAfterPrint);
    window.print();
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [printExit]);

  const filteredItems = data.items.filter((item) =>
    (!filters.brand || item.brand === filters.brand)
    && (!filters.toy_type || item.toy_type === filters.toy_type)
    && (!filters.age || item.age === filters.age)
  );
  const filterOptions = (field) => [...new Set(data.items.map((item) => item[field]).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, "es"));
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
        <div className="section-heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Artículos disponibles</h2></div><span className="count-label">{filteredItems.length} de {data.items.length} referencias</span></div>
        <div className="inventory-filters" aria-label="Filtrar inventario">
          <label>Marca<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Todas las marcas</option>{filterOptions("brand").map((brand) => <option key={brand}>{brand}</option>)}</select></label>
          <label>Tipo de juguete<select value={filters.toy_type} onChange={(event) => setFilters({ ...filters, toy_type: event.target.value })}><option value="">Todos los tipos</option>{filterOptions("toy_type").map((toyType) => <option key={toyType}>{toyType}</option>)}</select></label>
          <label>Edad recomendada<select value={filters.age} onChange={(event) => setFilters({ ...filters, age: event.target.value })}><option value="">Todas las edades</option>{filterOptions("age").map((age) => <option key={age}>{age}</option>)}</select></label>
        </div>
        {loading ? <p className="empty-state">Cargando inventario...</p> : filteredItems.length === 0 ? <p className="empty-state">{data.items.length ? "No hay artículos que coincidan con los filtros." : "Todavía no hay artículos registrados."}</p> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Marca</th><th>Tipo</th><th>Edad</th><th>Observaciones</th><th>Condición</th><th>Existencias</th></tr></thead><tbody>
            {filteredItems.map((item) => <tr key={item.id}>
              <td><div className="item-cell">{item.image_url ? <img src={item.image_url} alt={item.description} /> : <span className="item-placeholder"><ImageIcon size={18} /></span>}<span>{item.description}</span></div></td>
              <td>{item.brand || "—"}</td><td>{item.toy_type || "—"}</td><td>{item.age || "—"}</td><td className="table-notes">{item.observations || "—"}</td>
              <td><span className={`tag ${conditionClass[item.condition] || "tag-blue"}`}>{item.condition}</span></td>
              <td><span className={item.quantity < 5 ? "quantity-low" : "quantity-value"}>{item.quantity}</span><span className="unit-label"> unidades</span></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="data-section exit-section">
        <div className="section-heading"><div><p className="eyebrow">TRAZABILIDAD</p><h2>Últimas salidas</h2></div><span className="count-label">{data.exits.length} movimientos</span></div>
        {loading ? <p className="empty-state">Cargando movimientos...</p> : data.exits.length === 0 ? <p className="empty-state">Las salidas registradas aparecerán aquí.</p> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Destino</th><th>Fecha</th><th>Cantidad</th><th>Observaciones</th><th>Registrado por</th><th>Planilla</th></tr></thead><tbody>
            {data.exits.map((entry) => <tr key={entry.id}><td className="table-primary">{entry.item_description}</td><td>{entry.destination}</td><td>{entry.exit_date}</td><td><span className="exit-amount">-{entry.quantity}</span></td><td className="table-notes">{entry.observations || "—"}</td><td>{entry.created_by}</td><td><button className="print-button" type="button" onClick={() => setPrintExit(entry)} aria-label={`Imprimir planilla de salida de ${entry.item_description}`}><Printer size={15} /> Imprimir</button></td></tr>)}
          </tbody></table></div>
        )}
      </section>
      {printExit && <section className="print-sheet">
        <h1>Planilla de entrega de juguetes</h1>
        <p className="print-date">Fecha: {new Date(`${printExit.exit_date}T00:00:00`).toLocaleDateString("es")}</p>
        <table>
          <thead><tr><th>N.º</th><th>Descripción</th><th>Cantidad</th><th>Destino</th><th>Observación</th></tr></thead>
          <tbody><tr>
            <td>1</td>
            <td>{[printExit.item_description, printExit.item_brand, printExit.item_type, printExit.item_age].filter(Boolean).join(" · ")}</td>
            <td>{printExit.quantity}</td>
            <td>{printExit.destination}</td>
            <td>{printExit.observations || ""}</td>
          </tr></tbody>
        </table>
        <div className="print-signatures">
          <div><h2>Entregué conforme</h2><p>Nombre y apellido: __________________________________</p><p>N.º de identificación: ______________________________</p><p>Teléfono: __________________________________________</p><div className="signature-line">Firma</div></div>
          <div><h2>Recibí conforme</h2><p>Nombre y apellido: __________________________________</p><p>N.º de identificación: ______________________________</p><div className="signature-line">Firma</div></div>
        </div>
      </section>}
    </main>
  );
}