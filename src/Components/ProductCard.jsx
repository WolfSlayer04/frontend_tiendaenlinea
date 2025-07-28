import React from "react";
import { ShoppingCart } from "lucide-react";
import "./ProductCard.css"

export default function ProductCard({ product, onShowModal }) {
  // Mostrar precio con IVA ya calculado si existe, sino mostrar el base
  const precioMostrar = 
    typeof product.precio_final === "number" && !isNaN(product.precio_final)
      ? product.precio_final
      : (
          typeof product.precio1 === "number" && !isNaN(product.precio1)
            ? product.precio1
            : ""
        );

  return (
    <div className="product-card-modern" data-category={product.categoria}>
      <div className="product-card-header">
        <h3 className="product-title-modern" title={product.nombre || product.descripcion || ""}>
          {(product.nombre || product.descripcion || "Producto sin nombre").toUpperCase()}
        </h3>
        {product.categoria && <span className="product-chip">{product.categoria}</span>}
      </div>
      <p className="product-desc-modern" title={product.descripcion}>
        {product.descripcion}
      </p>
      <div className="product-price-modern">
        <span className="product-price-label">Precio:</span>{" "}
        <span className="product-price-value">
          {precioMostrar !== "" ? `$${precioMostrar.toFixed(2)}` : "—"}
        </span>
        
      </div>
      <button className="product-btn-modern" onClick={() => onShowModal(product)}>
        <span className="btn-text">Agregar</span>
        <span className="btn-icon">
          <ShoppingCart size={18} />
        </span>
      </button>
    </div>
  );
}