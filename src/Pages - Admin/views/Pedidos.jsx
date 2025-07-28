import React, { useState, useEffect, useReducer, useCallback } from "react";
import Sidebar from "../Sidebar";
import {
  Menu, Search, Filter, Clock, Send, CheckCircle2, XCircle,
  Eye, AlertCircle, Download, RefreshCw
} from "lucide-react";
import "./Pedidos.css";

// ============ REDUCER PARA GESTIÓN DE ESTADO ============
const pedidosReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PEDIDOS':
      return { ...state, pedidos: action.payload, cargando: false };
    case 'SET_CARGANDO':
      return { ...state, cargando: action.payload };
    case 'UPDATE_PEDIDO':
      return {
        ...state,
        pedidos: state.pedidos.map(p =>
          p.pedido.id_pedido === action.payload.id_pedido
            ? { ...p, pedido: { ...p.pedido, ...action.payload.cambios } }
            : p
        )
      };
    case 'SET_PEDIDO_SELECCIONADO':
      return {
        ...state,
        pedidoSeleccionado: action.payload.pedido,
        detallesSeleccionado: action.payload.detalles
      };
    case 'CLEAR_SELECCION':
      return {
        ...state,
        pedidoSeleccionado: null,
        detallesSeleccionado: []
      };
    case 'UPDATE_DETALLES':
      return {
        ...state,
        detallesSeleccionado: action.payload
      };
    default:
      return state;
  }
};

// ============ HOOKS PERSONALIZADOS ============
const usePedidos = () => {
  const [state, dispatch] = useReducer(pedidosReducer, {
    pedidos: [],
    cargando: true,
    pedidoSeleccionado: null,
    detallesSeleccionado: []
  });

  const cargarPedidos = useCallback(async () => {
    dispatch({ type: 'SET_CARGANDO', payload: true });
    try {
      const response = await fetch("https://logica-tiendaenlina.onrender.com/api/pedidos");
      const data = await response.json();
      if (data?.data) {
        dispatch({ type: 'SET_PEDIDOS', payload: data.data });
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      dispatch({ type: 'SET_CARGANDO', payload: false });
    }
  }, []);

  const actualizarPedidoEnLista = useCallback((id_pedido, cambios) => {
    dispatch({ type: 'UPDATE_PEDIDO', payload: { id_pedido, cambios } });
  }, []);

  const seleccionarPedido = useCallback(async (id_pedido) => {
    try {
      const response = await fetch(`https://logica-tiendaenlina.onrender.com/api/pedidos/${id_pedido}`);
      const data = await response.json();
      if (data?.data) {
        dispatch({
          type: 'SET_PEDIDO_SELECCIONADO',
          payload: {
            pedido: data.data.pedido,
            detalles: data.data.detalles
          }
        });
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  }, []);

  const cerrarDetalle = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECCION' });
  }, []);

  return {
    ...state,
    cargarPedidos,
    actualizarPedidoEnLista,
    seleccionarPedido,
    cerrarDetalle,
    dispatch
  };
};

// ============ COMPONENTES DE UTILIDAD ============
const EstatusIcon = ({ estatus }) => {
  const iconos = {
    pendiente: <Clock size={16} color="#af8500" style={{ marginRight: 4 }} />,
    enviado: <Send size={16} color="#1565c0" style={{ marginRight: 4 }} />,
    completado: <CheckCircle2 size={16} color="#237a3c" style={{ marginRight: 4 }} />,
    cancelado: <XCircle size={16} color="#b71c1c" style={{ marginRight: 4 }} />
  };
  return iconos[estatus] || null;
};

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`toast toast-${tipo}`}>
      <span>{mensaje}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

const PedidoCard = ({ pedido, onSeleccionar }) => (
  <div className="pedido-card">
    <div className="pedido-card-header">
      <span className="pedido-id">#{pedido.id_pedido}</span>
      <span className={`pedido-status ${pedido.estatus}`}>
        <EstatusIcon estatus={pedido.estatus} />
        {pedido.estatus}
      </span>
    </div>
    <div className="pedido-card-body">
      <div>
        <span className="pedido-label">Fecha: </span>
        <span className="pedido-value">{pedido.fecha_creacion}</span>
      </div>
      <div>
        <span className="pedido-label">Usuario: </span>
        <span className="pedido-value">{pedido.nombre_usuario}</span>
      </div>
      <div>
        <span className="pedido-label">Sucursal: </span>
        <span className="pedido-value">{pedido.nombre_sucursal}</span>
      </div>
      <div>
        <span className="pedido-label">Total: </span>
        <span className="pedido-total">${pedido.total?.toFixed(2) ?? "0.00"}</span>
      </div>
    </div>
    <div className="pedido-card-actions">
      <button className="btn-ver-detalle" onClick={onSeleccionar}>
        <Eye size={16} />
        Ver Detalle
      </button>
    </div>
  </div>
);

