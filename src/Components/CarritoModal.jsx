import React, { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CarritoModal.css";

export default function CarritoModal({ open, onClose, items, setItems }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Log para depuración: ver si el modal está intentando renderizarse
  console.log("CarritoModal open:", open);

  useEffect(() => {
    if (open) {
      fetchCartItems();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
    // eslint-disable-next-line
  }, [open]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito");
      if (!response.ok) throw new Error("Error fetching cart items");
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (idproducto) => {
    try {
      const response = await fetch(`https://logica-tiendaenlina.onrender.com/api/carrito/eliminar/${idproducto}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to remove item");
      setItems(items.filter(item => item.idproducto !== idproducto));
    } catch { console.error(); }
  };

  // Cambios: Usar precio_final si existe, sino precio (legacy)
  const getItemUnitPrice = (item) => {
    if (typeof item.precio_final === "number" && !isNaN(item.precio_final)) {
      return item.precio_final;
    }
    if (typeof item.precio_final === "string" && item.precio_final !== "") {
      return parseFloat(item.precio_final) || 0;
    }
    if (typeof item.precio === "number" && !isNaN(item.precio)) {
      return item.precio;
    }
    if (typeof item.precio === "string" && item.precio !== "") {
      return parseFloat(item.precio) || 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = getItemUnitPrice(item) * parseFloat(item.cantidad || 0);
      return total + itemTotal;
    }, 0).toFixed(2);
  };

  if (!open) return null;

  return (
    <div className={`carrito-modal-overlay ${open ? "modal-active" : ""}`}>
      <div className="carrito-modal-content">
        <div className="carrito-modal-header">
          <h2 className="carrito-modal-title">
            <ShoppingCart size={22} className="mr-2" />
            Tu Carrito
          </h2>
          <button className="carrito-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="carrito-modal-body">
          {loading ? (
            <div className="carrito-loading">
              <div className="spinner"></div>
              <p>Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="carrito-empty">
              <div className="carrito-empty-icon">
                <ShoppingCart size={48} />
              </div>
              <p>Tu carrito está vacío</p>
              <button className="continue-shopping-btn" onClick={onClose}>
                Continuar comprando
              </button>
            </div>
          ) : (
            <>
              <div className="carrito-items">
                {items.map(item => {
                  const unitPrice = getItemUnitPrice(item);
                  return (
                    <div key={item.idproducto} className="carrito-item">
                      <div className="carrito-item-info">
                        <h3 className="carrito-item-title">
                          {item.descripcion || item.nombre || "Producto"}
                        </h3>
                        <p className="carrito-item-details">
                          {item.cantidad} unidades x ${unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="carrito-item-price">
                        ${(unitPrice * parseFloat(item.cantidad || 0)).toFixed(2)}
                      </div>
                      <button
                        className="carrito-item-remove"
                        onClick={() => handleRemoveItem(item.idproducto)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="carrito-total">
                <span>Total:</span>
                <span className="carrito-total-amount">${calculateTotal()}</span>
              </div>
              <div className="carrito-actions">
                <button className="checkout-btn" onClick={() => navigate("/carrito")}>
                  Realizar Pedido
                </button>
                <button className="continue-shopping-btn" onClick={onClose}>
                  Seguir Comprando
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}