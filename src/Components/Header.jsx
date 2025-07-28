import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useStoreInfo } from "../config";
import UserMenuHeader from "./UserMenuHeader";
import "./Header.css";

function getUsuarioFromLocalStorage() {
  const usuarioStr = localStorage.getItem("usuario");
  if (!usuarioStr) return null;
  try {
    return JSON.parse(usuarioStr);
  } catch (e) {
    console.error("Error parsing usuario from localStorage", e);
    return null;
  }
}

export default function Header({ cartItems = [], onCart }) {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();
  const storeInfo = useStoreInfo();

  // Puedes usar un logo por defecto si no hay logo cargado aún
  const logoUrl = storeInfo.logoUrl;

  useEffect(() => {
    setUsuario(getUsuarioFromLocalStorage());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("usuario");
    navigate("/login", { replace: true });
  };

  const handleOrders = () => {
    navigate("/pedido-confirmado");
  };

  const handleLogoClick = () => {
    navigate("/"); // Navega a la página de inicio
  };

  const cartCount = cartItems.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

  useEffect(() => {
    if (onCart) {
      // Opcional: logs para depuración
    }
  }, [onCart]);

  return (
    <header
      className="header"
      style={{ "--header-bg": storeInfo.headerBg }}
    >
      <div className="header-inner">
        <div 
          className="header-logo" 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeInfo.name || "Logo"}
              style={{ maxHeight: 55, maxWidth: 120, objectFit: "contain" }}
            />
          ) : (
            <span className="logo-placeholder">{storeInfo.name || "Tienda"}</span>
          )}
        </div>
        <UserMenuHeader
          usuario={usuario}
          cartCount={cartCount}
          onCart={onCart}
          onOrders={handleOrders}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}

Header.propTypes = {
  cartItems: PropTypes.array,
  onCart: PropTypes.func,
};