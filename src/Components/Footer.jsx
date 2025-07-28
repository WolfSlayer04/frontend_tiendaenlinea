import React, { useEffect, useRef } from "react";
import { useStoreInfo, FOOTER_LINKS } from "../config";
import "./Footer.css";

export default function Footer() {
  const storeInfo = useStoreInfo();
  const footerRef = useRef(null);
  const lastColor = useRef();

  useEffect(() => {
    if (footerRef.current && storeInfo.footerBg && storeInfo.footerBg !== lastColor.current) {
      footerRef.current.style.setProperty('--footer-bg', storeInfo.footerBg);
      lastColor.current = storeInfo.footerBg;
    }
  }, [storeInfo.footerBg]);

  const contacto = [
    storeInfo.contact?.horario || "",
    ...(Array.isArray(storeInfo.contact?.telefonos)
      ? storeInfo.contact.telefonos.map(tel => "Tel: " + tel)
      : [])
  ].filter(Boolean);

  return (
    <footer
      className="footer"
      ref={footerRef}
    >
      <div className="footer-inner">
        <div className="footer-row">
          <div>
            <h3 className="footer-title">{storeInfo.name}</h3>
            <p className="footer-desc">{storeInfo.description}</p>
          </div>
          <div>
            <h3 className="footer-title">Enlaces rápidos</h3>
            <ul className="footer-links">
              {FOOTER_LINKS.map(link => (
                <li key={link.href + link.label}>
                  <a href={link.href} className="footer-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="footer-title">Contáctanos</h3>
            {contacto.map((line, idx) => (
              <p className="footer-contact" key={idx}>{line}</p>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {storeInfo.name || "Tienda"}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}