import React, { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import "./ProductoModal.css";

export default function ProductoModal({ product, isOpen, onClose, onAddToCart }) {
  const [cantidad, setCantidad] = useState(parseInt(product.unidades_minimas, 10) || 1);
  const minUnits = parseInt(product.unidades_minimas, 10) || 1;

  useEffect(() => {
    if (isOpen) setCantidad(minUnits);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen, minUnits]);

  if (!isOpen) return null;

  // Cambia aquí: usa precio_final si existe, si no precio1
  const precio =
    typeof product.precio_final === "number" && !isNaN(product.precio_final)
      ? product.precio_final
      : parseFloat(product.precio1) || 0;
  const displayPrecio = () => (precio > 0 ? precio.toFixed(2) : "Consultar");

  const handleCantidadChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= minUnits) setCantidad(val);
  };

  return (
    <div className={`modal-overlay${isOpen ? " modal-active" : ""}`}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          <X size={22} />
        </button>
        <div className="modal-body">
          <h2 className="modal-title">
            {product.descripcion || product.nombre || "Producto sin nombre"}
          </h2>
          <div className="modal-desc">{product.descripcion || ""}</div>
          <hr className="modal-divider" />
          <div className="modal-precio-row">
            <div className="modal-precio-label">Precio final</div>
            <div className="modal-precio">
              ${displayPrecio()}
              {typeof product.iva === "number" && product.iva > 0 && (
                <span className="modal-iva-chip"> IVA incluido</span>
              )}
            </div>
          </div>
          <div className="modal-cantidad-row">
            <label htmlFor="cantidad" className="modal-cantidad-label">
              Cantidad:
            </label>
            <div className="cantidad-control-group">
              <button
                className="cantidad-btn"
                onClick={() => setCantidad((p) => Math.max(minUnits, p - 1))}
                disabled={cantidad <= minUnits}
                aria-label="Disminuir cantidad"
                type="button"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                id="cantidad"
                min={minUnits}
                value={cantidad}
                onChange={handleCantidadChange}
                className="modal-cantidad-input"
              />
              <button
                className="cantidad-btn"
                onClick={() => setCantidad((p) => p + 1)}
                aria-label="Aumentar cantidad"
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
        <button
          className="add-cart-btn"
          onClick={() => onAddToCart(product, cantidad, precio)}
        >
          <ShoppingCart size={20} />
          <span>Añadir al carrito</span>
        </button>
      </div>
    </div>
  );
}