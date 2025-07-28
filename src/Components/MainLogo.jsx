import React from "react";
import { useNavigate } from "react-router-dom";

export default function MainLogo() {
  const navigate = useNavigate();

  return (
    <div className="logo-flex" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
      <img
        src="/logoprincipal/logo (1).png"
        alt="Logo Torrito"
        className="logo-img"
        style={{ height: 40, maxWidth: 180 }}
      />
    </div>
  );
}