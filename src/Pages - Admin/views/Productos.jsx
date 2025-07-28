import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import {
  Menu, Plus, Search, Edit3, Save, X, Box, DollarSign, CheckCircle2, XCircle,
  RefreshCw
} from "lucide-react";
import "./Producto.css";

// Icono de estatus
const EstatusIcon = ({ estatus }) =>
  estatus === "S" ? (
    <CheckCircle2 size={18} color="#237a3c" style={{ marginRight: 4 }} />
  ) : estatus === "N" ? (
    <XCircle size={18} color="#b71c1c" style={{ marginRight: 4 }} />
  ) : (
    <Box size={18} style={{ marginRight: 4, color: "#aaa" }} />
  );

// Modal reutilizable
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="productos-modal-overlay">
      <div className="productos-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              fontWeight: "bold",
              cursor: "pointer",
              color: "#333",
              marginLeft: 10
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
}

// Card de producto
// Card de producto
function ProductoCard({ p, onEditar }) {
  return (
    <div className="producto-card" tabIndex={0}>
      <div className="producto-card-top">
        <span className="producto-id">{p.idproducto}</span>
        <span className={`producto-status ${p.estatus === "S" ? "activo" : p.estatus === "N" ? "inactivo" : "eliminado"}`}>
          <EstatusIcon estatus={p.estatus} />
          {p.estatus === "S" ? "Activo" : p.estatus === "N" ? "Inactivo" : "Eliminado"}
        </span>
      </div>
      <div className="producto-card-main">
        <div className="producto-titulo">{p.descripcion}</div>
        <div className="producto-precio">
          <DollarSign size={16} />
          {p.precio1 && p.precio1.Valid ? p.precio1.Float64.toFixed(2) : "--"}
        </div>
        {"precio_final" in p && (
          <div className="producto-precio-final">
            <small>Precio final : </small>
            <b>
              <DollarSign size={13} style={{marginRight: 2}} />
              {typeof p.precio_final === "number"
                ? p.precio_final.toFixed(2)
                : "--"}
            </b>
          </div>
        )}
      </div>
      <div className="producto-card-bottom">
        <div className="producto-empresa">
          Empresa: {p.nombre_empresa && p.nombre_empresa.Valid ? p.nombre_empresa.String : ""}
        </div>
        <button className="btn-editar" onClick={onEditar}>
          <Edit3 size={14} /> Editar
        </button>
      </div>
    </div>
  );
}

const IDEMPRESA_DEFAULT = 39;

