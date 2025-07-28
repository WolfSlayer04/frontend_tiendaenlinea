import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./LoginRegister.module.css";
import { useStoreInfo } from "../config";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

function MapSelector({ latitud, longitud, setLatLong }) {
  const [markerPos, setMarkerPos] = React.useState(
    latitud && longitud ? [latitud, longitud] : [19.4326, -99.1332]
  );

  useEffect(() => {
    if (
      latitud != null &&
      longitud != null &&
      (markerPos[0] !== latitud || markerPos[1] !== longitud)
    ) {
      setMarkerPos([latitud, longitud]);
    }
    // eslint-disable-next-line
  }, [latitud, longitud]);

  useEffect(() => {
    if (
      !latitud ||
      !longitud ||
      markerPos[0] !== latitud ||
      markerPos[1] !== longitud
    ) {
      setLatLong({ latitud: markerPos[0], longitud: markerPos[1] });
    }
    // eslint-disable-next-line
  }, [markerPos]);

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
        Haz click en el mapa o mueve el marcador para ajustar la ubicación exacta de tu tienda.
      </small>
    </div>
  );
}

const steps = [
  "Datos de usuario",
  "Datos de la tienda",
  "Dirección de la tienda",
  "Confirmación",
];

const initialRegister = {
  usuario: {
    tipo_usuario: "tienda",
    nombre_completo: "",
    correo: "",
    telefono: "",
    clave: "",
  },
  tienda: {
    nombre_tienda: "",
    razon_social: "",
    rfc: "",
    direccion: "",
    colonia: "",
    codigo_postal: "",
    ciudad: "",
    estado: "",
    pais: "México",
    tipo_tienda: "minorista",
    latitud: null,
    longitud: null,
  },
};

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7)
    return `(${digits.slice(0, 3)}) - ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) - ${digits.slice(3, 6)} - ${digits.slice(6, 10)}`;
}

function countDigits(str) {
  return (str.match(/\d/g) || []).length;
}

