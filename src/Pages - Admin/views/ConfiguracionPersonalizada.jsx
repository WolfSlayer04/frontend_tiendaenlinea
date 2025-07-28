import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../Sidebar";
import "./ConfiguracionPersonalizada.css";
import { ComponentesSection } from "./Config/componentes";
import { DetallesSection } from "./Config/detalles";
import { ImagenesSection } from "./Config/imagenes";
import { EntregasSection } from "./Config/entregas";
import "./ConfigEntregas.css";

// --- CONSTANTES ---
const HORARIO_OPCIONES = [
  "Lunes a Viernes de 10:00 a 18:00 hrs. | Sábados de 9:00 a 14:30 hrs.",
  "Lunes a Sábado de 9:00 a 19:00 hrs.",
  "Lunes a Viernes de 8:00 a 17:00 hrs.",
  "Abierto 24/7",
  "Personalizado..."
];
const WHATSAPP_MESSAGE_OPCIONES = [
  "¡Hola! Me gustaría recibir más información sobre sus productos.",
  "Hola, ¿pueden ayudarme con un pedido?",
  "¡Buen día! Quisiera saber el horario de atención."
];
const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];
const DEFAULT_STORE_INFO = {
  name: "",
  description: "",
  contact: {
    horario: "",
    telefonos: [""]
  },
  customSchedule: DIAS.map(() => ({ activo: false, desde: "09:00", hasta: "18:00" })),
  whatsapp: { number: "", defaultMessage: "" }
};
const FOOTER_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/" },
  { label: "Carrito", href: "/carrito" },
  { label: "Pedidos", href: "/pedido-confirmado" }
];
const SECTIONS = [
  { key: "Componentes", label: "Componentes" },
  { key: "Detalles", label: "Detalles" },
  { key: "Imagenes", label: "Imágenes" },
  { key: "Entregas", label: "Entregas" }
];
const SECTION_OPTIONS = {
  Componentes: [
    { key: "header", label: "Header" },
    { key: "footer", label: "Footer" }
  ],
  Detalles: [
    { key: "info", label: "Información" }
  ],
  Imagenes: [
    { key: "logo", label: "Logo" },
    { key: "logotipo", label: "Logotipo" }
  ],
  Entregas: [
    { key: "config", label: "Configuración" }
  ]
};
const IMAGE_IDENTIFIERS = {
  logo: "logo",
  logotipo: "logotipo"
};

