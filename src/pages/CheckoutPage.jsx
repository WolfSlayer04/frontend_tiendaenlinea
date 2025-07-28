import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "./CheckoutPage.css";

// --- Leaflet/React-Leaflet ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Modal
import ReactModal from "react-modal";

// Calendario
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay } from "date-fns";
import es from "date-fns/locale/es";

// Corrige iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setPosition([latlng.lat, latlng.lng]);
        },
      }}
    />
  ) : null;
}

function MapCenterer({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

function MapSelector({ latitud, longitud, setLatLong, defaultCenter, forceUpdateMap }) {
  const position =
    latitud && longitud
      ? [latitud, longitud]
      : defaultCenter || [19.4326, -99.1332];
  const [markerPos, setMarkerPos] = useState(position);

  useEffect(() => {
    if (latitud && longitud) setMarkerPos([latitud, longitud]);
  }, [latitud, longitud]);

  useEffect(() => {
    if (defaultCenter && (!latitud || !longitud)) {
      setMarkerPos(defaultCenter);
    }
  }, [defaultCenter]); // eslint-disable-line

  useEffect(() => {
    if (forceUpdateMap && latitud && longitud) {
      setMarkerPos([latitud, longitud]);
    }
  }, [forceUpdateMap, latitud, longitud]); // eslint-disable-line

  useEffect(() => {
    setLatLong({ latitud: markerPos[0], longitud: markerPos[1] });
  }, [markerPos, setLatLong]);

  return (
    <div>
      <MapContainer
        center={markerPos}
        zoom={15}
        scrollWheelZoom={true}
        style={{
          height: 300,
          width: "100%",
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <MapCenterer lat={markerPos[0]} lng={markerPos[1]} />
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={markerPos} setPosition={setMarkerPos} />
      </MapContainer>
      <small>
        Haz click en el mapa o mueve el marcador para ajustar la ubicación exacta de entrega.
      </small>
    </div>
  );
}

// Componente para seleccionar la fecha de entrega - AHORA CON CALENDARIO
function FechaEntregaSelector({ onFechaSeleccionada, onTurnoSeleccionado }) {
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null); // Date
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null); // "mañana" o "tarde"
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarFechasDisponibles = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://logica-tiendaenlina.onrender.com/api/fechas-entrega-disponibles');
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          const fechas = data.data.map(item => ({
            ...item,
            fechaObj: new Date(item.fecha.replace(" ", "T") + "Z"),
          }));
          setFechasDisponibles(fechas);

          // Selecciona por defecto la primera fecha y turno disponibles
          if (fechas.length > 0) {
            setFechaSeleccionada(fechas[0].fechaObj);
            const turnos = getTurnosParaDia(fechas[0].fechaObj, fechas);
            if (turnos.length > 0) {
              setTurnoSeleccionado(turnos[0].etiqueta.toLowerCase());
              onTurnoSeleccionado && onTurnoSeleccionado(turnos[0].etiqueta.toLowerCase());
              onFechaSeleccionada(turnos[0].fecha);
            }
          }
        } else {
          setError("No se pudieron cargar las fechas disponibles.");
        }
      } catch {
        setError("Error al cargar las fechas de entrega disponibles.");
      } finally {
        setLoading(false);
      }
    };

    cargarFechasDisponibles();
    // eslint-disable-next-line
  }, []);

  // Fechas únicas (días) para el calendario
  const diasDisponibles = [
    ...new Set(fechasDisponibles.map(f =>
      f.fechaObj.toISOString().substr(0, 10)
    )),
  ].map(diaStr => new Date(diaStr + "T00:00:00Z"));

  // Filtra los turnos disponibles para el día elegido
  function getTurnosParaDia(date, fechas) {
    return fechas.filter(f => isSameDay(f.fechaObj, date));
  }

  const turnosDisponibles = getTurnosParaDia(fechaSeleccionada, fechasDisponibles);

  const handleChangeDia = date => {
    setFechaSeleccionada(date);
    const turnos = getTurnosParaDia(date, fechasDisponibles);
    if (turnos.length > 0) {
      setTurnoSeleccionado(turnos[0].etiqueta.toLowerCase());
      onTurnoSeleccionado && onTurnoSeleccionado(turnos[0].etiqueta.toLowerCase());
      onFechaSeleccionada(turnos[0].fecha);
    } else {
      setTurnoSeleccionado(null);
      onTurnoSeleccionado && onTurnoSeleccionado(null);
      onFechaSeleccionada(null);
    }
  };

  const handleChangeTurno = etiqueta => {
    setTurnoSeleccionado(etiqueta);
    onTurnoSeleccionado && onTurnoSeleccionado(etiqueta);
    const turno = turnosDisponibles.find(f => f.etiqueta.toLowerCase() === etiqueta);
    if (turno) {
      onFechaSeleccionada(turno.fecha);
    }
  };

  if (loading) {
    return (
      <div className="fecha-entrega-loading">
        <div className="loading-spinner"></div>
        <span>Cargando fechas disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fecha-entrega-error" role="alert">
        <span>{error}</span>
        <small>Se usará la fecha más próxima disponible</small>
      </div>
    );
  }

  return (
    <div className="fecha-entrega-selector">
      <h4 className="fecha-entrega-title">Selecciona tu fecha de entrega</h4>
      <DatePicker
        selected={fechaSeleccionada}
        onChange={handleChangeDia}
        dateFormat="dd-MMM-yyyy"
        locale={es}
        includeDates={diasDisponibles}
        className="checkout-input"
        placeholderText="Elige una fecha"
        showPopperArrow={false}
      />
      {fechaSeleccionada && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>Turno:</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            {turnosDisponibles.length === 0 && (
              <span style={{ color: "#888" }}>No hay turnos disponibles para este día</span>
            )}
            {turnosDisponibles.map(turno => (
              <button
                key={turno.etiqueta}
                type="button"
                className={`turno-btn${turnoSeleccionado === turno.etiqueta.toLowerCase() ? " seleccionado" : ""}`}
                onClick={() => handleChangeTurno(turno.etiqueta.toLowerCase())}
                style={{
                  padding: "12px 24px",
                  borderRadius: "7px",
                  border: "2px solid #5cb85c",
                  background: turnoSeleccionado === turno.etiqueta.toLowerCase() ? "#5cb85c" : "#fff",
                  color: turnoSeleccionado === turno.etiqueta.toLowerCase() ? "#fff" : "#333",
                  fontWeight: "bold",
                  fontSize: "1.15em",
                  cursor: "pointer",
                  minWidth: 145
                }}
              >
                {turno.etiqueta === "Mañana" ? "Mañana (09:00 AM)" : "Tarde (14:00 PM)"}
              </button>
            ))}
          </div>
        </div>
      )}
      {fechaSeleccionada && turnoSeleccionado && (
        <div className="fecha-entrega-preview" style={{marginTop:8, fontSize:16}}>
          Seleccionaste:&nbsp;
          <strong>
            {format(fechaSeleccionada, "dd-MMM-yyyy", { locale: es })} &mdash;{" "}
            {turnoSeleccionado === "mañana" ? "09:00 AM" : "14:00 PM"}
          </strong>
        </div>
      )}
    </div>
  );
}