// ============ COMPONENTE: DetallePedido SOLO VISUAL ============
const DetallePedido = ({
  pedido,
  detalles,
  onCerrar
}) => {
  const [seccionActiva, setSeccionActiva] = useState('general');

  // Cálculos en tiempo real
  const calcularTotales = () => {
    const subtotal = detalles.reduce((acc, d) => {
      const cantidad = Number(d.cantidad) || 0;
      const precio = Number(d.precio_unitario) || 0;
      return acc + (cantidad * precio);
    }, 0);

    const descuentoDetalles = detalles.reduce((acc, d) => {
      return acc + (Number(d.importe_descuento) || 0);
    }, 0);

    const iva = detalles.reduce((acc, d) => {
      return acc + (Number(d.importe_iva) || 0);
    }, 0);

    const ieps = detalles.reduce((acc, d) => {
      return acc + (Number(d.importe_ieps) || 0);
    }, 0);

    const descuentoGlobal = Number(pedido.descuento) || 0;
    const total = subtotal - descuentoDetalles - descuentoGlobal + iva + ieps;

    return { subtotal, descuentoDetalles, iva, ieps, descuentoGlobal, total: Math.max(0, total) };
  };

  const totales = calcularTotales();

  const renderSeccionGeneral = () => (
    <div className="seccion-general">
      <h3>Información General</h3>
      <div className="campos-generales">
        <div className="campo-grupo">
          <label>Estatus:</label>
          <span className={`estatus-badge ${pedido.estatus}`}>
            <EstatusIcon estatus={pedido.estatus} />
            {pedido.estatus}
          </span>
        </div>
        <div className="campo-grupo">
          <label>Usuario:</label>
          <span>{pedido.nombre_usuario}</span>
        </div>
        <div className="campo-grupo">
          <label>Sucursal:</label>
          <span>{pedido.nombre_sucursal}</span>
        </div>
        <div className="campo-grupo">
          <label>Dirección:</label>
          <span>{pedido.direccion_entrega}</span>
        </div>
      </div>
    </div>
  );

  const renderSeccionProductos = () => (
    <div className="seccion-productos">
      <h3>Productos</h3>
      <div className="tabla-productos-mejorada">
        {detalles.map((detalle) => (
          <div key={detalle.id_detalle} className="producto-item">
            <div className="producto-header">
              <span className="producto-descripcion">{detalle.descripcion}</span>
            </div>
            <div className="producto-totales">
              <span>Subtotal: ${(Number(detalle.cantidad) * Number(detalle.precio_unitario)).toFixed(2)}</span>
              <span>Total: ${(
                Number(detalle.cantidad) * Number(detalle.precio_unitario) -
                Number(detalle.importe_descuento || 0) +
                Number(detalle.importe_iva || 0) +
                Number(detalle.importe_ieps || 0)
              ).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSeccionTotales = () => (
    <div className="seccion-totales">
      <div className="resumen-totales">
        <div className="total-item">
          <span>Subtotal:</span>
          <span>${totales.subtotal.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span>Descuentos:</span>
          <span>-${(totales.descuentoDetalles + totales.descuentoGlobal).toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span>IVA:</span>
          <span>${totales.iva.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span>IEPS:</span>
          <span>${totales.ieps.toFixed(2)}</span>
        </div>
        <div className="total-item total-final">
          <span>Total Final:</span>
          <span>${totales.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="detalle-pedido-modal-mejorado">
      <div className="detalle-pedido-content-mejorado">
        <div className="detalle-header">
          <h2>Pedido #{pedido.id_pedido}</h2>
          <div className="header-actions">
            <button onClick={onCerrar} className="btn-cerrar">
              Cerrar
            </button>
          </div>
        </div>
        <div className="detalle-navegacion">
          <button
            className={seccionActiva === 'general' ? 'activo' : ''}
            onClick={() => setSeccionActiva('general')}
          >
            General
          </button>
          <button
            className={seccionActiva === 'productos' ? 'activo' : ''}
            onClick={() => setSeccionActiva('productos')}
          >
            Productos ({detalles.length})
          </button>
          <button
            className={seccionActiva === 'totales' ? 'activo' : ''}
            onClick={() => setSeccionActiva('totales')}
          >
            Totales
          </button>
        </div>
        <div className="detalle-contenido">
          {seccionActiva === 'general' && renderSeccionGeneral()}
          {seccionActiva === 'productos' && renderSeccionProductos()}
          {seccionActiva === 'totales' && renderSeccionTotales()}
        </div>
      </div>
      <div className="detalle-pedido-overlay" onClick={onCerrar}></div>
    </div>
  );
};

// ============ COMPONENTE PRINCIPAL ============
export default function Pedidos() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [sucursalFiltro, setSucursalFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 8;

  const {
    pedidos,
    cargando,
    pedidoSeleccionado,
    detallesSeleccionado,
    cargarPedidos,
    seleccionarPedido,
    cerrarDetalle
  } = usePedidos();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Filtros y búsqueda
  const pedidosFiltrados = pedidos.filter(p => {
    if (estatusFiltro && p.pedido.estatus !== estatusFiltro) return false;
    if (sucursalFiltro && String(p.pedido.nombre_sucursal) !== String(sucursalFiltro)) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        String(p.pedido.id_pedido).includes(q) ||
        String(p.pedido.nombre_usuario ?? "").toLowerCase().includes(q) ||
        String(p.pedido.nombre_sucursal ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Paginación
  const totalPaginas = Math.ceil(pedidosFiltrados.length / porPagina);
  const pedidosPaginados = pedidosFiltrados.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(1);
    }
  }, [paginaActual, totalPaginas]);

  // Sucursales únicas por nombre (ya no se usa, puedes eliminar si lo deseas)
  // const sucursalesUnicas = Array.from(
  //   new Set(pedidos.map(p => String(p.pedido.nombre_sucursal)).filter(Boolean))
  // );

  // Exportar pedidos filtrados
  const handleExportarPedidos = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "ID,Fecha,Usuario,Sucursal,Estatus,Total\n" +
      pedidosFiltrados.map(p =>
        `${p.pedido.id_pedido},${p.pedido.fecha_creacion},${p.pedido.nombre_usuario},${p.pedido.nombre_sucursal},${p.pedido.estatus},${p.pedido.total}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ha-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleOverlayClick={() => setSidebarOpen(false)}
      />
      <div className="ha-main-content">
        <header className="ha-header">
          <div className="ha-header-content">
            <div className="ha-header-left">
              <button className="ha-menu-button" onClick={toggleSidebar}>
                <Menu size={22} />
              </button>
              <div className="ha-header-title">
                <h1 className="ha-title">Pedidos</h1>
                <p className="ha-subtitle">
                  Gestiona y consulta tus pedidos ({pedidosFiltrados.length} encontrados)
                </p>
              </div>
            </div>
            <div className="ha-header-actions">
              <button onClick={cargarPedidos} disabled={cargando} className="btn-refresh">
                <RefreshCw size={16} className={cargando ? 'spinning' : ''} />
              </button>
              <button onClick={handleExportarPedidos} className="btn-export">
                <Download size={16} />
                Exportar
              </button>
            </div>
          </div>
        </header>
        <div className="ha-center-wrapper">
          {/* Filtros */}
          <div className="pedidos-filtros-wrapper">
            <div className="pedidos-filtros">
              <div className="filtro-busqueda">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por usuario, id, sucursal..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
              </div>
              <div>
                <Filter size={18} />
                <select
                  value={estatusFiltro}
                  onChange={e => setEstatusFiltro(e.target.value)}
                >
                  <option value="">Todos los estatus</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="enviado">Enviado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <select
                  value={sucursalFiltro}
                  onChange={e => setSucursalFiltro(e.target.value)}
                >
                  <option value="">Todas las sucursales</option>
                  {Array.from(
                    new Set(pedidos.map(p => String(p.pedido.nombre_sucursal)).filter(Boolean))
                  ).map(suc => (
                    <option key={suc} value={suc}>{suc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Contenido principal */}
          {cargando ? (
            <div className="cargando-container">
              <RefreshCw className="spinning" size={32} />
              <span>Cargando pedidos...</span>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="sin-resultados">
              <AlertCircle size={48} />
              <h3>No hay pedidos</h3>
              <p>No se encontraron pedidos con los filtros actuales.</p>
            </div>
          ) : (
            <>
              <div className="tabla-pedidos-container">
                {pedidosPaginados.map((p) => (
                  <div key={p.pedido.id_pedido} className="pedido-card-wrapper">
                    <PedidoCard
                      pedido={p.pedido}
                      onSeleccionar={() => seleccionarPedido(p.pedido.id_pedido)}
                    />
                  </div>
                ))}
              </div>
              {totalPaginas > 1 && (
                <div className="paginacion-pedidos">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </button>
                  <div className="paginas-numeros">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      const pagina = Math.max(1, paginaActual - 2) + i;
                      if (pagina > totalPaginas) return null;
                      return (
                        <button
                          key={pagina}
                          onClick={() => setPaginaActual(pagina)}
                          className={paginaActual === pagina ? 'activa' : ''}
                        >
                          {pagina}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {pedidoSeleccionado && (
        <DetallePedido
          pedido={pedidoSeleccionado}
          detalles={detallesSeleccionado}
          onCerrar={cerrarDetalle}
        />
      )}
      {toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}