import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "./CarritoPage.css";

export default function CarritoPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false); // Nuevo estado para bloquear acciones
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito");
      if (!res.ok) throw new Error("Error al cargar el carrito");
      const data = await res.json();
      setCart(data || []);
    } catch {
      setCart([]);
      setError("No se pudo cargar el carrito. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (item, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setProcessing(true);
    try {
      const res = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito/actualizar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idproducto: Number(item.idproducto),
          cantidad: Number(nuevaCantidad)
        }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar la cantidad");
      // Actualiza el carrito con la respuesta del servidor para evitar inconsistencias
      await fetchCart();
      setError("");
    } catch {
      setError("No se pudo actualizar la cantidad. Intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (idproducto) => {
    setProcessing(true);
    try {
      const res = await fetch(`https://logica-tiendaenlina.onrender.com/api/carrito/eliminar/${idproducto}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo quitar el producto");
      await fetchCart();
      setError("");
    } catch {
      setError("No se pudo quitar el producto. Intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = async () => {
    setProcessing(true);
    try {
      const res = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito/vaciar", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo vaciar el carrito");
      await fetchCart();
      setError("");
    } catch {
      setError("No se pudo vaciar el carrito. Intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = () => {
    navigate("/realizar-pedido");
  };

  const total = cart.reduce((sum, i) => sum + Number(i.precio) * Number(i.cantidad), 0);

  if (loading) {
    return (
      <>
        <Header />
        <div className="carrito-container">Cargando carrito...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="carrito-container">
        <div className="carrito-actions-row">
          <button
            className="carrito-volver-btn"
            onClick={() => navigate("/")}
            disabled={processing}
          >
            Volver a inicio
          </button>
        </div>
        {error && (
          <div className="carrito-error" role="alert">
            {error}
          </div>
        )}
        {cart.length === 0 ? (
          <div className="carrito-empty">
            <h3>Tu carrito está vacío</h3>
          </div>
        ) : (
          <>
            <ul className="carrito-list">
              {cart.map((item) => (
                <li key={item.idproducto} className="carrito-item">
                  <div className="carrito-item-details">
                    <h3>{item.descripcion}</h3>
                    <p>Precio: ${Number(item.precio).toFixed(2)}</p>
                    <div className="carrito-cantidad-row">
                      <span className="carrito-cantidad-label">Cantidad:</span>
                      <button
                        className="carrito-modal-cantidad-btn"
                        onClick={() => handleUpdate(item, item.cantidad - 1)}
                        disabled={item.cantidad <= 1 || processing}
                        title="Disminuir"
                        type="button"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < 1) return;
                          handleUpdate(item, val);
                        }}
                        className="carrito-cantidad-input"
                        style={{ appearance: "textfield" }}
                        disabled={processing}
                      />
                      <button
                        className="carrito-modal-cantidad-btn"
                        onClick={() => handleUpdate(item, item.cantidad + 1)}
                        title="Aumentar"
                        type="button"
                        disabled={processing}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="carrito-item-totcol">
                    <span className="carrito-item-total">
                      ${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}
                    </span>
                    <button
                      className="carrito-item-quitar-btn"
                      onClick={() => handleDelete(item.idproducto)}
                      disabled={processing}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="carrito-total-row">
              <button
                onClick={handleClear}
                className="carrito-vaciar-btn"
                disabled={processing}
              >
                Vaciar carrito
              </button>
              <span className="carrito-total-txt">
                Total: ${total.toFixed(2)}
              </span>
              <button
                onClick={handleCheckout}
                className="carrito-checkout-btn"
                disabled={processing}
              >
                Realizar pedido
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}