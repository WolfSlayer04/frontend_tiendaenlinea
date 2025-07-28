import React from "react";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

/**
 * Sección de configuración de componentes visuales (Header y Footer)
 *
 * @param {object} props
 * @param {string} selectedOption - "header" o "footer"
 * @param {string} headerBg - Color de fondo del header
 * @param {string} footerBg - Color de fondo del footer
 * @param {function} setHeaderBg
 * @param {function} setFooterBg
 * @param {function} handleHeaderSave
 * @param {function} handleFooterSave
 * @param {boolean} showSuccess
 * @param {string} showError
 * @param {React.Component} PreviewCard
 * @param {Array} FOOTER_LINKS
 * @param {boolean} isAdminUser
 */
export function ComponentesSection({
  selectedOption,
  headerBg,
  footerBg,
  setHeaderBg,
  setFooterBg,
  PreviewCard,
  handleHeaderSave,
  handleFooterSave,
  showSuccess,
  showError,
  FOOTER_LINKS,
  isAdminUser
}) {
  if (selectedOption === "header") {
    return (
      <form className="config-form" autoComplete="off" onSubmit={isAdminUser ? handleHeaderSave : e => e.preventDefault()}>
        <div className="color-picker-row">
          <label style={{ minWidth: 110 }}>Color de fondo:</label>
          <span className="color-preview-circle">
            <span className="color-preview-circle-inner" style={{ background: headerBg }} />
          </span>
          <input
            type="color"
            value={headerBg}
            onChange={e => isAdminUser && setHeaderBg(e.target.value)}
            style={{ "--picker-color": headerBg }}
            disabled={!isAdminUser}
          />
          <span className="color-hex">{headerBg}</span>
        </div>
        <PreviewCard>
          <Header bgColor={headerBg} onCart={() => {}} />
        </PreviewCard>
        <button
          type="submit"
          className="btn-guardar"
          style={{ marginTop: 32 }}
          disabled={!isAdminUser}
          title={!isAdminUser ? "Solo un administrador puede guardar cambios" : ""}
        >
          Guardar Cambios
        </button>
        {!isAdminUser && (
          <div className="msg-guardado error" style={{ marginTop: 20 }}>
            Permisos insuficientes: solo un administrador puede guardar cambios.
          </div>
        )}
        {showSuccess && (
          <div className="msg-guardado exito">¡Guardado correctamente!</div>
        )}
        {showError && (
          <div className="msg-guardado error">{showError}</div>
        )}
      </form>
    );
  }
  if (selectedOption === "footer") {
    return (
      <form className="config-form" autoComplete="off" onSubmit={isAdminUser ? handleFooterSave : e => e.preventDefault()}>
        <div className="color-picker-row">
          <label style={{ minWidth: 110 }}>Color de fondo:</label>
          <span className="color-preview-circle">
            <span className="color-preview-circle-inner" style={{ background: footerBg }} />
          </span>
          <input
            type="color"
            value={footerBg}
            onChange={e => isAdminUser && setFooterBg(e.target.value)}
            style={{ "--picker-color": footerBg }}
            disabled={!isAdminUser}
          />
          <span className="color-hex">{footerBg}</span>
        </div>
        <PreviewCard>
          <Footer bgColor={footerBg} links={FOOTER_LINKS} />
        </PreviewCard>
        <button
          type="submit"
          className="btn-guardar"
          style={{ marginTop: 32 }}
          disabled={!isAdminUser}
          title={!isAdminUser ? "Solo un administrador puede guardar cambios" : ""}
        >
          Guardar Cambios
        </button>
        {!isAdminUser && (
          <div className="msg-guardado error" style={{ marginTop: 20 }}>
            Permisos insuficientes: solo un administrador puede guardar cambios.
          </div>
        )}
        {showSuccess && (
          <div className="msg-guardado exito">¡Guardado correctamente!</div>
        )}
        {showError && (
          <div className="msg-guardado error">{showError}</div>
        )}
      </form>
    );
  }
  return null;
}