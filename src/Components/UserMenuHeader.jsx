import React, { useRef, useState, useEffect } from "react";
import { User, ShoppingCart, ShoppingBag, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./UserMenuHeader.css"

export default function UserMenuHeader({ usuario, onLogout, cartCount, onCart, onOrders }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleClick = () => setOpen((v) => !v);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleProfile = () => {
    setOpen(false);
    navigate("/perfil");
  };

  const handleCartClick = () => {
    onCart && onCart();
  };

  return (
    <div className="header-actions-horizontal">
      <button
        type="button"
        className="cart-btn"
        onClick={handleCartClick}
        style={{ position: "relative" }}
      >
        <ShoppingCart size={20} className="cart-icon" />
        <span className="cart-btn-text">Carrito</span>
        {cartCount > 0 && (
          <span className="cart-badge">{cartCount}</span>
        )}
      </button>
      <button type="button" className="orders-btn" onClick={onOrders}>
        <ShoppingBag size={20} className="orders-icon" />
        <span className="orders-btn-text">Pedidos</span>
      </button>
      <div className="user-popover-container" ref={menuRef}>
        <button type="button" className="user-popover-trigger" onClick={handleClick} aria-label="Menú de usuario">
          <User size={28} className="user-popover-icon" />
        </button>
        {open && usuario && (
          <div className="user-popover-menu">
            <div className="user-popover-info">
              <span className="user-popover-name">
                ¡Hola, {usuario?.nombre_completo || usuario?.nombre || usuario?.correo}!
              </span>
              {/* <span className="user-popover-email">{usuario?.correo}</span> */}
            </div>
            <button
              type="button"
              className="user-popover-config"
              onClick={handleProfile}
              style={{ display: "flex", alignItems: "center", gap: 7, width: "100%" }}
            >
              <Settings size={17} /> Configuración
            </button>
            <button type="button" className="user-popover-logout" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
        {open && !usuario && (
          <div className="user-popover-menu">
            <div className="user-popover-info">
              <span className="user-popover-name">
                ¡Bienvenido!
              </span>
            </div>
            <a href="/login" className="user-popover-logout" style={{ textAlign: "center" }}>Iniciar Sesión</a>
          </div>
        )}
      </div>
    </div>
  );
}