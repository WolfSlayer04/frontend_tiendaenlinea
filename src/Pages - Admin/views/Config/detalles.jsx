import React from "react";

/**
 * Sección de configuración de detalles de la tienda
 *
 * @param {object} props
 */
export function DetallesSection({
  errors,
  infoTouched,
  storeInfo,
  setStoreInfo,
  setInfoTouched,
  HORARIO_OPCIONES,
  isHorarioPersonalizado,
  DIAS,
  handleCustomDayChange,
  handleCustomHourChange,
  printCustomSchedule,
  handleDetallesSave,
  handleTelefonoChange,
  addTelefono,
  removeTelefono,
  whatsappMsgOption,
  setWhatsappMsgOption,
  whatsappMsgCustom,
  setWhatsappMsgCustom,
  WHATSAPP_MESSAGE_OPCIONES,
  PreviewCard,
  formatPhoneNumber,
  showSuccess,
  showError,
  isAdminUser // <-- Recibe este prop
}) {
  return (
    <form className="config-form" autoComplete="off" onSubmit={isAdminUser ? handleDetallesSave : e => e.preventDefault()}>
      <div className="config-form-row">
        <label>Nombre:</label>
        <input
          type="text"
          maxLength={40}
          value={storeInfo.name}
          onBlur={() => setInfoTouched({ ...infoTouched, name: true })}
          onChange={e =>
            setStoreInfo({
              ...storeInfo,
              name: e.target.value.replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ.,-]/gi, "")
            })
          }
          placeholder="Ejemplo: Torrito"
          className={errors.name && infoTouched.name ? "is-error" : ""}
          required
          disabled={!isAdminUser}
        />
      </div>
      {errors.name && infoTouched.name && <div className="form-error">{errors.name}</div>}

      <div className="config-form-row">
        <label>Descripción:</label>
        <textarea
          maxLength={120}
          value={storeInfo.description}
          onBlur={() => setInfoTouched({ ...infoTouched, description: true })}
          onChange={e =>
            setStoreInfo({
              ...storeInfo,
              description: e.target.value.replace(/\n/g, " ")
            })
          }
          rows={2}
          placeholder="Breve descripción de la tienda"
          className={errors.description && infoTouched.description ? "is-error" : ""}
          disabled={!isAdminUser}
        />
      </div>
      {errors.description && infoTouched.description && <div className="form-error">{errors.description}</div>}

      <div className="config-form-row">
        <label>Horario:</label>
        <select
          value={storeInfo.contact.horario || ""}
          onBlur={() => setInfoTouched({ ...infoTouched, contact0: true })}
          onChange={e => {
            const value = e.target.value;
            setStoreInfo({
              ...storeInfo,
              contact: { ...storeInfo.contact, horario: value }
            });
          }}
          className={errors.contact0 && infoTouched.contact0 ? "is-error" : ""}
          disabled={!isAdminUser}
        >
          <option value="">Selecciona horario</option>
          {HORARIO_OPCIONES.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {isHorarioPersonalizado && (
        <div className="horario-personalizado-box">
          {DIAS.map((dia, idx) => (
            <div className="horario-dia-row" key={dia}>
              <label>
                <input
                  type="checkbox"
                  checked={storeInfo.customSchedule[idx].activo}
                  onChange={handleCustomDayChange(idx)}
                  disabled={!isAdminUser}
                />
                <span>{dia}</span>
              </label>
              <input
                type="time"
                name="desde"
                value={storeInfo.customSchedule[idx].desde}
                onChange={handleCustomHourChange(idx)}
                disabled={!isAdminUser || !storeInfo.customSchedule[idx].activo}
              />
              <span className="horario-sep">a</span>
              <input
                type="time"
                name="hasta"
                value={storeInfo.customSchedule[idx].hasta}
                onChange={handleCustomHourChange(idx)}
                disabled={!isAdminUser || !storeInfo.customSchedule[idx].activo}
              />
              <span className="horario-horas-label">hrs.</span>
            </div>
          ))}
        </div>
      )}
      {errors.contact0 && (infoTouched.contact0) && (
        <div className="form-error">{errors.contact0}</div>
      )}
      {errors.customSchedule && (
        <div className="form-error">{errors.customSchedule}</div>
      )}

      <div className="config-form-row">
        <label>Teléfonos:</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
          {storeInfo.contact.telefonos.map((telefono, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="text"
                maxLength={14}
                value={telefono}
                onBlur={() => setInfoTouched({ ...infoTouched, [`telefono${idx}`]: true })}
                onChange={handleTelefonoChange(idx)}
                placeholder="Ej: 9991591568"
                className={errors.telefonos && infoTouched[`telefono${idx}`] ? "is-error" : ""}
                style={{ minWidth: 180, maxWidth: 220 }}
                disabled={!isAdminUser}
              />
              {storeInfo.contact.telefonos.length > 1 && (
                <button
                  type="button"
                  className="btn-tel-remove"
                  onClick={() => isAdminUser && removeTelefono(idx)}
                  aria-label="Quitar este teléfono"
                  disabled={!isAdminUser}
                >✕</button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-tel-add"
            onClick={() => isAdminUser && addTelefono()}
            style={{ alignSelf: "flex-start", marginTop: 2 }}
            disabled={!isAdminUser}
          >+ Agregar otro número</button>
        </div>
      </div>
      {errors.telefonos &&
        storeInfo.contact.telefonos.map((_, idx) =>
          infoTouched[`telefono${idx}`] ? (
            <div className="form-error" key={idx}>{errors.telefonos}</div>
          ) : null
        )}

      <div className="config-form-row">
        <label>WhatsApp:</label>
        <input
          type="text"
          maxLength={12}
          value={storeInfo.whatsapp.number}
          onBlur={() => setInfoTouched({ ...infoTouched, whatsappNumber: true })}
          onChange={e =>
            setStoreInfo({
              ...storeInfo,
              whatsapp: {
                ...storeInfo.whatsapp,
                number: e.target.value.replace(/[^\d]/g, "")
              }
            })
          }
          placeholder="Número"
          className={errors.whatsappNumber && infoTouched.whatsappNumber ? "is-error" : ""}
          disabled={!isAdminUser}
        />
      </div>
      {errors.whatsappNumber && infoTouched.whatsappNumber && (
        <div className="form-error">{errors.whatsappNumber}</div>
      )}

      <div className="config-form-row">
        <label>Mensaje predet.:</label>
        <div className="whatsapp-msg-selectgroup">
          <select
            value={whatsappMsgOption}
            onChange={e => isAdminUser && setWhatsappMsgOption(e.target.value)}
            style={{ maxWidth: 260, minWidth: 170 }}
            disabled={!isAdminUser}
          >
            <option value="0">{WHATSAPP_MESSAGE_OPCIONES[0]}</option>
            <option value="1">{WHATSAPP_MESSAGE_OPCIONES[1]}</option>
            <option value="2">{WHATSAPP_MESSAGE_OPCIONES[2]}</option>
            <option value="personalizado">Personalizado...</option>
          </select>
          {whatsappMsgOption === "personalizado" && (
            <input
              type="text"
              maxLength={120}
              value={whatsappMsgCustom}
              onBlur={() => setInfoTouched({ ...infoTouched, whatsappMsg: true })}
              onChange={e => isAdminUser && setWhatsappMsgCustom(e.target.value)}
              placeholder="Mensaje predeterminado"
              className={errors.whatsappMsg && infoTouched.whatsappMsg ? "is-error" : ""}
              style={{ marginLeft: 8, minWidth: 160, maxWidth: 240 }}
              disabled={!isAdminUser}
            />
          )}
        </div>
      </div>
      {(errors.whatsappMsg && infoTouched.whatsappMsg) && (
        <div className="form-error">{errors.whatsappMsg}</div>
      )}

      <PreviewCard>
        <div className="store-info-preview">
          <div className="store-info-title">{storeInfo.name || <span style={{ color: "#bbb" }}>Nombre de la tienda</span>}</div>
          <div className="store-info-description">{storeInfo.description || <span style={{ color: "#bbb" }}>Descripción breve...</span>}</div>
          <div className="store-info-contact">
            {isHorarioPersonalizado
              ? printCustomSchedule(storeInfo.customSchedule)
              : storeInfo.contact.horario
            }
            {(storeInfo.contact.telefonos && storeInfo.contact.telefonos.some(t => t)) && (
              <div>
                {storeInfo.contact.telefonos
                  .filter(t => t)
                  .map((t, i) => (
                    <span key={i} style={{ display: "inline-block", marginRight: 8 }}>
                      {formatPhoneNumber(t)}
                    </span>
                  ))}
              </div>
            )}
            {!((isHorarioPersonalizado && printCustomSchedule(storeInfo.customSchedule)) || storeInfo.contact.horario || storeInfo.contact.telefonos.some(t => t)) &&
              <span style={{ color: "#bbb" }}>Contacto, horarios, teléfonos...</span>
            }
          </div>
          <div className="store-info-whatsapp">
            {(storeInfo.whatsapp.number || storeInfo.whatsapp.defaultMessage) ? (
              <>
                WhatsApp: <b>{storeInfo.whatsapp.number}</b><br />
                <span>{storeInfo.whatsapp.defaultMessage}</span>
              </>
            ) : <span style={{ color: "#bbb" }}>WhatsApp de contacto</span>}
          </div>
        </div>
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