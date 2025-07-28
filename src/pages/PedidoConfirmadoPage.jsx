import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import styles from './PedidosPage.module.css';

// --- Leaflet/React-Leaflet for Mapa Modal ---
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Corrige iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const mesesAbrev = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const formatFecha = (fecha) => {
  // Formato: dd-MMM-yyyy hh:mm AM/PM (sin segundos)
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = mesesAbrev[d.getMonth()];
  const anio = d.getFullYear();
  let hora = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = hora >= 12 ? 'PM' : 'AM';
  hora = hora % 12;
  hora = hora ? hora : 12; // 0 => 12
  const horaStr = String(hora).padStart(2, '0');
  return `${dia}-${mes}-${anio} ${horaStr}:${min} ${ampm}`;
};

// Función para calcular el precio unitario con impuestos
function getPrecioUnitarioConImpuestos(detalle) {
  const precioBase = Number(detalle.precio_unitario || 0);
  const cantidad = Number(detalle.cantidad || 1);
  const iva = Number(detalle.importe_iva || 0);
  const ieps = Number(detalle.importe_ieps || 0);

  // Si la cantidad es 0 o no hay impuestos, retorna solo el precio base
  if (cantidad === 0 || (!iva && !ieps)) {
    return precioBase.toFixed(2);
  }

  const impuestosUnitarios = (iva + ieps) / cantidad;
  return (precioBase + impuestosUnitarios).toFixed(2);
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modalPedido, setModalPedido] = useState(null);
  const POR_PAGINA = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const usuarioStr = localStorage.getItem("usuario");
        let id_usuario = null;
        if (usuarioStr) {
          try {
            const usuario = JSON.parse(usuarioStr);
            id_usuario = usuario.id_usuario || usuario.IDUsuario;
          } catch {
            console.error();
          }
        }

        if (!id_usuario) {
          setPedidos([]);
          setLoading(false);
          return;
        }

        const response = await fetch(`https://logica-tiendaenlina.onrender.com/api/pedidos/usuario?id_usuario=${id_usuario}`);
        const data = await response.json();

        let pedidosData = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

        pedidosData = pedidosData.map(pedido => {
          if (pedido.detalles && !Array.isArray(pedido.detalles)) {
            try {
              if (typeof pedido.detalles === 'string') {
                pedido.detalles = JSON.parse(pedido.detalles);
              } else {
                pedido.detalles = [pedido.detalles];
              }
            } catch {
              pedido.detalles = [];
            }
          }
          if (!pedido.detalles) pedido.detalles = [];
          return pedido;
        });

        setPedidos(pedidosData);
      } catch {
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [navigate]);

  // Filtrado por estatus y búsqueda
  const pedidosFiltrados = pedidos.filter((pedidoObj) => {
    const { pedido, detalles } = pedidoObj;
    let coincideEstatus = true;
    let coincideBusqueda = true;

    if (filtroEstatus !== "todos") {
      const estatus = (pedido.estatus ?? pedido.Estatus ?? "").toLowerCase();
      coincideEstatus = estatus === filtroEstatus;
    }

    if (filtroBusqueda.trim()) {
      const search = filtroBusqueda.trim().toLowerCase();
      const enDetalles = detalles.some(det => (det.descripcion || '').toLowerCase().includes(search));
      const enEstatus = ((pedido.estatus ?? pedido.Estatus ?? "") + "").toLowerCase().includes(search);
      coincideBusqueda = enDetalles || enEstatus;
    }

    return coincideEstatus && coincideBusqueda;
  });

  // Paginación (el más reciente se muestra arriba, luego el historial paginado)
  const [nuevoPedido, ...historialPedidosTodos] = pedidosFiltrados;
  const totalPaginas = Math.ceil(historialPedidosTodos.length / POR_PAGINA);
  const historialPedidos = historialPedidosTodos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const opcionesEstatus = [
    { value: "todos", label: "Todos" },
    { value: "pendiente", label: "Pendiente" },
    { value: "pagado", label: "Pagado" },
    { value: "enviado", label: "Enviado" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" },
    { value: "procesando", label: "Procesando" },
  ];

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.h2}>
            <span role="img" aria-label="nuevo">📦</span> Mis Pedidos
          </h2>
          <button
            onClick={() => navigate('/')}
            className={styles.mdBtn}
            style={{ minWidth: 150, marginLeft: 16 }}
          >
            Volver al inicio
          </button>
        </div>

        <div className={styles.filtrosRow}>
          <div className={styles.filtroGrupo}>
            <label className={styles.filtroLabel}>Filtrar por estatus:</label>
            <select
              className={styles.filtroSelect}
              value={filtroEstatus}
              onChange={e => {
                setFiltroEstatus(e.target.value);
                setPagina(1);
              }}
            >
              {opcionesEstatus.map(opt => (
                <option value={opt.value} key={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.filtroGrupo}>
            <label className={styles.filtroLabel}>Buscar producto/estatus:</label>
            <input
              className={styles.filtroInput}
              type="text"
              placeholder="Ej: Pagado, etc."
              value={filtroBusqueda}
              onChange={e => {
                setFiltroBusqueda(e.target.value);
                setPagina(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <div>Cargando pedidos...</div>
          </div>
        ) : !pedidosFiltrados.length ? (
          <div className={styles.emptyState}>
            <h3>No hay pedidos registrados que coincidan con el filtro</h3>
          </div>
        ) : (
          <>
            {/* Modal de detalles */}
            {modalPedido &&
              <PedidoModal
                pedidoObj={modalPedido}
                onClose={() => setModalPedido(null)}
                formatFecha={formatFecha}
              />
            }

            {/* Nuevo pedido */}
            {nuevoPedido && (
              <div>
                <h3 className={styles.h3}>
                  <span role="img" aria-label="nuevo">✓</span> Pedido más reciente
                </h3>
                <PedidoCard
                  pedidoObj={nuevoPedido}
                  formatFecha={formatFecha}
                  isNuevo={true}
                  onShowDetails={() => setModalPedido(nuevoPedido)}
                />
              </div>
            )}

            {/* Historial */}
            {historialPedidos.length > 0 && (
              <div>
                <h4 className={styles.h4}>Historial de pedidos anteriores</h4>
                {historialPedidos.map((pedidoObj, idx) => (
                  <PedidoCard
                    key={idx}
                    pedidoObj={pedidoObj}
                    formatFecha={formatFecha}
                    isNuevo={false}
                    onShowDetails={() => setModalPedido(pedidoObj)}
                  />
                ))}
                {totalPaginas > 1 && (
                  <div className={styles.paginacion}>
                    <button
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className={styles.paginacionBtn}
                    >
                      ← Anterior
                    </button>
                    <span className={styles.paginacionInfo}>
                      Página {pagina} de {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                      disabled={pagina === totalPaginas}
                      className={styles.paginacionBtn}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

function PedidoCard({ pedidoObj, formatFecha, isNuevo, onShowDetails }) {
  if (!pedidoObj) return null;
  const { pedido, detalles } = pedidoObj;

  const fecha = pedido.fecha_creacion ?? pedido.FechaCreacion ?? pedido.fecha;
  const fechaEntrega = pedido.fecha_entrega ?? pedido.FechaEntrega ?? null;
  const total = pedido.total?.toFixed
    ? pedido.total.toFixed(2)
    : pedido.total ?? "0.00";
  const estatus = (pedido.estatus ?? pedido.Estatus ?? "pendiente").toLowerCase();

  const cardClass = isNuevo
    ? `${styles.materialCard} ${styles.nuevoPedido}`
    : styles.materialCard;

  const productosArray = Array.isArray(detalles) ? detalles :
    (typeof detalles === 'string' ? [{ descripcion: detalles, cantidad: 1, precio_unitario: total }] : []);

  const statusColors = {
    pendiente: "#f7ba2a",
    pagado: "#3da98a",
    enviado: "#357ef5",
    entregado: "#23be6a",
    cancelado: "#f55656",
  };

  return (
    <div className={cardClass}>
      <div className={styles.pedidoInfoRow}>
        <div className={styles.fechasContainer}>
          <span className={styles.pedidoFecha}>Fecha: {formatFecha(fecha)}</span>
          {fechaEntrega && (
            <span className={styles.fechaEntrega}>
              <span className={styles.entregaLabel}>Entrega estimada:</span> 
              {formatFecha(fechaEntrega)}
            </span>
          )}
        </div>
        <span className={styles.pedidoTotal}>Total: ${total}</span>
        <span
          className={styles.pedidoEstatus}
          style={{
            background: statusColors[estatus] + "22",
            color: statusColors[estatus] || "#2a2a2a"
          }}
        >
          {estatus.charAt(0).toUpperCase() + estatus.slice(1)}
        </span>
        <button
          className={styles.detallesBtn}
          onClick={onShowDetails}
          title="Ver detalles del pedido"
        >Ver detalles</button>
      </div>
      <div className={styles.pedidoContent}>
        <div className={styles.productosTitle}>Productos:</div>
        {productosArray && productosArray.length > 0 ? (
          <ul className={styles.productosList}>
            {productosArray.map((detalle, i) => (
              <li key={i} className={styles.pedidoItem}>
                <span className={styles.prodDesc}>{detalle.descripcion || 'Producto'}</span>
                <span className={styles.prodCant}>x{detalle.cantidad || 1}</span>
                <span className={styles.prodPrecio}>
                  ${getPrecioUnitarioConImpuestos(detalle)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div>No hay productos en este pedido.</div>
        )}
      </div>
    </div>
  );
}

// Modal para detalles y mapa
function PedidoModal({ pedidoObj, onClose, formatFecha }) {
  if (!pedidoObj) return null;
  const { pedido, detalles } = pedidoObj;
  const productosArray = Array.isArray(detalles) ? detalles : detalles ? [detalles] : [];
  const lat = pedido.latitud_entrega ?? (pedido.latitud_entrega === 0 ? 0 : null);
  const lng = pedido.longitud_entrega ?? (pedido.longitud_entrega === 0 ? 0 : null);
  const fechaEntrega = pedido.fecha_entrega ?? pedido.FechaEntrega ?? null;

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
      zIndex: 1000, background: "rgba(0,0,0,0.22)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className={styles.modalBox}>
        <button
          className={styles.cerrarBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >×</button>
        <h2 className={styles.modalTitle}>Detalles del pedido</h2>
        <div className={styles.modalSection}>
          <strong>Fecha de pedido:</strong> {formatFecha(pedido.fecha_creacion)}<br />
          {fechaEntrega && (
            <><strong>Fecha de entrega estimada:</strong> {formatFecha(fechaEntrega)}<br /></>
          )}
          <strong>Total:</strong> ${pedido.total?.toFixed ? pedido.total.toFixed(2) : pedido.total}
        </div>
        <div className={styles.modalSection}>
          <strong>Dirección:</strong> {pedido.direccion_entrega}, {pedido.colonia_entrega}, {pedido.cp_entrega}, {pedido.ciudad_entrega}, {pedido.estado_entrega}
        </div>
        <div className={styles.modalSection}>
          <strong>Productos:</strong>
          <ul className={styles.productosList}>
            {productosArray.length > 0 ? (
              productosArray.map((detalle, i) => (
                <li key={i} className={styles.pedidoItem}>
                  <span className={styles.prodDesc}>{detalle.descripcion || 'Producto'}</span>
                  <span className={styles.prodCant}>x{detalle.cantidad || 1}</span>
                  <span className={styles.prodPrecio}>
                    ${getPrecioUnitarioConImpuestos(detalle)}
                  </span>
                </li>
              ))
            ) : (
              <li>No hay productos en este pedido.</li>
            )}
          </ul>
        </div>
        {(lat && lng) ? (
          <div className={styles.modalSection}>
            <strong>Ubicación de entrega:</strong>
            <div style={{ height: 220, width: "100%", borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
              <MapContainer
                center={[lat, lng]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} />
              </MapContainer>
            </div>
          </div>
        ) : (
          <div className={styles.modalSection}>
            <strong>Ubicación de entrega:</strong> No disponible
          </div>
        )}
      </div>
    </div>
  );
}