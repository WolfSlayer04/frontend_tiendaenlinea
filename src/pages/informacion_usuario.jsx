import React, { useEffect, useState } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { MapPin, Mail, Smartphone, Edit2, ShoppingBag, Trash2, X } from "lucide-react";
import "./informacion_usuario.css";

export default function InformacionUsuario() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nombre_completo: "", telefono: "", clave_nueva: "" });
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState(null);

  // SIEMPRE declara hooks aquí, antes de cualquier return/if!
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchPerfil();
    // eslint-disable-next-line
  }, []);

  function fetchPerfil() {
    setLoading(true);
    setMsg("");
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
      setLoading(false);
      return;
    }
    try {
      const usuario = JSON.parse(usuarioStr);
      const id_usuario = usuario.id_usuario || usuario.IDUsuario;
      fetch(`https://logica-tiendaenlina.onrender.com/api/perfil?id_usuario=${id_usuario}`)
        .then((res) => res.json())
        .then((data) => {
          setPerfil(data.data);
          setEditForm({
            nombre_completo: data.data?.usuario?.nombre_completo || "",
            telefono: data.data?.usuario?.telefono || "",
            clave_nueva: "",
          });
        })
        .catch(() => {
          setPerfil(null);
        })
        .finally(() => setLoading(false));
    } catch {
      setPerfil(null);
      setLoading(false);
    }
  }

  // Editar perfil
  function handleEditProfile(e) {
    e.preventDefault();
    setMsg("");
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) return;
    try {
      const usuario = JSON.parse(usuarioStr);
      const id_usuario = usuario.id_usuario || usuario.IDUsuario;
      fetch("https://logica-tiendaenlina.onrender.com/api/usuarios/editar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario,
          nombre_completo: editForm.nombre_completo,
          telefono: editForm.telefono,
          clave_nueva: editForm.clave_nueva,
        }),
      })
        .then((res) => res.json())
        .then(() => {
          setMsg("Perfil actualizado");
          setEditOpen(false);
          setEditForm({ ...editForm, clave_nueva: "" });
          fetchPerfil();
        })
        .catch(() => {
          setMsg("No se pudo actualizar el perfil.");
        });
    } catch {
      setMsg("No se pudo actualizar el perfil.");
    }
  }

  // Eliminar tienda
  function handleDeleteStore(id_tienda) {
    if (!window.confirm("¿Seguro que quieres eliminar esta tienda?")) return;
    setDeleting(id_tienda);
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
      setDeleting(null);
      return;
    }
    try {
      const usuario = JSON.parse(usuarioStr);
      const id_usuario = usuario.id_usuario || usuario.IDUsuario;
      fetch(`https://logica-tiendaenlina.onrender.com/api/tiendas/eliminar?id_tienda=${id_tienda}&id_usuario=${id_usuario}`, {
        method: "DELETE"
      })
        .then((res) => res.json())
        .then((data) => {
          setMsg(data.message || "Tienda eliminada");
          setDeleting(null);
          fetchPerfil();
        })
        .catch(() => {
          setMsg("No se pudo eliminar la tienda.");
          setDeleting(null);
        });
    } catch {
      setMsg("No se pudo eliminar la tienda.");
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="main-container">
        <Header />
        <main className="main-content">
          <div className="info-user-loading">Cargando información...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="main-container">
        <Header />
        <main className="main-content">
          <div className="info-user-loading">No se encontró información de usuario.</div>
        </main>
        <Footer />
      </div>
    );
  }

  const { usuario, tiendas, total_pedidos } = perfil;

  // Imagen de perfil simple basada en nombre
  const profileImage =
    usuario.avatar ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(usuario.nombre_completo || usuario.correo || "User") +
      "&background=254441&color=fff&size=160";

  return (
    <div className="main-container">
      <Header />
      <main className="main-content" style={{ minHeight: "74vh" }}>
        {isMobile ? (
          <div className="user-profile-mobile-wrapper">
            {/* Tarjeta azul superior */}
            <div className="user-profile-mobile-top">
              <div className="user-profile-mobile-avatar-box">
                <img className="user-profile-mobile-avatar" src={profileImage} alt="Foto de perfil" />
              </div>
              <div className="user-profile-mobile-name">{usuario.nombre_completo}</div>
              <div className="user-profile-mobile-role">{usuario.tipo_usuario === "dueño" ? "Dueño de tienda" : "Cliente"}</div>
              <div className="user-profile-mobile-stats-row">
                <div className="user-profile-mobile-stat">
                  <div className="user-profile-mobile-stat-number">{total_pedidos ?? 0}</div>
                  <div className="user-profile-mobile-stat-label">Pedidos</div>
                </div>
                <div className="user-profile-mobile-stat">
                  <div className="user-profile-mobile-stat-number">{tiendas?.length ?? 0}</div>
                  <div className="user-profile-mobile-stat-label">Tiendas</div>
                </div>
              </div>
              <button className="user-profile-mobile-edit-btn" title="Editar perfil" onClick={() => setEditOpen(true)}>
                <Edit2 size={20} />
              </button>
            </div>

            {/* Información personal */}
            <div className="user-profile-mobile-info-list">
              <div className="user-profile-mobile-info-item">
                <Mail size={18} className="user-profile-mobile-info-icon" />
                <span>{usuario.correo}</span>
              </div>
              <div className="user-profile-mobile-info-item">
                <Smartphone size={18} className="user-profile-mobile-info-icon" />
                <span>{usuario.telefono || "Sin teléfono"}</span>
              </div>
              <div className="user-profile-mobile-info-item">
                <MapPin size={18} className="user-profile-mobile-info-icon" />
                <span>{tiendas?.[0]?.ciudad && tiendas[0].estado ? `${tiendas[0].ciudad}, ${tiendas[0].estado}` : "Sin ubicación"}</span>
              </div>
            </div>

            {/* Tiendas asociadas */}
            <div className="user-profile-section">
              <div className="user-profile-section-title">
                <ShoppingBag size={18} />
                Tiendas asociadas ({tiendas?.length || 0})
              </div>
              {tiendas && tiendas.length > 0 ? (
                <div className="user-profile-tiendas-grid">
                  {tiendas.map((t) => (
                    <div key={t.id_tienda} className="user-profile-tienda-box">
                      <div className="user-profile-tienda-header">
                        <div>
                          <div className="user-profile-tienda-nombre">{t.nombre_tienda}</div>
                          <div className="user-profile-tienda-ubic">
                            <MapPin size={14} />
                            {t.ciudad}, {t.estado}
                          </div>
                        </div>
                        <span className={`user-profile-tienda-status user-profile-tienda-status-${t.estatus}`}>
                          {t.estatus}
                        </span>
                      </div>
                      {tiendas.filter(tt => tt.estatus === "activo").length > 1 && t.estatus === "activo" && (
                        <button
                          className="user-profile-delete-store-btn"
                          onClick={() => handleDeleteStore(t.id_tienda)}
                          disabled={deleting === t.id_tienda}
                          title="Eliminar tienda"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="user-profile-row">
                  <span>No tienes tiendas asociadas.</span>
                </div>
              )}
            </div>

            {msg && (
              <div className="user-message" role="alert">
                {msg}
              </div>
            )}
          </div>
        ) : (
          <div className="user-profile-desktop-wrapper">
            {/* Lado izquierdo: Avatar y stats */}
            <div className="user-profile-desktop-left">
              <img className="user-profile-desktop-avatar" src={profileImage} alt="Foto de perfil" />
              <div className="user-profile-desktop-name">{usuario.nombre_completo}</div>
              <div className="user-profile-desktop-role">{usuario.tipo_usuario === "dueño" ? "Dueño de tienda" : "Cliente"}</div>
              <div className="user-profile-desktop-stats-row">
                <div className="user-profile-desktop-stat">
                  <div className="user-profile-desktop-stat-number">{total_pedidos ?? 0}</div>
                  <div className="user-profile-desktop-stat-label">Pedidos</div>
                </div>
                <div className="user-profile-desktop-stat">
                  <div className="user-profile-desktop-stat-number">{tiendas?.length ?? 0}</div>
                  <div className="user-profile-desktop-stat-label">Tiendas</div>
                </div>
              </div>
              <button className="user-profile-desktop-edit-btn" title="Editar perfil" onClick={() => setEditOpen(true)}>
                <Edit2 size={22} />
              </button>
            </div>
            {/* Lado derecho: info y tiendas */}
            <div className="user-profile-desktop-right">
              <div>
                <div className="user-profile-desktop-info-list">
                  <div className="user-profile-desktop-info-item">
                    <Mail size={20} className="user-profile-desktop-info-icon" />
                    <span>{usuario.correo}</span>
                  </div>
                  <div className="user-profile-desktop-info-item">
                    <Smartphone size={20} className="user-profile-desktop-info-icon" />
                    <span>{usuario.telefono || "Sin teléfono"}</span>
                  </div>
                  <div className="user-profile-desktop-info-item">
                    <MapPin size={20} className="user-profile-desktop-info-icon" />
                    <span>{tiendas?.[0]?.ciudad && tiendas[0].estado ? `${tiendas[0].ciudad}, ${tiendas[0].estado}` : "Sin ubicación"}</span>
                  </div>
                </div>
                {msg && (
                  <div className="user-message" role="alert">
                    {msg}
                  </div>
                )}
              </div>
              <div className="user-profile-section">
                <div className="user-profile-section-title">
                  <ShoppingBag size={20} />
                  Tiendas asociadas ({tiendas?.length || 0})
                </div>
                {tiendas && tiendas.length > 0 ? (
                  <div className="user-profile-tiendas-grid">
                    {tiendas.map((t) => (
                      <div key={t.id_tienda} className="user-profile-tienda-box">
                        <div className="user-profile-tienda-header">
                          <div>
                            <div className="user-profile-tienda-nombre">{t.nombre_tienda}</div>
                            <div className="user-profile-tienda-ubic">
                              <MapPin size={15} />
                              {t.ciudad}, {t.estado}
                            </div>
                          </div>
                          <span className={`user-profile-tienda-status user-profile-tienda-status-${t.estatus}`}>
                            {t.estatus}
                          </span>
                        </div>
                        {tiendas.filter(tt => tt.estatus === "activo").length > 1 && t.estatus === "activo" && (
                          <button
                            className="user-profile-delete-store-btn"
                            onClick={() => handleDeleteStore(t.id_tienda)}
                            disabled={deleting === t.id_tienda}
                            title="Eliminar tienda"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="user-profile-row">
                    <span>No tienes tiendas asociadas.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {/* MODAL EDITAR PERFIL */}
      {editOpen && (
        <ModalProfileEdit
          form={editForm}
          setForm={setEditForm}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditProfile}
        />
      )}
      <Footer />
    </div>
  );
}

// MODAL: Editar perfil
function ModalProfileEdit({ form, setForm, onClose, onSubmit }) {
  return (
    <div className="user-modal-bg">
      <div className="user-modal-card">
        <button className="user-modal-close" onClick={onClose}>
          <X size={22} />
        </button>
        <h2 className="user-modal-title">Editar perfil</h2>
        <form onSubmit={onSubmit} className="user-modal-form">
          <label>Nombre completo</label>
          <input
            value={form.nombre_completo}
            onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))}
            required
          />
          <label>Teléfono</label>
          <input
            value={form.telefono}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
            required
          />
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={form.clave_nueva}
            onChange={e => setForm(f => ({ ...f, clave_nueva: e.target.value }))}
            placeholder="(Dejar vacío para no cambiar)"
          />
          <button className="user-modal-btn" type="submit">
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}