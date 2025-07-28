import React, { useEffect } from "react";
import { Check, X } from "lucide-react";
import "./Toast.css";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Icono según tipo
  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="icon" size={20} />;
      case "error":
        return <X className="icon" size={20} />;
      default:
        return <Check className="icon" size={20} />;
    }
  };

  // Clase para color según tipo
  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "info":
        return "info";
      default:
        return "success";
    }
  };

  return (
    <div className={`toast-notification ${getTypeClass()}`}>
      <div className="toast-icon">{getIcon()}</div>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
        <X size={16} className="icon" />
      </button>
    </div>
  );
}