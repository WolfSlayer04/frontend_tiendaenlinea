import React from "react";

export function EntregasSection({
  configEntrega,
  setConfigEntrega,
  handleSaveEntregas,
  showSuccess,
  showError,
  PreviewCard,
  isAdminUser // <-- NUEVO: recibe este prop
}) {
  const DIAS = [
    "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"
  ];

  // Handlers
  const handleDiasHabilesChange = idx => e => {
    if (!isAdminUser) return;
    const value = e.target.checked;
    const dia = DIAS[idx];
    let dias = [...configEntrega.dias_habiles];
    if (value && !dias.includes(dia)) dias.push(dia);
    if (!value && dias.includes(dia)) dias = dias.filter(d => d !== dia);
    setConfigEntrega({ ...configEntrega, dias_habiles: dias });
  };

  const handleInputChange = e => {
    if (!isAdminUser) return;
    const { name, value, type, checked } = e.target;
    if (name.startsWith("reglas_fin_semana.")) {
      const key = name.split(".")[1];
      setConfigEntrega({
        ...configEntrega,
        reglas_fin_semana: {
          ...configEntrega.reglas_fin_semana,
          [key]: type === "checkbox" ? checked : Number(value)
        }
      });
    } else if (name === "tiempo_procesamiento") {
      setConfigEntrega({
        ...configEntrega,
        tiempo_procesamiento: Number(value)
      });
    }
  };

  // Días feriados handlers
  const handleFeriadoChange = (idx, field, val) => {
    if (!isAdminUser) return;
    const nuevos = [...(configEntrega.dias_feriados || [])];
    nuevos[idx][field] = val;
    setConfigEntrega({ ...configEntrega, dias_feriados: nuevos });
  };

  const handleAddFeriado = () => {
    if (!isAdminUser) return;
    setConfigEntrega({
      ...configEntrega,
      dias_feriados: [
        ...(configEntrega.dias_feriados || []),
        { fecha: "", dias_adicionales: 0 }
      ]
    });
  };

  const handleRemoveFeriado = (idx) => {
    if (!isAdminUser) return;
    setConfigEntrega({
      ...configEntrega,
      dias_feriados: (configEntrega.dias_feriados || []).filter((_, i) => i !== idx)
    });
  };

  const horariosEntrega = configEntrega.horarios_entrega || [];
  const diasFeriados = configEntrega.dias_feriados || [];

  return (
    <PreviewCard>
      <h2 className="ent-section-title">Configuración de entregas</h2>
      <form onSubmit={isAdminUser ? handleSaveEntregas : e => e.preventDefault()} className="entregas-form">
        {/* Días hábiles */}
        <fieldset className="ent-card">
          <legend>Días hábiles</legend>
          <div className="dias-habiles-list">
            {DIAS.map((dia, idx) => (
              <label key={dia} className="chk-dia">
                <input
                  type="checkbox"
                  checked={configEntrega.dias_habiles.includes(dia)}
                  onChange={handleDiasHabilesChange(idx)}
                  disabled={!isAdminUser}
                />
                <span>{dia[0] + dia.slice(1).toLowerCase()}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Procesamiento */}
        <fieldset className="ent-card">
          <legend>Procesamiento</legend>
          <div className="ent-row">
            <label>
              Tiempo de procesamiento (días)
              <input
                type="number"
                name="tiempo_procesamiento"
                value={configEntrega.tiempo_procesamiento}
                min={0}
                onChange={handleInputChange}
                className="input-short"
                disabled={!isAdminUser}
              />
            </label>
          </div>
        </fieldset>

        {/* Reglas para fines de semana */}
        <fieldset className="ent-card">
          <legend>Reglas para fines de semana</legend>
          <div className="ent-row">
            <label>
              <input
                type="checkbox"
                name="reglas_fin_semana.procesar_sabado"
                checked={configEntrega.reglas_fin_semana.procesar_sabado}
                onChange={handleInputChange}
                disabled={!isAdminUser}
              />
              Procesar sábado
            </label>
            <label>
              <input
                type="checkbox"
                name="reglas_fin_semana.procesar_domingo"
                checked={configEntrega.reglas_fin_semana.procesar_domingo}
                onChange={handleInputChange}
                disabled={!isAdminUser}
              />
              Procesar domingo
            </label>
          </div>
          <div className="ent-row">
            <label>
              Días adicionales sábado
              <input
                type="number"
                name="reglas_fin_semana.dias_adicionales_sabado"
                value={configEntrega.reglas_fin_semana.dias_adicionales_sabado}
                min={0}
                onChange={handleInputChange}
                className="input-short"
                disabled={!isAdminUser}
              />
            </label>
            <label>
              Días adicionales domingo
              <input
                type="number"
                name="reglas_fin_semana.dias_adicionales_domingo"
                value={configEntrega.reglas_fin_semana.dias_adicionales_domingo}
                min={0}
                onChange={handleInputChange}
                className="input-short"
                disabled={!isAdminUser}
              />
            </label>
          </div>
        </fieldset>

        {/* Horarios de entrega */}
        <fieldset className="ent-card">
          <legend>Horarios de entrega</legend>
          <ul className="horario-list">
            {horariosEntrega.length === 0 ? (
              <li className="horario-empty">No hay horarios configurados.</li>
            ) : (
              horariosEntrega.map((h, i) => (
                <li key={i} className="horario-item">
                  <span className="horario-label">{h.etiqueta}:</span>{" "}
                  <span className="horario-range">{h.inicio} - {h.fin}</span>
                </li>
              ))
            )}
          </ul>
          {/* Puedes agregar edición/agregado de horarios aquí, solo para admin */}
        </fieldset>

        {/* Días feriados */}
        <fieldset className="ent-card">
          <legend>Días feriados</legend>
          <div>
            {diasFeriados.length === 0 && (
              <div style={{ color: "#999", fontStyle: "italic" }}>No hay feriados configurados.</div>
            )}
            {diasFeriados.map((feriado, idx) => (
              <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: 4 }}>
                <input
                  type="date"
                  value={feriado.fecha}
                  onChange={e => handleFeriadoChange(idx, "fecha", e.target.value)}
                  disabled={!isAdminUser}
                />
                <input
                  type="number"
                  min={0}
                  value={feriado.dias_adicionales}
                  onChange={e => handleFeriadoChange(idx, "dias_adicionales", Number(e.target.value))}
                  style={{ width: 50 }}
                  disabled={!isAdminUser}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeriado(idx)}
                  style={{
                    marginLeft: 4,
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer"
                  }}
                  title="Eliminar feriado"
                  disabled={!isAdminUser}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddFeriado}
              style={{
                marginTop: 6,
                background: "#e9f5ff",
                border: "1px solid #c0dfff",
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer"
              }}
              disabled={!isAdminUser}
            >
              Agregar feriado
            </button>
          </div>
        </fieldset>

        {/* Mensajes */}
        {showSuccess && <div className="ent-success">¡Configuración guardada!</div>}
        {showError && <div className="ent-error">{showError}</div>}

        {/* Botón */}
        <div className="ent-btn-area">
          <button
            type="submit"
            className="ent-btn-guardar"
            disabled={!isAdminUser}
            title={!isAdminUser ? "Solo un administrador puede guardar cambios" : ""}
          >
            Guardar configuración
          </button>
          {!isAdminUser && (
            <div className="ent-error" style={{ marginTop: 12 }}>
              Permisos insuficientes: solo un administrador puede guardar y editar.
            </div>
          )}
        </div>
      </form>
    </PreviewCard>
  );
}