// Card para datos de entrega - CAMBIO A INFORMACIÓN DE ENVÍO
function DatosEntregaCard({
  nombre, nombreTienda, direccion, colonia, cp, ciudad,
  estado, pais, latitud, longitud, onEdit
}) {
  return (
    <div className="datos-entrega-card">
      <h3>Información de envío</h3>
      <div className="datos-entrega-lista">
        <div className="datos-entrega-item"><span className="datos-entrega-label">Nombre:</span> <span className="datos-entrega-valor">{nombre}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">Nombre tienda:</span> <span className="datos-entrega-valor">{nombreTienda}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">Dirección:</span> <span className="datos-entrega-valor">{direccion}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">Colonia:</span> <span className="datos-entrega-valor">{colonia}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">CP:</span> <span className="datos-entrega-valor">{cp}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">Ciudad:</span> <span className="datos-entrega-valor">{ciudad}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">Estado:</span> <span className="datos-entrega-valor">{estado}</span></div>
        <div className="datos-entrega-item"><span className="datos-entrega-label">País:</span> <span className="datos-entrega-valor">{pais}</span></div>
      </div>
      <button className="checkout-btn" type="button" onClick={onEdit}>
        Editar
      </button>
    </div>
  );
}

// Modal de edición de datos
function ModalEditarDatos({
  isOpen, onClose, values, onChange, onSave,
  onUseCurrentLocation, geoMsg, geoLoading,
  MapSelector, setLatLong, geoDefault, forceUpdateMap
}) {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      style={{
        content: {
          maxWidth: 500,
          margin: "auto",
          borderRadius: "14px",
          padding: "30px 24px 16px 24px"
        },
        overlay: {backgroundColor: "rgba(0,0,0,0.25)"}
      }}
    >
      <h3 style={{marginTop:0, marginBottom:18}}>Editar datos de entrega</h3>
      <form onSubmit={e => { e.preventDefault(); onSave(); }}>
        <div><label>Nombre completo
          <input type="text" value={values.nombre || ""} onChange={e=>onChange('nombre',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>Nombre tienda
          <input type="text" value={values.nombreTienda || ""} onChange={e=>onChange('nombreTienda',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>Dirección
          <input type="text" value={values.direccion || ""} onChange={e=>onChange('direccion',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>Colonia
          <input type="text" value={values.colonia || ""} onChange={e=>onChange('colonia',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>CP
          <input type="text" value={values.cp || ""} onChange={e=>onChange('cp',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>Ciudad
          <input type="text" value={values.ciudad || ""} onChange={e=>onChange('ciudad',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>Estado
          <input type="text" value={values.estado || ""} onChange={e=>onChange('estado',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div><label>País
          <input type="text" value={values.pais || ""} onChange={e=>onChange('pais',e.target.value)} className="checkout-input" required/>
        </label></div>
        <div>
          <label>Ubicación de entrega</label><br/>
          <MapSelector
            latitud={values.latitud}
            longitud={values.longitud}
            setLatLong={setLatLong}
            defaultCenter={geoDefault}
            forceUpdateMap={forceUpdateMap}
          />
          <div className="ubicacion-btn-area">
            <button
              type="button"
              onClick={onUseCurrentLocation}
              className="btn-ubicacion-modal"
            >
              <span role="img" aria-label="ubicación" style={{marginRight:6}}>📍</span>
              Usar mi ubicación actual
            </button>
            {geoMsg && (<div className="ubicacion-msg-ok">{geoMsg}</div>)}
            {geoLoading && (<div className="ubicacion-msg-loading">Buscando ubicación en el mapa…</div>)}
          </div>
        </div>
        <div style={{textAlign:"right",marginTop:20}}>
          <button type="button" onClick={onClose} className="checkout-back-btn" style={{marginRight:8}}>Cancelar</button>
          <button type="submit" className="checkout-btn">Guardar</button>
        </div>
      </form>
    </ReactModal>
  );
}

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [colonia, setColonia] = useState("");
  const [cp, setCp] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("");
  const [nombreTienda, setNombreTienda] = useState("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [geoDefault, setGeoDefault] = useState([20.9673702, -89.5925857]); // Mérida, Yucatán por defecto
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [forceUpdateMap, setForceUpdateMap] = useState(false);
  const [idsucursal, setIdsucursal] = useState(0);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null); // NUEVO: Estado global para el turno
  const navigate = useNavigate();

  // Modal y edición de datos entrega
  const [modalOpen, setModalOpen] = useState(false);
  const [draftDatos, setDraftDatos] = useState({});

  // Recuperar usuario y tienda guardados
  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        setNombre(usuario.nombre_completo || usuario.nombre || usuario.correo || "");
      } catch { console.error(); }
    }
    const tiendaStr = localStorage.getItem("tienda");
    if (tiendaStr) {
      try {
        const tienda = JSON.parse(tiendaStr);
        setNombreTienda(tienda.nombre_tienda || "");
        setDireccion(tienda.direccion || "");
        setColonia(tienda.colonia || "");
        setCp(tienda.codigo_postal || "");
        setCiudad(tienda.ciudad || "");
        setEstado(tienda.estado || "");
        setPais(tienda.pais || "");
        setLatitud(tienda.latitud || null);
        setLongitud(tienda.longitud || null);
        setIdsucursal(tienda.id_sucursal || 0);
      } catch { setIdsucursal(0); }
    }
  }, []);

  // Geocodificación: actualizar mapa si dirección cambia y no hay lat/lng explícitos
  useEffect(() => {
    if (latitud && longitud) return;
    if (!direccion && !colonia && !cp && !ciudad && !estado) return;

    const query = [
      direccion,
      colonia,
      cp,
      ciudad,
      estado,
      pais || "México"
    ].filter(Boolean).join(', ');

    setGeoLoading(true);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setGeoDefault([parseFloat(lat), parseFloat(lon)]);
        } else {
          setGeoDefault([20.9673702, -89.5925857]);
        }
      })
      .catch(() => setGeoDefault([20.9673702, -89.5925857]))
      .finally(() => setGeoLoading(false));
  }, [direccion, colonia, cp, ciudad, estado, pais, latitud, longitud]);

  // Cargar carrito
  useEffect(() => {
    fetch("https://logica-tiendaenlina.onrender.com/api/carrito")
      .then(res => res.json())
      .then(data => {
        setCart(data || []);
        if (!data || data.length === 0) {
          navigate("/carrito");
        }
      });
  }, [navigate]);

  const setLatLong = ({ latitud, longitud }) => {
    setLatitud(latitud);
    setLongitud(longitud);
  };

  const handleFechaSeleccionada = (fecha) => {
    setFechaEntrega(fecha);
  };

  // NUEVO: Recibe el turno seleccionado desde el hijo FechaEntregaSelector
  const handleTurnoSeleccionado = (turno) => {
    setTurnoSeleccionado(turno);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMsg("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeoMsg("Obteniendo tu ubicación...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
        setGeoDefault([pos.coords.latitude, pos.coords.longitude]);
        setGeoMsg("Ubicación capturada correctamente.");
        setForceUpdateMap((v) => !v);
        // Si está editando, también actualiza en el modal
        setDraftDatos(d => ({
          ...d,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude
        }));
      },
      (err) => {
        setGeoMsg("No se pudo obtener la ubicación: " + err.message);
      }
    );
  };

  // --- Modal edición datos entrega ---
  const handleEdit = () => {
    setDraftDatos({
      nombre, nombreTienda, direccion, colonia, cp, ciudad, estado, pais, latitud, longitud
    });
    setModalOpen(true);
  };
  const handleDraftChange = (field, value) => {
    setDraftDatos(d => ({...d, [field]: value}));
  };
  const setDraftLatLong = ({ latitud, longitud }) => {
    setDraftDatos(d => ({...d, latitud, longitud}));
  };
  const handleSaveDatos = () => {
    setNombre(draftDatos.nombre);
    setNombreTienda(draftDatos.nombreTienda);
    setDireccion(draftDatos.direccion);
    setColonia(draftDatos.colonia);
    setCp(draftDatos.cp);
    setCiudad(draftDatos.ciudad);
    setEstado(draftDatos.estado);
    setPais(draftDatos.pais);
    setLatitud(draftDatos.latitud);
    setLongitud(draftDatos.longitud);
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowErrorToast(false);
    setSuccessMsg("");
    if (!nombre || !direccion || !colonia || !cp || !ciudad || !estado || !pais) {
      setError("Por favor, completa todos los campos de dirección.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      setLoading(false);
      return;
    }
    if (cart.length === 0) {
      setError("Tu carrito está vacío.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      setLoading(false);
      return;
    }
    // Validación de fecha y turno
    if (!fechaEntrega) {
      setError("Selecciona una fecha de entrega.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      setLoading(false);
      return;
    }
    if (!turnoSeleccionado) {
      setError("Selecciona un turno de entrega (mañana o tarde).");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      setLoading(false);
      return;
    }

    // Obtén usuario
    const usuarioStr = localStorage.getItem("usuario");
    let id_usuario = 1;
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        id_usuario = usuario.id_usuario || usuario.IDUsuario || 1;
      } catch {console.error();}
    }

    // Obtén tienda
    const tiendaStr = localStorage.getItem("tienda");
    let id_tienda = 1;
    if (tiendaStr) {
      try {
        const tienda = JSON.parse(tiendaStr);
        id_tienda = tienda.id_tienda || id_tienda;
      } catch {console.error();}
    }

    const detallesData = cart.map(item => ({
      id_producto: item.idproducto,
      clave_producto: item.clave_producto || "",
      descripcion: item.descripcion || "",
      unidad: item.unidad || "pieza",
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio),
      porcentaje_descuento: 0,
      importe_descuento: 0,
      iva: 0,
      ieps: 0,
      comentarios: "",
      latitud_entrega: latitud,
      longitud_entrega: longitud
    }));

    const comentarioFinal = comentario || "";

    // Preparar fecha de entrega con el formato correcto para ISO 8601
    let fechaEntregaObj = null;
    if (fechaEntrega) {
      try {
        // Convertir formato "2025-07-09 09:00:00" a "2025-07-09T09:00:00Z"
        const fechaISO = fechaEntrega.replace(' ', 'T') + 'Z';
        fechaEntregaObj = {
          Valid: true,
          Time: fechaISO
        };
      } catch (err) {
        // Si hay error, continuar sin fecha de entrega
      }
    }

    // Si idsucursal==0, el backend lo resuelve dinámicamente
    const pedidoData = {
      id_usuario: id_usuario,
      id_tienda: id_tienda,
      id_sucursal: idsucursal,
      fecha_entrega: fechaEntregaObj,
      id_metodo_pago: 1, // Siempre efectivo
      direccion_entrega: direccion,
      colonia_entrega: colonia,
      cp_entrega: cp,
      ciudad_entrega: ciudad,
      estado_entrega: estado,
      pais_entrega: pais,
      nombre_tienda: nombreTienda,
      latitud_entrega: latitud,
      longitud_entrega: longitud,
      comentarios: {
        String: comentarioFinal,
        Valid: Boolean(comentarioFinal.trim().length > 0)
      },
      origen_pedido: "web",
      detalles: detallesData
    };

    try {
      const res = await fetch("https://logica-tiendaenlina.onrender.com/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Error al crear el pedido");
      }
      const data = await res.json();
      setSuccessMsg("¡Pedido realizado con éxito!");

      await fetch('https://logica-tiendaenlina.onrender.com/api/carrito/vaciar', { method: 'DELETE' });

      const idPedido = data?.data?.id_pedido || null;
      if (idPedido) {
        navigate(`/pedido-confirmado?id=${idPedido}`);
      } else {
        navigate("/pedido-confirmado");
      }
    } catch (err) {
      setError("No se pudo crear el pedido. Intenta de nuevo.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <>
        <Header />
        <div className="checkout-main-full">
          <div className="checkout-container">
            <div className="checkout-header">
              <h2 className="checkout-title">Finalizar compra</h2>
            </div>
            <div className="checkout-content">
              <div className="checkout-error">
                Tu carrito está vacío. Redirigiendo a la página de carrito...
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="checkout-main-full">
        <div className="checkout-container">
          <div className="checkout-header">
            <h2 className="checkout-title">Finalizar compra</h2>
          </div>
          <div className="checkout-content">
            <section className="checkout-form-section">
              {/* Error Toast flotante */}
              {showErrorToast && error && (
                <div style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 40,
                  zIndex: 9999,
                  display: 'flex',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    background: '#e74c3c',
                    color: '#fff',
                    padding: '16px 32px',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    fontSize: 18,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
                    pointerEvents: 'auto',
                  }}>
                    {error}
                  </div>
                </div>
              )}
              {successMsg && <div className="checkout-success">{successMsg}</div>}

              <DatosEntregaCard
                nombre={nombre} nombreTienda={nombreTienda} direccion={direccion}
                colonia={colonia} cp={cp} ciudad={ciudad} estado={estado} pais={pais}
                latitud={latitud} longitud={longitud}
                onEdit={handleEdit}
              />
              <ModalEditarDatos
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                values={draftDatos}
                onChange={handleDraftChange}
                onSave={handleSaveDatos}
                onUseCurrentLocation={handleUseMyLocation}
                geoMsg={geoMsg}
                geoLoading={geoLoading}
                MapSelector={MapSelector}
                setLatLong={setDraftLatLong}
                geoDefault={geoDefault}
                forceUpdateMap={forceUpdateMap}
              />

              {/* El resto de los campos del pedido */}
              <form onSubmit={handleSubmit} className="checkout-form" autoComplete="off">
                <div>
                  <label className="checkout-label">Fecha de entrega</label>
                  <FechaEntregaSelector
                    onFechaSeleccionada={handleFechaSeleccionada}
                    onTurnoSeleccionado={handleTurnoSeleccionado}
                  />
                </div>
                <div>
                  <label className="checkout-label" htmlFor="comentario">
                    Comentarios para el repartidor o tienda
                  </label>
                  <textarea
                    id="comentario"
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    className="checkout-input"
                    placeholder="Escribe aquí cualquier comentario o instrucción especial para tu pedido..."
                    rows={3}
                    style={{ resize: "vertical", minHeight: 48, maxHeight: 120 }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="checkout-btn"
                >
                  {loading ? "Procesando..." : "Confirmar pedido"}
                </button>
              </form>
              <button
                onClick={() => navigate("/carrito")}
                className="checkout-back-btn"
              >
                Volver al carrito
              </button>
            </section>
            <aside className="checkout-summary-section">
              <h3 className="checkout-summary-title">Resumen de productos</h3>
              <ul className="checkout-summary-list">
                {cart.length === 0 ? (
                  <li className="checkout-summary-item" style={{color:'#888'}}>Tu carrito está vacío.</li>
                ) : (
                  cart.map((item) => (
                    <li key={item.idproducto} className="checkout-chip">
                      <span className="checkout-chip-product" title={item.descripcion}>
                        <span role="img" aria-label="box">📦</span>
                        {item.descripcion && item.descripcion.length > 32
                          ? item.descripcion.slice(0, 30) + "…"
                          : item.descripcion}
                        <span className="checkout-chip-qty">
                          ×{item.cantidad}
                        </span>
                      </span>
                      <span className="checkout-chip-price">
                        ${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
              <div className="checkout-summary-total">
                Total:&nbsp;$
                {cart.reduce((sum, i) => sum + Number(i.precio) * Number(i.cantidad), 0).toFixed(2)}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}