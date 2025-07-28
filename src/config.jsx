import { useEffect, useState } from "react";

const CONFIG_API = "/api/admin/personalizar";

export const DEFAULT_STORE_INFO = {
  name: "Nombre de la tienda",
  description: "",
  contact: {
    horario: "",
    telefonos: ["0000000000"]
  },
  customSchedule: [
    { activo: false, desde: "", hasta: "" },
    { activo: false, desde: "", hasta: "" },
    { activo: false, desde: "", hasta: "" },
    { activo: false, desde: "", hasta: "" },
    { activo: false, desde: "", hasta: "" },
    { activo: false, desde: "", hasta: "" },
    { activo: false, desde: "", hasta: "" }
  ],
  whatsapp: {
    number: "0000000000",
    defaultMessage: ""
  }
};

export const BRAND_COLORS = {
  primary: "#6366f1",
  secondary: "#f59e42",
  success: "#10b981",
  error: "#ef4444"
};

export const FOOTER_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/" },
  { label: "Carrito", href: "/carrito" },
  { label: "Pedidos", href: "/pedido-confirmado" },
  
];

const IMAGE_IDENTIFIERS = {
  logo: "logo",
  logotipo: "logotipo"
};

async function getStoreImageUrl(identificador) {
  try {
    const res = await fetch(`/api/empresa/logo?identificador=${identificador}`);
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

export function useStoreInfo() {
  const [storeInfo, setStoreInfo] = useState(DEFAULT_STORE_INFO);
  const [headerBg, setHeaderBg] = useState("#6366f1");
  const [footerBg, setFooterBg] = useState("#22272b");
  const [logoUrl, setLogoUrl] = useState(null);
  const [logotipoUrl, setLogotipoUrl] = useState(null);

  useEffect(() => {
    function fetchConfig() {
      fetch(CONFIG_API)
        .then(res => res.json())
        .then(data => {
          const detallesItem = data.find(item => {
            try {
              const config = JSON.parse(item.config);
              return config && typeof config === "object" && "detalles" in config;
            } catch {
              return false;
            }
          });

          if (detallesItem) {
            try {
              const config = JSON.parse(detallesItem.config);
              setStoreInfo(config.detalles);
            } catch {
              setStoreInfo(DEFAULT_STORE_INFO);
            }
          } else {
            setStoreInfo(DEFAULT_STORE_INFO);
          }

          const headerItem = data.find(item => {
            try {
              const config = JSON.parse(item.config);
              return config && typeof config === "object" && "header" in config;
            } catch {
              return false;
            }
          });

          if (headerItem) {
            try {
              const config = JSON.parse(headerItem.config);
              if (config.header && config.header.headerBg) setHeaderBg(config.header.headerBg);
            } catch {console.error();
            }
          }

          const footerItem = data.find(item => {
            try {
              const config = JSON.parse(item.config);
              return config && typeof config === "object" && "footer" in config;
            } catch {
              return false;
            }
          });

          if (footerItem) {
            try {
              const config = JSON.parse(footerItem.config);
              if (config.footer && config.footer.footerBg) setFooterBg(config.footer.footerBg);
            } catch {console.error();
            }
          }
        })
        .catch(() => {
          setStoreInfo(DEFAULT_STORE_INFO);
          setHeaderBg("#6366f1");
          setFooterBg("#22272b");
        });
    }

    fetchConfig();
    window.addEventListener("store-config-updated", fetchConfig);

    return () => {
      window.removeEventListener("store-config-updated", fetchConfig);
    };
  }, []);

  useEffect(() => {
    getStoreImageUrl(IMAGE_IDENTIFIERS.logo).then(setLogoUrl);
    getStoreImageUrl(IMAGE_IDENTIFIERS.logotipo).then(setLogotipoUrl);
  }, [storeInfo]);

  return { ...storeInfo, headerBg, footerBg, logoUrl, logotipoUrl };
}