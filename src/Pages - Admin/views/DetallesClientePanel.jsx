import React from "react";
import { Mail, Phone, Store, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Iniciales grandes para detalle
function InitialsLogo({ nombre }) {
  const getInitials = (nombreTexto) => {
    if (!nombreTexto) return "";
    const palabras = nombreTexto.trim().split(" ");
    if (palabras.length === 1) return palabras[0][0].toUpperCase();
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  };
  return (
    <div className="cliente-modal-initials" title={nombre}>
      {getInitials(nombre)}
    </div>
  );
}

export default function DetallesClientePanel({ cliente, onClose }) {
  if (!cliente) return null;
  const usuario = cliente.usuario || {};
  const tienda = cliente.tienda || null;
  const statusColor = (estatus) =>
    estatus === "activo"
      ? "cliente-modal-status"
      : "cliente-modal-status inactiva";

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
        <button
          className="modal-close"
          style={{ top: 22, right: 22, color: "var(--color-primary)" }}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={30} />
        </button>
        <div className="cliente-modal-header">
          <InitialsLogo nombre={usuario.nombre_completo || "N/A"} />
          <div>
            <div className="cliente-modal-nombre">
              {usuario.nombre_completo || "N/A"}
              {usuario.estatus && (
                <span className={statusColor(usuario.estatus)} style={{ marginLeft: 12 }}>
                  {usuario.estatus}
                </span>
              )}
            </div>
            <div style={{ marginTop: 5, fontSize: 15 }}>
              <Mail size={17} style={{ marginRight: 5, verticalAlign: "middle" }} />
              <span style={{ color: "white", opacity: 0.92 }}>{usuario.correo || "N/A"}</span>
              {usuario.telefono && (
                <>
                  <span style={{ margin: "0 12px" }}>|</span>
                  <Phone size={16} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  <span style={{ color: "white", opacity: 0.92 }}>{usuario.telefono}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="cliente-modal-section">
          <div className="cliente-modal-card">
            <div className="cliente-modal-row">
              <span className="cliente-modal-label"><Mail size={16} />Correo:</span>
              <span className="cliente-modal-value">{usuario.correo || "N/A"}</span>
            </div>
            <div className="cliente-modal-row">
              <span className="cliente-modal-label"><Phone size={16} />Teléfono:</span>
              <span className="cliente-modal-value">{usuario.telefono || "N/A"}</span>
            </div>
            <div className="cliente-modal-row">
              <span className="cliente-modal-label">Estado:</span>
              <span className="cliente-modal-value">
                <span className={statusColor(usuario.estatus)}>
                  {usuario.estatus || "N/A"}
                </span>
              </span>
            </div>
          </div>
          {tienda ? (
            <div>
              <div className="cliente-modal-section-title">
                <Store size={18} /> Datos de la Tienda
              </div>
              <div className="cliente-modal-card">
                <div className="cliente-modal-row">
                  <span className="cliente-modal-label">Nombre:</span>
                  <span className="cliente-modal-value">{tienda.nombre_tienda || "N/A"}</span>
                </div>
                <div className="cliente-modal-row">
                  <span className="cliente-modal-label">Dirección:</span>
                  <span className="cliente-modal-value">
                    {[
                      tienda.direccion,
                      tienda.colonia,
                      tienda.ciudad,
                      tienda.estado,
                      tienda.codigo_postal,
                      tienda.pais
                    ].filter(Boolean).join(", ") || "N/A"}
                  </span>
                </div>
                <div className="cliente-modal-row">
                  <span className="cliente-modal-label">Tipo:</span>
                  <span className="cliente-modal-value">{tienda.tipo_tienda || "N/A"}</span>
                </div>
                <div className="cliente-modal-row">
                  <span className="cliente-modal-label">Estado:</span>
                  <span className="cliente-modal-value">
                    <span className={statusColor(tienda.estatus)}>
                      {tienda.estatus || "N/A"}
                    </span>
                  </span>
                </div>
              </div>
              {(tienda.latitud && tienda.longitud) || (tienda.latitud_ubic && tienda.longitud_ubic) ? (
                <div className="cliente-modal-mapa">
                  <MapContainer
                    center={[
                      tienda.latitud || tienda.latitud_ubic,
                      tienda.longitud || tienda.longitud_ubic
                    ]}
                    zoom={16}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[
                      tienda.latitud || tienda.latitud_ubic,
                      tienda.longitud || tienda.longitud_ubic
                    ]}>
                      <Popup>
                        {tienda.nombre_tienda || "Tienda"}<br />
                        {[
                          tienda.direccion,
                          tienda.colonia,
                          tienda.ciudad,
                          tienda.estado,
                          tienda.codigo_postal,
                          tienda.pais
                        ].filter(Boolean).join(", ")}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "28px 0",
              fontStyle: "italic"
            }}>
              Este cliente no tiene tienda asociada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}