// --- UTILIDAD PARA ADMIN ---
function esAdmin() {
  try {
    const adminObj = JSON.parse(localStorage.getItem("admin") || "{}");
    return (adminObj.tipo_usuario || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

// --- UTILS ---
function formatPhoneNumber(raw) {
  const cleaned = (raw || "").replace(/\D/g, "");
  if (cleaned.length < 10) return raw;
  return `(${cleaned.slice(0, 3)}) - ${cleaned.slice(3, 6)} - ${cleaned.slice(6, 10)}`;
}
function validarInfoTienda(info, personalizado, diasSeleccionados) {
  let errors = {};
  if (!/^[\w\sáéíóúüñÁÉÍÓÚÜÑ.,-]{2,40}$/i.test(info.name.trim())) {
    errors.name = "Solo letras, números y espacios (2-40), requerido.";
  }
  if (!/^.{0,120}$/i.test(info.description.trim())) {
    errors.description = "Máximo 120 caracteres.";
  }
  if (
    info.contact.telefonos.some(
      t => t && (!/^\d{10}$/.test(t.replace(/\D/g, "")))
    )
  ) {
    errors.telefonos = "Cada número debe tener 10 dígitos (solo números).";
  }
  if (info.whatsapp.number && !/^\d{8,12}$/.test(info.whatsapp.number.trim())) {
    errors.whatsappNumber = "Solo números, 8-12 dígitos.";
  }
  if (info.whatsapp.defaultMessage.length > 120) {
    errors.whatsappMsg = "Máximo 120 caracteres.";
  }
  if (!info.contact.horario) {
    errors.contact0 = "Selecciona un horario.";
  } else if (info.contact.horario === "Personalizado...") {
    if (!diasSeleccionados.some(d => d.activo)) {
      errors.customSchedule = "Selecciona al menos un día y horario.";
    }
  }
  return errors;
}
function printCustomSchedule(customSchedule) {
  const grupos = [];
  let grupo = null;
  customSchedule.forEach((dia, idx) => {
    if (dia.activo) {
      if (
        !grupo ||
        grupo.desde !== dia.desde ||
        grupo.hasta !== dia.hasta ||
        grupo.fin !== idx - 1
      ) {
        if (grupo) grupos.push(grupo);
        grupo = {
          desde: dia.desde,
          hasta: dia.hasta,
          inicio: idx,
          fin: idx
        };
      } else {
        grupo.fin = idx;
      }
    } else {
      if (grupo) {
        grupos.push(grupo);
        grupo = null;
      }
    }
  });
  if (grupo) grupos.push(grupo);

  const partes = grupos.map(gr => {
    let label =
      gr.inicio === gr.fin
        ? DIAS[gr.inicio]
        : `${DIAS[gr.inicio]} a ${DIAS[gr.fin]}`;
    return `${label} de ${gr.desde} a ${gr.hasta} hrs.`;
  });
  return partes.length > 0 ? partes.join(" | ") : "";
}
function getLogoApiEndpoint() {
  return "/api/empresa/logo";
}
async function getImagenActual(type) {
  try {
    const res = await fetch(`/api/empresa/logo?identificador=${IMAGE_IDENTIFIERS[type]}&ts=${Date.now()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Error al obtener imagen");
    const blob = await res.blob();
    if (blob.size > 0) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch {
    return null;
  }
}
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// --- COMPONENTE PRINCIPAL ---
export default function ConfiguracionPersonalizada() {
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0].key);
  const [selectedOption, setSelectedOption] = useState(
    SECTION_OPTIONS[SECTIONS[0].key][0].key
  );
  const [headerBg, setHeaderBg] = useState("#6366f1");
  const [footerBg, setFooterBg] = useState("#22272b");
  const [storeInfo, setStoreInfo] = useState(DEFAULT_STORE_INFO);
  const [infoTouched, setInfoTouched] = useState({});
  const isHorarioPersonalizado = storeInfo.contact.horario === "Personalizado...";
  const diasSeleccionados = storeInfo.customSchedule;
  const errors = selectedOption === "info" ? validarInfoTienda(storeInfo, isHorarioPersonalizado, diasSeleccionados) : {};
  const [whatsappMsgOption, setWhatsappMsgOption] = useState("0");
  const [whatsappMsgCustom, setWhatsappMsgCustom] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState("");

  // Estado para configuración de entregas
  const [configEntrega, setConfigEntrega] = useState({
    dias_habiles: ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"],
    tiempo_procesamiento: 2,
    reglas_fin_semana: {
      procesar_sabado: true,
      procesar_domingo: false,
      dias_adicionales_sabado: 1,
      dias_adicionales_domingo: 2
    },
    horarios_entrega: [
      {etiqueta: "Mañana", inicio: "09:00", fin: "12:00"},
      {etiqueta: "Tarde", inicio: "13:00", fin: "18:00"}
    ],
    dias_feriados: []
  });

  // IMAGENES
  const [imagePreview, setImagePreview] = useState({ logo: null, logotipo: null });
  const [imageFile, setImageFile] = useState({ logo: null, logotipo: null });
  const [imageLoading, setImageLoading] = useState({ logo: false, logotipo: false });
  const [imageSuccess, setImageSuccess] = useState({ logo: "", logotipo: "" });
  const [imageError, setImageError] = useState({ logo: "", logotipo: "" });
  const [imageExists, setImageExists] = useState({ logo: false, logotipo: false });
  const [imageActualUrl, setImageActualUrl] = useState({ logo: null, logotipo: null });

  // Para evitar memory leaks de ObjectURL
  const prevObjectUrls = useRef({ logo: null, logotipo: null });

  // Responsive sidebar
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detecta si el usuario es admin
  const [isAdminUser, setIsAdminUser] = useState(esAdmin());
  useEffect(() => {
    setIsAdminUser(esAdmin());
  }, []);

  useEffect(() => {
    fetch(`/api/admin/personalizar`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          data.forEach(cfg => {
            let parsed = {};
            try { parsed = JSON.parse(cfg.config); } catch { console.error(); }
            if (parsed.header && parsed.header.headerBg) setHeaderBg(parsed.header.headerBg);
            if (parsed.footer && parsed.footer.footerBg) setFooterBg(parsed.footer.footerBg);
            if (parsed.detalles) setStoreInfo(parsed.detalles);
          });
        } else if (data && data.config) {
          let parsed = {};
          try { parsed = JSON.parse(data.config); } catch { console.error(); }
          if (parsed.header && parsed.header.headerBg) setHeaderBg(parsed.header.headerBg);
          if (parsed.footer && parsed.footer.footerBg) setFooterBg(parsed.footer.footerBg);
          if (parsed.detalles) setStoreInfo(parsed.detalles);
        }
      })
      .catch(() => {});

    fetch("/api/admin/config-entrega?id_admin=1")
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            return { data: { config: null } };
          }
          throw new Error("Error al cargar la configuración");
        }
        return response.json();
      })
      .then(data => {
        if (data && data.data && data.data.config) {
          setConfigEntrega(data.data.config);
        }
      })
      .catch(error => {
        console.error("Error al cargar la configuración de entregas:", error);
      });
  }, []);

  useEffect(() => {
    if (
      selectedSection === "Imagenes" &&
      (selectedOption === "logo" || selectedOption === "logotipo")
    ) {
      getImagenActual(selectedOption).then(url => {
        if (prevObjectUrls.current[selectedOption]) {
          URL.revokeObjectURL(prevObjectUrls.current[selectedOption]);
        }
        prevObjectUrls.current[selectedOption] = url;
        setImageActualUrl(prev => ({ ...prev, [selectedOption]: url }));
        setImageExists(prev => ({ ...prev, [selectedOption]: !!url }));
      });
    }
    return () => {
      ["logo", "logotipo"].forEach(type => {
        if (prevObjectUrls.current[type]) {
          URL.revokeObjectURL(prevObjectUrls.current[type]);
          prevObjectUrls.current[type] = null;
        }
      });
    };
  }, [selectedSection, selectedOption]);

  const handleHeaderSave = e => {
    e.preventDefault();
    if (!isAdminUser) return;
    guardarConfigVisual("header", { headerBg });
  };
  const handleFooterSave = e => {
    e.preventDefault();
    if (!isAdminUser) return;
    guardarConfigVisual("footer", { footerBg });
  };
  const handleDetallesSave = e => {
    e.preventDefault();
    if (!isAdminUser) return;
    if (Object.keys(errors).length > 0) {
      setShowError("Corrige los campos marcados antes de guardar.");
      setShowSuccess(false);
      return;
    }
    guardarConfigVisual("detalles", storeInfo);
  };

  // Método para guardar configuración de entregas
  const handleSaveEntregas = (e) => {
    e.preventDefault();
    if (!isAdminUser) return;
    const tipoUsuario = JSON.parse(localStorage.getItem("admin") || "{}").tipo_usuario || "";
    fetch("/api/admin/config-entrega?id_admin=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tipo-Usuario": tipoUsuario.toLowerCase()
      },
      body: JSON.stringify(configEntrega)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error al guardar la configuración");
      }
      return response.json();
    })
    .then(data => {
      setShowSuccess(true);
      setShowError("");
      setTimeout(() => setShowSuccess(false), 2000);
    })
    .catch(error => {
      setShowError(error.message || "Error al guardar la configuración");
      setShowSuccess(false);
    });
  };

  function guardarConfigVisual(section, config) {
    if (!isAdminUser) return;
    (async () => {
      try {
        const tipoUsuario = JSON.parse(localStorage.getItem("admin") || "{}").tipo_usuario || "";
        const resActual = await fetch(`/api/admin/personalizar`);
        let foundId = null;
        if (resActual.ok) {
          const dataActual = await resActual.json();
          if (Array.isArray(dataActual)) {
            for (const reg of dataActual) {
              let parsed = {};
              try { parsed = JSON.parse(reg.config); } catch { console.error(); }
              if (parsed[section]) {
                foundId = reg.id;
                break;
              }
            }
          }
        }
        const body = JSON.stringify({ [section]: config });
        let res;
        if (foundId) {
          res = await fetch(`/api/admin/personalizar/${foundId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Tipo-Usuario": tipoUsuario.toLowerCase()
            },
            body
          });
        } else {
          res = await fetch(`/api/admin/personalizar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tipo-Usuario": tipoUsuario.toLowerCase()
            },
            body
          });
        }
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.mensaje || "Error al guardar configuración visual");
        }
        setShowSuccess(true);
        setShowError("");
        setTimeout(() => setShowSuccess(false), 2000);
        window.dispatchEvent(new Event("store-config-updated"));
      } catch (error) {
        setShowError(error.message || "Error de red");
        setShowSuccess(false);
      }
    })();
  }

  useEffect(() => {
    if (whatsappMsgOption === "0" || whatsappMsgOption === "1" || whatsappMsgOption === "2") {
      setStoreInfo(prev => ({
        ...prev,
        whatsapp: {
          ...prev.whatsapp,
          defaultMessage: WHATSAPP_MESSAGE_OPCIONES[Number(whatsappMsgOption)]
        }
      }));
    } else if (whatsappMsgOption === "personalizado") {
      setStoreInfo(prev => ({
        ...prev,
        whatsapp: {
          ...prev.whatsapp,
          defaultMessage: whatsappMsgCustom
        }
      }));
    }
  }, [whatsappMsgOption, whatsappMsgCustom]);

  const handleTelefonoChange = idx => e => {
    const value = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
    setStoreInfo(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        telefonos: prev.contact.telefonos.map((t, i) => (i === idx ? value : t))
      }
    }));
  };
  const addTelefono = () => {
    setStoreInfo(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        telefonos: [...prev.contact.telefonos, ""]
      }
    }));
  };
  const removeTelefono = idx => {
    setStoreInfo(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        telefonos: prev.contact.telefonos.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleCustomDayChange = idx => e => {
    const customSchedule = storeInfo.customSchedule.map((d, i) =>
      i === idx ? { ...d, activo: e.target.checked } : d
    );
    setStoreInfo({ ...storeInfo, customSchedule });
  };
  const handleCustomHourChange = idx => e => {
    const { name, value } = e.target;
    const customSchedule = storeInfo.customSchedule.map((d, i) =>
      i === idx ? { ...d, [name]: value } : d
    );
    setStoreInfo({ ...storeInfo, customSchedule });
  };

  // Guardar imagen (logo o logotipo)
  const saveImage = async (e, type) => {
    e.preventDefault();
    if (!isAdminUser) return;
    setImageLoading(prev => ({ ...prev, [type]: true }));
    setImageSuccess(prev => ({ ...prev, [type]: "" }));
    setImageError(prev => ({ ...prev, [type]: "" }));
    try {
      const tipoUsuario = JSON.parse(localStorage.getItem("admin") || "{}").tipo_usuario || "";
      const file = imageFile[type];
      const exists = imageExists[type];
      const formData = new FormData();
      formData.append(type, file);
      formData.append("identificador", IMAGE_IDENTIFIERS[type]);
      const method = exists ? "PUT" : "POST";
      const res = await fetch(getLogoApiEndpoint(), {
        method,
        headers: {
          "X-Tipo-Usuario": tipoUsuario.toLowerCase()
        },
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData && errData.error ? errData.error : "Error al guardar");
      }
      setImageSuccess(prev => ({
        ...prev,
        [type]: (method === "PUT" ? "Imagen actualizada correctamente." : "Imagen guardada correctamente.")
      }));
      setImageExists(prev => ({ ...prev, [type]: true }));
      if (imagePreview[type]) {
        URL.revokeObjectURL(imagePreview[type]);
      }
      setImagePreview(prev => ({ ...prev, [type]: null }));
      setImageFile(prev => ({ ...prev, [type]: null }));
      getImagenActual(type).then(url => {
        if (prevObjectUrls.current[type]) {
          URL.revokeObjectURL(prevObjectUrls.current[type]);
        }
        prevObjectUrls.current[type] = url;
        setImageActualUrl(prev => ({ ...prev, [type]: url }));
      });
      setTimeout(() => setImageSuccess(prev => ({ ...prev, [type]: "" })), 2000);
    } catch (error) {
      setImageError(prev => ({ ...prev, [type]: error.message || "Error al guardar imagen" }));
    }
    setImageLoading(prev => ({ ...prev, [type]: false }));
  };

  const deleteImage = async (type) => {
    if (!isAdminUser) return;
    setImageLoading(prev => ({ ...prev, [type]: true }));
    setImageSuccess(prev => ({ ...prev, [type]: "" }));
    setImageError(prev => ({ ...prev, [type]: "" }));
    try {
      const tipoUsuario = JSON.parse(localStorage.getItem("admin") || "{}").tipo_usuario || "";
      const res = await fetch(`${getLogoApiEndpoint()}?identificador=${IMAGE_IDENTIFIERS[type]}`, {
        method: "DELETE",
        headers: {
          "X-Tipo-Usuario": tipoUsuario.toLowerCase()
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData && errData.error ? errData.error : "Error al borrar");
      }
      setImageSuccess(prev => ({ ...prev, [type]: "Imagen eliminada correctamente." }));
      if (imagePreview[type]) {
        URL.revokeObjectURL(imagePreview[type]);
      }
      setImagePreview(prev => ({ ...prev, [type]: null }));
      setImageFile(prev => ({ ...prev, [type]: null }));
      if (prevObjectUrls.current[type]) {
        URL.revokeObjectURL(prevObjectUrls.current[type]);
        prevObjectUrls.current[type] = null;
      }
      setImageExists(prev => ({ ...prev, [type]: false }));
      setImageActualUrl(prev => ({ ...prev, [type]: null }));
      setTimeout(() => setImageSuccess(prev => ({ ...prev, [type]: "" })), 2000);
    } catch (error) {
      setImageError(prev => ({ ...prev, [type]: error.message || "Error al borrar imagen" }));
    }
    setImageLoading(prev => ({ ...prev, [type]: false }));
  };

  function renderSectionContent() {
    switch (selectedSection) {
      case "Componentes":
        return (
          <ComponentesSection
            selectedOption={selectedOption}
            headerBg={headerBg}
            footerBg={footerBg}
            setHeaderBg={setHeaderBg}
            setFooterBg={setFooterBg}
            handleHeaderSave={isAdminUser ? handleHeaderSave : undefined}
            handleFooterSave={isAdminUser ? handleFooterSave : undefined}
            showSuccess={showSuccess}
            showError={showError}
            PreviewCard={PreviewCard}
            FOOTER_LINKS={FOOTER_LINKS}
            isAdminUser={isAdminUser}
          />
        );
      case "Detalles":
        return (
          <DetallesSection
            errors={errors}
            infoTouched={infoTouched}
            storeInfo={storeInfo}
            setStoreInfo={setStoreInfo}
            setInfoTouched={setInfoTouched}
            HORARIO_OPCIONES={HORARIO_OPCIONES}
            isHorarioPersonalizado={isHorarioPersonalizado}
            DIAS={DIAS}
            handleCustomDayChange={handleCustomDayChange}
            handleCustomHourChange={handleCustomHourChange}
            printCustomSchedule={printCustomSchedule}
            handleDetallesSave={isAdminUser ? handleDetallesSave : undefined}
            handleTelefonoChange={handleTelefonoChange}
            addTelefono={addTelefono}
            removeTelefono={removeTelefono}
            whatsappMsgOption={whatsappMsgOption}
            setWhatsappMsgOption={setWhatsappMsgOption}
            whatsappMsgCustom={whatsappMsgCustom}
            setWhatsappMsgCustom={setWhatsappMsgCustom}
            WHATSAPP_MESSAGE_OPCIONES={WHATSAPP_MESSAGE_OPCIONES}
            PreviewCard={PreviewCard}
            formatPhoneNumber={formatPhoneNumber}
            showSuccess={showSuccess}
            showError={showError}
            isAdminUser={isAdminUser}
          />
        );
      case "Imagenes":
        return (
          <ImagenesSection
            selectedOption={selectedOption}
            imageActualUrl={imageActualUrl}
            imagePreview={imagePreview}
            imageFile={imageFile}
            imageExists={imageExists}
            imageLoading={imageLoading}
            imageSuccess={imageSuccess}
            imageError={imageError}
            saveImage={isAdminUser ? saveImage : undefined}
            deleteImage={isAdminUser ? deleteImage : undefined}
            setImageFile={setImageFile}
            setImagePreview={setImagePreview}
            isAdminUser={isAdminUser}
          />
        );
      case "Entregas":
        return (
          <EntregasSection
            configEntrega={configEntrega}
            setConfigEntrega={setConfigEntrega}
            handleSaveEntregas={isAdminUser ? handleSaveEntregas : undefined}
            showSuccess={showSuccess}
            showError={showError}
            PreviewCard={PreviewCard}
            isAdminUser={isAdminUser}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="config-app-container">
      <Sidebar />
      <main className="config-settings-main">
        <section className="settings-header">
          <button
            className="config-hamburger-btn"
            aria-label="Menú"
            style={{ marginRight: "1.1rem", display: isMobile ? "flex" : "none" }}
            onClick={() => {/* Si quieres overlay en mobile, controla aquí */}}
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <h1>Configuración Visual</h1>
            <p>Personaliza los componentes y la información principal de tu tienda.</p>
          </div>
        </section>
        <div className="settings-body">
          <div className="settings-central-card extra-wide">
            <aside className="settings-nav">
              <ul>
                {SECTIONS.map(section => (
                  <li
                    key={section.key}
                    className={selectedSection === section.key ? "active" : ""}
                    onClick={() => {
                      setSelectedSection(section.key);
                      setSelectedOption(SECTION_OPTIONS[section.key][0].key);
                    }}
                  >
                    {section.label}
                  </li>
                ))}
              </ul>
            </aside>
            <section className="settings-content">
              <nav className="settings-options">
                {SECTION_OPTIONS[selectedSection].map(option => (
                  <button
                    key={option.key}
                    className={selectedOption === option.key ? "active" : ""}
                    onClick={() => setSelectedOption(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </nav>
              <div className="settings-section-content extra-wide">
                {renderSectionContent()}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTE PREVIEW CARD ---
function PreviewCard({ children }) {
  return (
    <div className="preview-card-custom extra-wide">
      <div className="preview-fullwidth-preview">
        {children}
      </div>
    </div>
  );
}