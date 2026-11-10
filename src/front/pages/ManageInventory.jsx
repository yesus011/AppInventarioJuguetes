import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const emptyItem = { description: "", brand: "", toy_type: "", age: "", observations: "", quantity: "", image_url: "", condition: "Nuevo" };

export function ManageInventory() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState(emptyItem);
  const [exit, setExit] = useState({ item_id: "", destination: "", date: new Date().toISOString().slice(0, 10), quantity: "", observations: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refreshItems() {
    const result = await apiRequest("/inventory", { token });
    setItems(result.items);
  }

  useEffect(() => {
    refreshItems().catch((requestError) => setError(requestError.message));
  }, [token]);

  async function handleAddItem(event) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/inventory", { token, method: "POST", body: JSON.stringify({ ...newItem, quantity: Number(newItem.quantity) }) });
      setNewItem(emptyItem);
      setNotice("Artículo agregado al inventario.");
      await refreshItems();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function adjust(item, delta) {
    setError("");
    try {
      await apiRequest(`/inventory/${item.id}/adjust`, { token, method: "POST", body: JSON.stringify({ delta }) });
      await refreshItems();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleExit(event) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/inventory/exits", {
        token,
        method: "POST",
        body: JSON.stringify({ ...exit, item_id: Number(exit.item_id), quantity: Number(exit.quantity) }),
      });
      setExit({ ...exit, destination: "", quantity: "", observations: "" });
      setNotice("Salida registrada y descontada del stock.");
      await refreshItems();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="content-wrap">
      <div className="page-heading"><div><p className="eyebrow">OPERACIONES / MOVIMIENTOS</p><h1>Gestionar inventario</h1><p className="muted">Entradas, ajustes y salidas con actualización de existencias.</p></div></div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {notice && <p className="notice notice-success" role="status">{notice}</p>}
      <div className="manage-grid">
        <section className="form-panel">
          <div className="section-heading"><div><p className="eyebrow">NUEVA REFERENCIA</p><h2>Agregar artículo</h2></div><span className="panel-icon"><Plus size={19} /></span></div>
          <form className="form-stack" onSubmit={handleAddItem}>
            <label>Descripción<input required maxLength={200} value={newItem.description} onChange={(event) => setNewItem({ ...newItem, description: event.target.value })} /></label>
            <div className="form-row"><label>Marca<input maxLength={100} value={newItem.brand} onChange={(event) => setNewItem({ ...newItem, brand: event.target.value })} /></label><label>Tipo de juguete<input maxLength={100} value={newItem.toy_type} onChange={(event) => setNewItem({ ...newItem, toy_type: event.target.value })} /></label></div>
            <div className="form-row"><label>Edad recomendada<input maxLength={50} placeholder="Ej. 3-5 años" value={newItem.age} onChange={(event) => setNewItem({ ...newItem, age: event.target.value })} /></label><label>Condición<select value={newItem.condition} onChange={(event) => setNewItem({ ...newItem, condition: event.target.value })}><option>Nuevo</option><option>Usado</option><option>Dañado</option></select></label></div>
            <label>Observaciones<textarea maxLength={2000} rows="3" value={newItem.observations} onChange={(event) => setNewItem({ ...newItem, observations: event.target.value })} /></label>
            <div className="form-row"><label>Cantidad inicial<input type="number" min="0" step="1" required value={newItem.quantity} onChange={(event) => setNewItem({ ...newItem, quantity: event.target.value })} /></label><label>URL de foto <span className="optional-label">(opcional)</span><input type="url" maxLength={1000} placeholder="https://..." value={newItem.image_url} onChange={(event) => setNewItem({ ...newItem, image_url: event.target.value })} /></label></div>
            <button className="button button-dark button-wide">Agregar artículo<Plus size={16} /></button>
          </form>
        </section>

        <section className="form-panel exit-form-panel">
          <div className="section-heading"><div><p className="eyebrow">DESCONTAR EXISTENCIAS</p><h2>Registrar salida</h2></div><span className="panel-icon panel-icon-lime"><ArrowDownToLine size={19} /></span></div>
          <form className="form-stack" onSubmit={handleExit}>
            <label>Artículo<select required value={exit.item_id} onChange={(event) => setExit({ ...exit, item_id: event.target.value })}><option value="">Selecciona un artículo</option>{items.map((item) => <option key={item.id} value={item.id} disabled={item.quantity === 0}>{item.description} ({item.quantity} disponibles)</option>)}</select></label>
            <label>Destino<input required maxLength={200} placeholder="Área, sede o responsable" value={exit.destination} onChange={(event) => setExit({ ...exit, destination: event.target.value })} /></label>
            <div className="form-row"><label>Fecha de salida<input type="date" required value={exit.date} onChange={(event) => setExit({ ...exit, date: event.target.value })} /></label><label>Cantidad<input type="number" min="1" step="1" required value={exit.quantity} onChange={(event) => setExit({ ...exit, quantity: event.target.value })} /></label></div>
            <label>Observaciones<textarea maxLength={2000} rows="3" value={exit.observations} onChange={(event) => setExit({ ...exit, observations: event.target.value })} /></label>
            <button className="button button-lime button-wide" disabled={items.length === 0}>Confirmar salida<ArrowDownToLine size={16} /></button>
          </form>
        </section>
      </div>

      <section className="data-section stock-adjust-section">
        <div className="section-heading"><div><p className="eyebrow">AJUSTE DIRECTO</p><h2>Existencias actuales</h2></div><span className="count-label">{items.length} referencias</span></div>
        {items.length === 0 ? <p className="empty-state">Agrega un artículo para comenzar.</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Artículo</th><th>Marca</th><th>Tipo</th><th>Edad</th><th>Condición</th><th>Disponible</th><th>Ajustar</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id}><td className="table-primary">{item.description}</td><td>{item.brand || "—"}</td><td>{item.toy_type || "—"}</td><td>{item.age || "—"}</td><td>{item.condition}</td><td>{item.quantity}</td><td><div className="adjust-controls"><button className="adjust-button" title="Quitar una unidad" aria-label={`Quitar una unidad de ${item.description}`} disabled={item.quantity === 0} onClick={() => adjust(item, -1)}><ArrowDown size={16} /></button><button className="adjust-button" title="Agregar una unidad" aria-label={`Agregar una unidad de ${item.description}`} onClick={() => adjust(item, 1)}><ArrowUp size={16} /></button></div></td></tr>)}
        </tbody></table></div>}
      </section>
    </main>
  );
}