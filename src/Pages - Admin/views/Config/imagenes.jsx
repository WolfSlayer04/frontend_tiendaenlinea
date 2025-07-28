import React from "react";

/**
 * Sección de configuración de imágenes (logo y logotipo)
 *
 * @param {object} props
 */
export function ImagenesSection({
  selectedOption,
  imageActualUrl,
  imagePreview,
  imageFile,
  imageExists,
  imageLoading,
  imageSuccess,
  imageError,
  saveImage,
  deleteImage,
  PreviewCard,
  setImageFile,
  setImagePreview,
  isAdminUser // <-- NUEVO: recibe este prop
}) {
  return (
    <form
      className="imagenes-form"
      onSubmit={isAdminUser ? (e) => saveImage(e, selectedOption) : (e) => e.preventDefault()}
    >
      <h3>{selectedOption === "logo" ? "Logo" : "Logotipo"}</h3>
      {imageActualUrl[selectedOption] && (
        <div style={{ margin: "20px 0" }}>
          <b>{selectedOption === "logo" ? "Logo actual:" : "Logotipo actual:"}</b>
          <div>
            <img
              src={imageActualUrl[selectedOption]}
              alt={`${selectedOption} actual`}
              style={{ maxHeight: 80, maxWidth: 140, borderRadius: 10, marginTop: 8 }}
              key={imageActualUrl[selectedOption]} // Forzar rerender al cambiar
            />
          </div>
        </div>
      )}
      <div className="imagenes-upload-row">
        <label className="imagenes-upload-label">
          <input
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={e => {
              if (!isAdminUser) return;
              const file = e.target.files[0];
              if (file) {
                // Revoca el preview anterior si existe
                if (imagePreview[selectedOption]) {
                  URL.revokeObjectURL(imagePreview[selectedOption]);
                }
                setImageFile(prev => ({ ...prev, [selectedOption]: file }));
                setImagePreview(prev => ({
                  ...prev,
                  [selectedOption]: URL.createObjectURL(file)
                }));
              }
            }}
            disabled={!isAdminUser}
          />
          <span className="imagenes-upload-btn" style={{ opacity: isAdminUser ? 1 : 0.5 }}>
            Seleccionar imagen
          </span>
        </label>
        {imagePreview[selectedOption] && (
          <div className="imagenes-preview-box">
            <img
              src={imagePreview[selectedOption]}
              alt={`Preview ${selectedOption}`}
              className="imagenes-preview-img"
              style={{ maxHeight: 100, maxWidth: 160, borderRadius: 12, marginTop: 8 }}
              key={imagePreview[selectedOption]} // Forzar rerender al cambiar
            />
          </div>
        )}
      </div>
      <p className="imagenes-hint">
        Formato recomendado: PNG o JPG. Tamaño máximo sugerido: 1MB.<br />
        {selectedOption === "logo"
          ? "El logo se mostrará en la cabecera de tu tienda."
          : "El logotipo puede ser una versión extendida o horizontal de tu marca."}
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          className="btn-guardar"
          disabled={
            !isAdminUser ||
            !imageFile[selectedOption] ||
            imageLoading[selectedOption]
          }
          title={!isAdminUser ? "Solo un administrador puede guardar o actualizar imágenes" : ""}
        >
          {imageExists[selectedOption] ? "Actualizar" : "Guardar"}
        </button>
        {imageExists[selectedOption] && (
          <button
            type="button"
            className="btn-guardar"
            style={{ background: "#d32f2f" }}
            onClick={() => isAdminUser && deleteImage(selectedOption)}
            disabled={!isAdminUser || imageLoading[selectedOption]}
            title={!isAdminUser ? "Solo un administrador puede eliminar imágenes" : ""}
          >
            Eliminar
          </button>
        )}
      </div>
      {!isAdminUser && (
        <div className="msg-guardado error" style={{ marginTop: 16 }}>
          Permisos insuficientes: solo un administrador puede guardar, actualizar o eliminar imágenes.
        </div>
      )}
      {imageLoading[selectedOption] && <div className="msg-guardado">Procesando...</div>}
      {imageSuccess[selectedOption] && <div className="msg-guardado exito">{imageSuccess[selectedOption]}</div>}
      {imageError[selectedOption] && <div className="msg-guardado error">{imageError[selectedOption]}</div>}
    </form>
  );
}