export default function LoginRegister() {
  const { login } = useAuth();
  const { logoUrl, name: tiendaName } = useStoreInfo();
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(0);
  const [loginData, setLoginData] = useState({ correo: "", clave: "" });
  const [registerData, setRegisterData] = useState(initialRegister);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState("");
  const [ciudades, setCiudades] = useState([]);
  const [colonias, setColonias] = useState([]);
  const [registerPass2, setRegisterPass2] = useState("");
  const [showPassReg, setShowPassReg] = useState(false);
  const [showPassReg2, setShowPassReg2] = useState(false);
  const [showPassLogin, setShowPassLogin] = useState(false);

  useEffect(() => {
    const el = document.querySelector("input[name='correo']");
    if (el) el.focus();
  }, [mode, step]);

  function resetRegisterForm() {
    setRegisterData(initialRegister);
    setStep(0);
    setRegisterPass2("");
    setMsg("");
    setCpError("");
    setCiudades([]);
    setColonias([]);
  }
  function resetLoginForm() {
    setLoginData({ correo: "", clave: "" });
    setMsg("");
  }

  function isStepValid() {
    const u = registerData.usuario;
    const t = registerData.tienda;
    switch (step) {
      case 0:
        return (
          u.correo &&
          u.clave &&
          registerPass2 &&
          u.clave === registerPass2 &&
          u.nombre_completo &&
          countDigits(u.telefono) === 10
        );
      case 1:
        return t.nombre_tienda && t.razon_social && t.rfc && t.tipo_tienda;
      case 2:
        return (
          t.direccion &&
          t.colonia &&
          t.codigo_postal &&
          t.ciudad &&
          t.estado &&
          t.pais &&
          t.latitud !== null &&
          t.longitud !== null
        );
      default:
        return true;
    }
  }

  const setLoginField = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const setRegisterUserField = (e) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      setRegisterData((prev) => ({
        ...prev,
        usuario: { ...prev.usuario, [name]: formatPhone(value) },
      }));
    } else {
      setRegisterData((prev) => ({
        ...prev,
        usuario: { ...prev.usuario, [name]: value },
      }));
    }
  };

  const setRegisterTiendaField = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      tienda: { ...prev.tienda, [name]: value },
    }));
  };

  const handleCPChange = async (e) => {
    const value = e.target.value;
    setRegisterData((prev) => ({
      ...prev,
      tienda: {
        ...prev.tienda,
        codigo_postal: value,
        ciudad: "",
        colonia: "",
        estado: "",
      },
    }));
    setCiudades([]);
    setColonias([]);
    if (value.length === 5 && /^[0-9]{5}$/.test(value)) {
      setCpLoading(true);
      setCpError("");
      try {
        const resp = await fetch(`https://api.zippopotam.us/MX/${value}`);
        if (!resp.ok) throw new Error("No se encontró el código postal");
        const data = await resp.json();
        const places = data.places || [];
        const uniqueCiudades = Array.from(
          new Set(places.map((p) => p["place name"]))
        );
        const estadoVal = places[0]?.state || "";
        setCiudades(uniqueCiudades);
        setColonias(uniqueCiudades);
        setRegisterData((prev) => ({
          ...prev,
          tienda: {
            ...prev.tienda,
            estado: estadoVal,
            ciudad: uniqueCiudades.length === 1 ? uniqueCiudades[0] : "",
            colonia: "",
          },
        }));
      } catch {
        setCpError("Código postal no encontrado.");
        setRegisterData((prev) => ({
          ...prev,
          tienda: { ...prev.tienda, ciudad: "", estado: "", colonia: "" },
        }));
        setCiudades([]);
        setColonias([]);
      }
      setCpLoading(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setMsg("Tu navegador no soporta geolocalización");
      return;
    }
    setMsg("Obteniendo ubicación...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegisterData((prev) => ({
          ...prev,
          tienda: {
            ...prev.tienda,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          },
        }));
        setMsg("Ubicación capturada correctamente");
      },
      (err) => {
        let message = "No se pudo obtener la ubicación";
        if (err.code === 1) message = "Permiso de ubicación denegado";
        if (err.code === 2) message = "Ubicación no disponible";
        if (err.code === 3) message = "La petición de ubicación expiró";
        setMsg(message);
      }
    );
  };

  const setLatLongFromMap = ({ latitud, longitud }) => {
    setRegisterData((prev) => ({
      ...prev,
      tienda: { ...prev.tienda, latitud, longitud },
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data);
        if (data.data.admin) window.location = "/admin";
        else window.location = "/";
      } else {
        setMsg(data.message || "Correo o contraseña incorrectos.");
      }
    } catch {
      setMsg("Error de red o servidor");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();

      if (
        data.success === true ||
        data.success === "true" ||
        (data.message &&
          typeof data.message === "string" &&
          data.message.toLowerCase().includes("exitosamente"))
      ) {
        setMsg("¡Registro exitoso! Iniciando sesión automáticamente...");
        try {
          const loginRes = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              correo: registerData.usuario.correo,
              clave: registerData.usuario.clave
            }),
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            login(loginData.data);
            setMsg("¡Bienvenido! Redirigiendo...");
            setTimeout(() => {
              if (loginData.data.admin) {
                window.location = "/admin";
              } else {
                window.location = "/";
              }
            }, 1000);
          } else {
            setMsg("Registro exitoso. Por favor, inicia sesión manualmente.");
            setTimeout(() => {
              setMode("login");
              resetRegisterForm();
              resetLoginForm();
              setLoginData({ correo: registerData.usuario.correo, clave: "" });
            }, 1500);
          }
        } catch {
          setMsg("Registro exitoso. Por favor, inicia sesión.");
          setTimeout(() => {
            setMode("login");
            resetRegisterForm();
            resetLoginForm();
            setLoginData({ correo: registerData.usuario.correo, clave: "" });
          }, 1500);
        }
      } else {
        setMsg(data.message || "Error en el registro");
      }
    } catch {
      setMsg("Error de red o servidor");
    }
    setLoading(false);
  };

  function renderStep() {
    const t = registerData.tienda;
    const u = registerData.usuario;
    switch (step) {
      case 0:
        return (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>1. Correo Electrónico</label>
              <input
                name="correo"
                type="email"
                value={u.correo}
                onChange={setRegisterUserField}
                required
                className={styles.input}
                placeholder="Correo electrónico"
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>2. Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  name="clave"
                  type={showPassReg ? "text" : "password"}
                  value={u.clave}
                  onChange={setRegisterUserField}
                  required
                  className={styles.input}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassReg((v) => !v)}
                  className={styles.eyeButton}
                  aria-label={
                    showPassReg ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassReg ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>3. Repite la contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  name="clave2"
                  type={showPassReg2 ? "text" : "password"}
                  value={registerPass2}
                  onChange={(e) => setRegisterPass2(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="Repite la contraseña"
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassReg2((v) => !v)}
                  className={styles.eyeButton}
                  aria-label={
                    showPassReg2 ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassReg2 ? "🙈" : "👁️"}
                </button>
              </div>
              {registerPass2 && u.clave !== registerPass2 && (
                <span style={{ color: "#e06161", fontSize: 13 }}>
                  Las contraseñas no coinciden
                </span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>4. Nombre completo</label>
              <input
                name="nombre_completo"
                type="text"
                value={u.nombre_completo}
                onChange={setRegisterUserField}
                required
                className={styles.input}
                placeholder="Nombre completo"
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>5. Teléfono</label>
              <input
                name="telefono"
                type="text"
                value={u.telefono}
                onChange={setRegisterUserField}
                required
                className={styles.input}
                placeholder="(555) - 128 - 9866"
                maxLength={18}
                pattern="^\(\d{3}\) - \d{3} - \d{4}$"
                disabled={loading}
                inputMode="tel"
                autoComplete="tel"
                title="El formato debe ser (555) - 128 - 9866"
              />
              {u.telefono && countDigits(u.telefono) < 10 && (
                <span style={{ color: "#e06161", fontSize: 15 }}>
                  Ingresa el teléfono completo con el formato (555) - 128 - 9866
                </span>
              )}
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>6. Nombre de la tienda</label>
              <input
                name="nombre_tienda"
                type="text"
                value={t.nombre_tienda}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                placeholder="Nombre de la tienda"
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>7. Razón social</label>
              <input
                name="razon_social"
                type="text"
                value={t.razon_social}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                placeholder="Razón social"
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>8. RFC</label>
              <input
                name="rfc"
                type="text"
                value={t.rfc}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                placeholder="RFC"
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>9. Tipo de tienda</label>
              <select
                name="tipo_tienda"
                value={t.tipo_tienda}
                onChange={setRegisterTiendaField}
                className={styles.input}
                disabled={loading}
              >
                <option value="minorista">Minorista</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>10. Dirección</label>
              <input
                name="direccion"
                type="text"
                value={t.direccion}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                placeholder="Dirección"
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>11. Código Postal</label>
              <input
                name="codigo_postal"
                type="text"
                value={t.codigo_postal}
                onChange={handleCPChange}
                required
                className={styles.input}
                placeholder="Código Postal"
                disabled={loading}
                maxLength={5}
              />
              {cpLoading && (
                <span style={{ color: "#19e28e", fontSize: 13 }}>
                  Buscando dirección...
                </span>
              )}
              {cpError && (
                <span style={{ color: "#ffb347", fontSize: 13 }}>
                  {cpError}
                </span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>12. Ciudad</label>
              <select
                name="ciudad"
                value={t.ciudad}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                disabled={loading || cpLoading || !ciudades.length}
              >
                <option value="">Selecciona ciudad</option>
                {ciudades.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>13. Colonia</label>
              <select
                name="colonia"
                value={t.colonia}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                disabled={loading || cpLoading || !colonias.length}
              >
                <option value="">Selecciona colonia</option>
                {colonias.map((col, i) => (
                  <option key={i} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>14. Estado</label>
              <input
                name="estado"
                type="text"
                value={t.estado}
                readOnly
                className={styles.input}
                placeholder="Estado"
                disabled
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>15. País</label>
              <input
                name="pais"
                type="text"
                value={t.pais}
                onChange={setRegisterTiendaField}
                required
                className={styles.input}
                placeholder="País"
                disabled={loading || cpLoading}
              />
            </div>
            <button
              type="button"
              className={styles.button}
              style={{ marginBottom: 10, marginTop: 6 }}
              onClick={handleGeolocate}
              disabled={loading}
            >
              Usar mi ubicación actual
            </button>
            <div style={{ marginBottom: 16 }}>
              <MapSelector
                latitud={t.latitud}
                longitud={t.longitud}
                setLatLong={setLatLongFromMap}
              />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h4 className={styles.sectionTitle}>Revisa tus datos</h4>
            <div className={styles.confirmBox}>
              <div className={styles.confirmGrid}>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Correo:</span>
                  <span className={styles.confirmValue}>{registerData.usuario.correo || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Nombre completo:</span>
                  <span className={styles.confirmValue}>{registerData.usuario.nombre_completo || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Teléfono:</span>
                  <span className={styles.confirmValue}>{registerData.usuario.telefono || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Nombre tienda:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.nombre_tienda || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Razón social:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.razon_social || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>RFC:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.rfc || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Tipo tienda:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.tipo_tienda || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Dirección:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.direccion || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Código Postal:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.codigo_postal || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Colonia:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.colonia || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Ciudad:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.ciudad || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>Estado:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.estado || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
                <div className={styles.confirmItem}>
                  <span className={styles.confirmLabel}>País:</span>
                  <span className={styles.confirmValue}>{registerData.tienda.pais || <em className={styles.confirmEmpty}>No especificado</em>}</span>
                </div>
              </div>
              {registerData.tienda.latitud && registerData.tienda.longitud && (
                <div className={styles.confirmMapFragment}>
                  <MapContainer
                    center={[registerData.tienda.latitud, registerData.tienda.longitud]}
                    zoom={16}
                    scrollWheelZoom={false}
                    dragging={false}
                    style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 12,
                      marginTop: 12,
                      marginBottom: 2,
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[registerData.tienda.latitud, registerData.tienda.longitud]} />
                  </MapContainer>
                </div>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  }

  function renderNavButtons() {
    if (mode === "login") return null;
    return (
      <div className={styles.navButtons}>
        {step > 0 && (
          <button
            type="button"
            className={styles.button}
            onClick={() => setStep((s) => s - 1)}
            disabled={loading}
          >
            Atrás
          </button>
        )}
        {step < steps.length - 1 && (
          <button
            type="button"
            className={styles.button}
            onClick={() => isStepValid() && setStep((s) => s + 1)}
            disabled={loading || !isStepValid()}
          >
            Siguiente
          </button>
        )}
        {step === steps.length - 1 && (
          <button
            className={styles.button}
            type="submit"
            disabled={loading}
            style={{ marginLeft: 10 }}
          >
            {loading ? "Registrando..." : "CREAR CUENTA"}
          </button>
        )}
      </div>
    );
  }

  function renderLogin() {
    return (
      <>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Correo Electrónico</label>
          <input
            name="correo"
            type="email"
            value={loginData.correo}
            onChange={setLoginField}
            required
            className={styles.input}
            autoComplete="username"
            placeholder="Ingresa tu correo"
            disabled={loading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Contraseña</label>
          <div style={{ position: "relative" }}>
            <input
              name="clave"
              type={showPassLogin ? "text" : "password"}
              value={loginData.clave}
              onChange={setLoginField}
              required
              className={styles.input}
              autoComplete="current-password"
              placeholder="Contraseña"
              disabled={loading}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassLogin((v) => !v)}
              className={styles.eyeButton}
              aria-label={
                showPassLogin ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassLogin ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !loginData.correo || !loginData.clave}
          className={styles.button}
        >
          {loading ? "Iniciando..." : "INICIAR SESIÓN"}
        </button>
        <div className={styles.switchText}>
          ¿No tienes cuenta?{" "}
          <span
            className={styles.link}
            onClick={() => {
              setMode("register");
              resetLoginForm();
              resetRegisterForm();
              setStep(0);
            }}
          >
            Crear cuenta
          </span>
        </div>
      </>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundShapeLeft}></div>
      <div className={styles.backgroundShapeRight}></div>
      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ width: 160, marginBottom: 12, objectFit: "contain" }}
              draggable="false"
            />
          ) : null}
        </div>
        <h2 className={styles.title}>
          {mode === "login" ? "INICIAR SESIÓN" : "CREAR CUENTA"}
        </h2>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "¡Bienvenido de nuevo! Ingresa tus credenciales."
            : "¡Crea tu cuenta y tu tienda para comenzar a comprar!"}
        </p>
        {msg && <div className={styles.msg}>{msg}</div>}
        {mode === "register" && (
          <div className={styles.stepper}>
            {steps.map((label, i) => (
              <div
                key={i}
                className={`${styles.step} ${i === step ? styles.active : ""}`}
              >
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}
        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          autoComplete="off"
        >
          {mode === "login" ? renderLogin() : renderStep()}
          {renderNavButtons()}
          {mode === "register" && (
            <div className={styles.switchText}>
              ¿Ya tienes cuenta?{" "}
              <span
                className={styles.link}
                onClick={() => {
                  setMode("login");
                  resetRegisterForm();
                  resetLoginForm();
                }}
              >
                Inicia sesión
              </span>
            </div>
          )}
        </form>
      </div>
      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} {tiendaName ? tiendaName : ""} · Sistema de pedidos
        </span>
      </footer>
    </div>
  );
}