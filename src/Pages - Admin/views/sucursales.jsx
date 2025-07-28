import React, { useState, useEffect } from "react";
import axios from "axios";
import "./sucursales.css";
import Sidebar from "../Sidebar";
import { Store, MapPin, Edit3, CheckCircle2, XCircle } from "lucide-react";

// Utilidad para saber si es admin
function esAdmin() {
  try {
    const adminObj = JSON.parse(localStorage.getItem("admin") || "{}");
    return (adminObj.tipo_usuario || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

// Modal genérico mejorado (sin botón de cerrar arriba, solo clic fuera)
function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop" style={{ zIndex: 1050 }} onClick={onClose}>
      <div
        className="modal d-block"
        tabIndex="-1"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card visual para sucursal
function SucursalCard({
  sucursal,
  onVerDetalle,
  editingId,
  newListaPrecios,
  setNewListaPrecios,
  editLoading,
  saveListaPrecios,
  cancelEditing,
  startEditing,
  listaError,
  isAdminUser,
  setPermisoError,
}) {
  // Validación para lista de precios
  const handleInputChange = (e) => {
    let value = e.target.value;
    if (/^\d*$/.test(value)) {
      const num = Number(value);
      if (num === 0) setNewListaPrecios("");
      else if (num > 25) setNewListaPrecios("25");
      else setNewListaPrecios(value);
    }
  };

  const handleEditClick = () => {
    setPermisoError(""); // Limpia mensaje anterior
    if (!isAdminUser) {
      setPermisoError("Permisos insuficientes: solo un administrador puede editar la lista de precios de la sucursal.");
      return;
    }
    startEditing(sucursal.idsucursal, sucursal.lista_precios);
  };

  return (
    <div className="sucursal-card">
      <div className="sucursal-card-header">
        <div className="sucursal-card-icon">
          <Store size={28} />
        </div>
        <div className="sucursal-card-title">
          <button className="card-title-btn" onClick={() => onVerDetalle(sucursal)}>
            {sucursal.sucursal}
          </button>
        </div>
        <div className={`sucursal-status sucursal-status-${sucursal.estatus}`}>
          {sucursal.estatus === "S" ? "Activo" : sucursal.estatus === "N" ? "Inactivo" : "Eliminado"}
        </div>
      </div>
      <div className="sucursal-card-body">
        <div className="sucursal-card-row">
          <MapPin size={16} style={{ marginRight: 4 }} />
          <span className="sucursal-card-label">Dirección:</span>
          <span className="sucursal-card-value">{sucursal.direccion}</span>
        </div>
        <div className="sucursal-card-row">
          <span className="sucursal-card-label">Ciudad:</span>
          <span className="sucursal-card-value">{sucursal.ciudad}</span>
        </div>
        <div className="sucursal-card-row">
          <span className="sucursal-card-label">Colonia:</span>
          <span className="sucursal-card-value">{sucursal.colonia}</span>
        </div>
        <div className="sucursal-card-row">
          <span className="sucursal-card-label">CP:</span>
          <span className="sucursal-card-value">{sucursal.cp}</span>
        </div>
        <div className="sucursal-card-row">
          <span className="sucursal-card-label">Tipo:</span>
          <span className="sucursal-card-value">{sucursal.tipo_objeto}</span>
        </div>
        <div className="sucursal-card-row">
          <span className="sucursal-card-label">Radio:</span>
          <span className="sucursal-card-value">{sucursal.radio}</span>
        </div>
        <div className="sucursal-card-row">
          <span className="sucursal-card-label">Lista de Precios:</span>
          {editingId === sucursal.idsucursal ? (
            <div className="card-listaprecio-edit">
              <input
                type="number"
                min={1}
                max={25}
                value={newListaPrecios}
                onChange={handleInputChange}
                style={{ width: 60, marginLeft: 8 }}
                disabled={editLoading}
                className="card-listaprecio-input"
                autoFocus
              />
              <button
                className="card-btn card-btn-confirm"
                onClick={() => saveListaPrecios(sucursal.idsucursal)}
                disabled={
                  editLoading ||
                  !newListaPrecios ||
                  newListaPrecios < 1 ||
                  newListaPrecios > 25
                }
                title="Guardar"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                className="card-btn card-btn-cancel"
                onClick={cancelEditing}
                disabled={editLoading}
                title="Cancelar"
              >
                <XCircle size={16} />
              </button>
              {listaError && <span className="card-listaprecio-error">{listaError}</span>}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", marginLeft: 8 }}>
              <span className="sucursal-card-value">{sucursal.lista_precios}</span>
              <button
                className={`card-btn card-btn-edit${!isAdminUser ? " card-btn-edit-disabled" : ""}`}
                onClick={handleEditClick}
                title={isAdminUser ? "Editar lista de precios" : "Solo un administrador puede editar"}
                disabled={!isAdminUser}
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const API_BASE = "https://logica-tiendaenlina.onrender.com/api/sucursales";

function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edición de lista de precios
  const [editingId, setEditingId] = useState(null);
  const [newListaPrecios, setNewListaPrecios] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [listaError, setListaError] = useState("");
  const [permisoError, setPermisoError] = useState("");

  // Modal para detalle sucursal
  const [showModal, setShowModal] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Detecta si es admin (solo se evalúa al renderizar)
  const [isAdminUser, setIsAdminUser] = useState(esAdmin());

  useEffect(() => {
    fetchSucursales();
    setIsAdminUser(esAdmin());
  }, []);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_BASE);
      setSucursales(data);
      setError(null);
    } catch (err) {
      setError("Error cargando sucursales");
    }
    setLoading(false);
  };

  const startEditing = (id, currentLista) => {
    setEditingId(id);
    setNewListaPrecios(currentLista);
    setListaError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewListaPrecios("");
    setListaError("");
  };

  const saveListaPrecios = async (id) => {
    if (!newListaPrecios || newListaPrecios < 1 || newListaPrecios > 25) {
      setListaError("El valor debe ser entre 1 y 25");
      return;
    }
    setEditLoading(true);
    setListaError("");
    try {
      // Leer tipo_usuario desde localStorage
      const adminObj = JSON.parse(localStorage.getItem("admin") || "{}");
      const tipoUsuario = (adminObj.tipo_usuario || "").toLowerCase();

      if (tipoUsuario !== "admin") {
        setListaError("Permisos insuficientes: solo un administrador puede cambiar la lista de precios");
        setEditLoading(false);
        return;
      }

      await axios.put(
        `${API_BASE}/${id}/lista-precios`,
        { lista_precios: Number(newListaPrecios) },
        {
          headers: {
            "X-Tipo-Usuario": tipoUsuario,
            "Content-Type": "application/json",
          },
        }
      );
      setEditingId(null);
      setNewListaPrecios("");
      fetchSucursales();
    } catch (e) {
      if (e.response && e.response.status === 403) {
        setListaError("Permisos insuficientes: solo un administrador puede cambiar la lista de precios");
      } else {
        setListaError("Error actualizando lista de precios");
      }
    }
    setEditLoading(false);
  };

  // Modal Detalle Sucursal
  const openModal = async (sucursal) => {
    setDetalleLoading(true);
    setShowModal(true);
    try {
      const { data } = await axios.get(`${API_BASE}/${sucursal.idsucursal}`);
      setSelectedSucursal(data);
    } catch (erro) {
      setSelectedSucursal(null);
    }
    setDetalleLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSucursal(null);
  };

  return (
    <div className="sucursales-layout">
      <Sidebar />
      <div className="sucursales-main-content">
        <h2>Sucursales</h2>
        {permisoError && (
          <div className="sucursales-error" style={{ color: "red", marginBottom: 12 }}>
            {permisoError}
          </div>
        )}
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && (
          <div className="sucursales-cards-grid">
            {sucursales.length === 0 ? (
              <div className="sucursales-empty">No hay sucursales registradas.</div>
            ) : (
              sucursales.map((sucursal) => (
                <SucursalCard
                  key={sucursal.idsucursal}
                  sucursal={sucursal}
                  onVerDetalle={openModal}
                  editingId={editingId}
                  newListaPrecios={newListaPrecios}
                  setNewListaPrecios={setNewListaPrecios}
                  editLoading={editLoading}
                  saveListaPrecios={saveListaPrecios}
                  cancelEditing={cancelEditing}
                  startEditing={startEditing}
                  listaError={listaError}
                  isAdminUser={isAdminUser}
                  setPermisoError={setPermisoError}
                />
              ))
            )}
          </div>
        )}

        {/* Modal de detalle de sucursal */}
        <Modal show={showModal} onClose={closeModal} title="Detalle de Sucursal">
          {detalleLoading ? (
            <p>Cargando detalle de sucursal...</p>
          ) : selectedSucursal ? (
            <div>
              <dl className="row">
                <dt className="col-sm-4">ID</dt>
                <dd className="col-sm-8">{selectedSucursal.idsucursal}</dd>

                <dt className="col-sm-4">Sucursal</dt>
                <dd className="col-sm-8">{selectedSucursal.sucursal}</dd>

                <dt className="col-sm-4">Dirección</dt>
                <dd className="col-sm-8">{selectedSucursal.direccion}</dd>

                <dt className="col-sm-4">Ciudad</dt>
                <dd className="col-sm-8">{selectedSucursal.ciudad}</dd>

                <dt className="col-sm-4">Colonia</dt>
                <dd className="col-sm-8">{selectedSucursal.colonia}</dd>

                <dt className="col-sm-4">CP</dt>
                <dd className="col-sm-8">{selectedSucursal.cp}</dd>

                <dt className="col-sm-4">Estatus</dt>
                <dd className="col-sm-8">{selectedSucursal.estatus}</dd>

                <dt className="col-sm-4">Tipo de Objeto</dt>
                <dd className="col-sm-8">{selectedSucursal.tipo_objeto}</dd>

                <dt className="col-sm-4">Radio</dt>
                <dd className="col-sm-8">{selectedSucursal.radio}</dd>

                <dt className="col-sm-4">Lista de Precios</dt>
                <dd className="col-sm-8">{selectedSucursal.lista_precios}</dd>
              </dl>
            </div>
          ) : (
            <p>No se pudo cargar la sucursal.</p>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default Sucursales;