// Función para checar si el usuario es admin
function esAdmin() {
  try {
    const adminObj = JSON.parse(localStorage.getItem("admin") || "{}");
    return (adminObj.tipo_usuario || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

export default function Productos() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [estatus, setEstatus] = useState("S");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(() => {
    const obj = { descripcion: "", estatus: "S", idiva: "" };
    for (let i = 1; i <= 25; i++) obj[`precio${i}`] = "";
    return obj;
  });
  const [error, setError] = useState("");
  const [permisoError, setPermisoError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);

  // IVAs válidos en la empresa (no usados porque campo IVA está removido)
  // const [ivas, setIvas] = useState([]);
  // useEffect(() => {
  //   fetch("http://localhost:8080/api/impuestos?empresa=" + IDEMPRESA_DEFAULT)
  //     .then(res => res.json())
  //     .then(data => setIvas(Array.isArray(data) ? data : []))
  //     .catch(() => setIvas([]));
  // }, [modalOpen]);

  useEffect(() => {
    setLoading(true);
    fetch(`https://logica-tiendaenlina.onrender.com/api/productos/estatus?estatus=${estatus}&page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        setProductos(data.productos || []);
        setTotal(data.total || 0);
      })
      .catch(() => setProductos([]))
      .finally(() => setLoading(false));
  }, [estatus, page, limit]);

  const filtrados = busqueda
    ? productos.filter(p =>
        (p.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(p.idproducto).includes(busqueda)
      )
    : productos;

  const totalPages = Math.ceil(total / limit);

  const openAddModal = () => {
    setPermisoError(""); // Limpia error anterior
    if (!esAdmin()) {
      setPermisoError("Permisos insuficientes: solo un administrador puede agregar productos.");
      return;
    }
    setEditMode(false);
    const obj = { descripcion: "", estatus: "S", idiva: "" };
    for (let i = 1; i <= 25; i++) obj[`precio${i}`] = "";
    setForm(obj);
    setCurrent(null);
    setError("");
    setModalOpen(true);
  };
  const openEditModal = (p) => {
    setPermisoError(""); // Limpia error anterior
    if (!esAdmin()) {
      setPermisoError("Permisos insuficientes: solo un administrador puede editar productos.");
      return;
    }
    setEditMode(true);
    setCurrent(p.idproducto);
    const obj = {
      descripcion: p.descripcion,
      estatus: p.estatus,
      idiva: p.idiva && p.idiva.Valid ? String(p.idiva.Int64) : ""
    };
    for (let i = 1; i <= 25; i++) {
      obj[`precio${i}`] = p[`precio${i}`] && p[`precio${i}`].Valid ? p[`precio${i}`].Float64 : "";
    }
    setForm(obj);
    setError("");
    setModalOpen(true);
  };
  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.descripcion) {
      setError("La descripción es obligatoria");
      return;
    }
    const payload = {
      idempresa: IDEMPRESA_DEFAULT,
      descripcion: form.descripcion,
      estatus: form.estatus,
      idiva: form.idiva ? Number(form.idiva) : undefined,
      ...Object.fromEntries(
        Array.from({length: 25}, (_, i) => {
          const key = `precio${i+1}`;
          return [key, form[key] ? Number(form[key]) : undefined];
        })
      )
    };
    let url = "https://logica-tiendaenlina.onrender.com/api/productos";
    let method = "POST";
    if (editMode && current) {
      url = `https://logica-tiendaenlina.onrender.com/api/productos/${current}`;
      method = "PUT";
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError("Error al guardar producto");
      return;
    }
    setModalOpen(false);
    setTimeout(() => setPage(1), 100);
  };

  const toggleSidebar = () => setSidebarOpen(open => !open);
  const handleOverlayClick = () => setSidebarOpen(false);

  return (
    <div className="ha-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleOverlayClick={handleOverlayClick}
      />
      
      <div className="ha-main-content">
        {/* Header */}
        <header className="productos-header">
          <div className="productos-header-left">
            <button onClick={toggleSidebar} className="ha-menu-button">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="productos-title">
                <Box size={20} /> 
                Gestión de Productos
              </h1>
              <p className="productos-subtitle">
                Administra y consulta el catálogo de productos
              </p>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="productos-filtros-wrapper">
          <div className="productos-filtros">
            <div className="filtro-busqueda">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o ID de producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            
            <select
              value={estatus}
              onChange={e => {
                setEstatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="S">Activos</option>
              <option value="N">Inactivos</option>
              <option value="E">Eliminados</option>
            </select>
            
            <button className="btn-primario" onClick={openAddModal}>
              <Plus size={18} style={{marginRight: 8}} />
              Agregar Producto
            </button>
          </div>
        </div>

        {/* Mensaje de error de permisos */}
        {permisoError && (
          <div className="productos-error" style={{marginBottom:20}}>{permisoError}</div>
        )}

        {/* Grid de productos */}
        <div className="tabla-pedidos-container">
          {loading ? (
            <div className="cargando-container">
              <RefreshCw className="spinning" size={32} />
              <span>Cargando productos...</span>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="sin-resultados">
              <XCircle size={48} />
              <h3>No hay productos</h3>
              <p>No se encontraron productos con los filtros actuales.</p>
            </div>
          ) : (
            filtrados.map((p) => (
              <div key={p.idproducto} className="pedido-card-wrapper">
                <ProductoCard p={p} onEditar={() => openEditModal(p)} />
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 10 }}>
            Total de productos: <strong>{total}</strong>
          </div>
          
          {totalPages > 1 && (
            <div className="productos-paginacion">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editMode ? "Editar Producto" : "Agregar Nuevo Producto"}
        >
          <form className="productos-formulario" onSubmit={handleSubmit}>
            <div className="campo">
              <label>Empresa</label>
              <input
                value={
                  editMode
                    ? productos.find(p => p.idproducto === current)?.nombre_empresa?.String || "Empresa principal"
                    : "Empresa principal"
                }
                readOnly
                disabled
                style={{ background: "#f3f3f3", color: "#888" }}
              />
            </div>
            <div className="campo">
              <label>Descripción *</label>
              <input
                name="descripcion"
                value={form.descripcion}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="campo">
              <label>Estatus *</label>
              <select
                name="estatus"
                value={form.estatus}
                onChange={handleFormChange}
                required
              >
                <option value="S">Activo</option>
                <option value="N">Inactivo</option>
                <option value="E">Eliminado</option>
              </select>
            </div>
            {/* Campo IVA removido, no aparece ni en edición ni en creación */}
            <div className="campo">
              <label>Listas de precios</label>
              <div className="precios-grid">
                {Array.from({length: 25}, (_, i) => (
                  <div className="precio-input-item" key={`precio${i+1}`}>
                    <span className="precio-label">{`L${i+1}`}</span>
                    <input
                      name={`precio${i+1}`}
                      type="number"
                      min={0}
                      step=".01"
                      value={form[`precio${i+1}`]}
                      onChange={handleFormChange}
                    />
                  </div>
                ))}
              </div>
            </div>
            {error && <div className="productos-error">{error}</div>}
            <div className="campo-accion">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primario">
                {editMode ? <Save size={16} style={{marginRight: 6}} /> : <Plus size={16} style={{marginRight: 6}} />}
                {editMode ? "Guardar Cambios" : "Agregar Producto"}
              </button>
            </div>
          </form>
        </Modal>
        
        {sidebarOpen && <div className="ha-overlay" onClick={handleOverlayClick}></div>}
      </div>
    </div>
  );
}