import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import {
  Menu, Mail, Shield, Trash2, UserPlus,
  RefreshCw, Search
} from "lucide-react";
import "./Usuarios.css";

// Componente logo de iniciales
function InitialsLogo({ nombre }) {
  const getInitials = (nombre) => {
    if (!nombre) return "";
    const palabras = nombre.trim().split(" ");
    if (palabras.length === 1) return palabras[0][0].toUpperCase();
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  };
  return (
    <div className="initials-logo" title={nombre}>
      {getInitials(nombre)}
    </div>
  );
}

// Panel de detalles de administrador tipo modal
function DetallesAdminModal({ admin, onClose }) {
  if (!admin) return null;
  const permisos = typeof admin.permisos === "string" ? JSON.parse(admin.permisos) : admin.permisos;
  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-content"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="detalles-header">
          <InitialsLogo nombre={admin.correo} />
          <h3 className="detalles-titulo">{admin.correo}</h3>
        </div>
        <div className="detalles-usuario">
          <div className="detalles-campo">
            <span className="detalles-etiqueta"><Mail size={16} style={{ marginRight: 6 }} />Correo:</span>
            <span className="detalles-valor">{admin.correo}</span>
          </div>
          <div className="detalles-campo">
            <span className="detalles-etiqueta"><Shield size={16} style={{ marginRight: 6 }} />Tipo Usuario:</span>
            <span className="detalles-valor">{admin.tipo_usuario}</span>
          </div>
          <div className="detalles-campo">
            <span className="detalles-etiqueta">Permisos:</span>
            <span className="detalles-valor">
              {permisos.accesoTotal && <span className="permisos-badge acceso-total">Acceso total</span>}
              {permisos.puedeEditar && <span className="permisos-badge puede-editar">Puede editar</span>}
              {permisos.soloLectura && <span className="permisos-badge solo-lectura">Solo lectura</span>}
              {(!permisos.accesoTotal && !permisos.puedeEditar && !permisos.soloLectura) && <span>—</span>}
            </span>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: 24 }}>
          <button className="btn-secundario" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// Panel de formulario de administrador tipo modal
function AdminFormModal({ onClose, onSubmit }) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("Admin");

  useEffect(() => {
    setCorreo("");
    setClave("");
    setTipoUsuario("Admin");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const permisosJSON = tipoUsuario === "Admin"
      ? { accesoTotal: true }
      : { soloLectura: true };
    onSubmit({ correo, clave, tipo_usuario: tipoUsuario, permisos: JSON.stringify(permisosJSON) });
  };

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-content"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <h2 className="panel-titulo">Nuevo Administrador</h2>
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo*</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña*</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo usuario*</label>
            <select
              value={tipoUsuario}
              onChange={(e) => setTipoUsuario(e.target.value)}
              className="form-control"
            >
              <option value="Admin">Admin</option>
              <option value="Usuario">Usuario (solo lectura)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Permisos*</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tipoUsuario === "Admin"}
                  disabled
                  tabIndex={0}
                />
                Acceso total
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tipoUsuario === "Usuario"}
                  disabled
                  tabIndex={0}
                />
                Solo lectura
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secundario" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primario">
              <UserPlus size={16} />
              Crear administrador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Badge de permisos
function PermisoBadge({ permisos }) {
  try {
    const json = typeof permisos === "string" ? JSON.parse(permisos) : permisos;
    if (json.accesoTotal) {
      return <span className="permisos-badge acceso-total">Acceso total</span>;
    }
    if (json.soloLectura) {
      return <span className="permisos-badge solo-lectura">Solo lectura</span>;
    }
    if (json.puedeEditar) {
      return <span className="permisos-badge puede-editar">Puede editar</span>;
    }
    return <span>—</span>;
  } catch {
    return <span>—</span>;
  }
}

// Función para verificar si el usuario logueado es admin
function esAdmin() {
  try {
    const adminObj = JSON.parse(localStorage.getItem("admin") || "{}");
    return (adminObj.tipo_usuario || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

// Componente principal Usuarios
export default function Usuarios() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'detalle'|'crear', admin: object }
  const [busqueda, setBusqueda] = useState("");
  const [permisoError, setPermisoError] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState(null); // Modal confirmación

  const isAdmin = esAdmin();

  useEffect(() => {
    console.log("Usuarios MOUNT");
    return () => {
      console.log("Usuarios UNMOUNT");
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const handleOverlayClick = () => setSidebarOpen(false);

  // Obtener administradores
  const fetchAdmins = () => {
    setLoading(true);
    fetch("/api/admin/usuarios")
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filtrar administradores por búsqueda
  const adminsFiltrados = admins.filter(admin =>
    busqueda.trim() === "" ||
    admin.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    admin.tipo_usuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Modal handlers
  const abrirDetalle = (admin) => {
    setPermisoError("");
    setModal({ type: "detalle", admin });
  };

  const abrirCreacion = () => {
    setPermisoError("");
    if (!isAdmin) {
      setPermisoError("Permisos insuficientes: solo un administrador puede crear nuevos administradores.");
      return;
    }
    setModal({ type: "crear", admin: null });
  };

  const cerrarModal = () => setModal(null);

  // Crear nuevo admin
  const handleCreate = (fields) => {
    const payload = {
      correo: fields.correo,
      clave: fields.clave,
      tipo_usuario: fields.tipo_usuario,
      permisos: fields.permisos,
      idperfil: 1,
    };
    const tipoUsuario = JSON.parse(localStorage.getItem("admin") || "{}").tipo_usuario || "";
    fetch("/api/admin/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tipo-Usuario": tipoUsuario.toLowerCase()
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Error al crear usuario");
        }
        cerrarModal();
        fetchAdmins();
      })
      .catch((e) => alert(e.message));
  };

  // Eliminar admin (corrige idusuario / id_usuario y agrega X-Tipo-Usuario en minúsculas)
  const handleDeleteUsuario = async (idusuario) => {
    const tipoUsuario = JSON.parse(localStorage.getItem("admin") || "{}").tipo_usuario || "";
    if (!isAdmin) {
      setPermisoError("Permisos insuficientes: solo un administrador puede eliminar usuarios.");
      return;
    }
    if (!idusuario) {
      alert("ID de usuario no válido");
      return;
    }
    try {
      const res = await fetch(`/api/admin/usuarios?id=${idusuario}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Tipo-Usuario": tipoUsuario.toLowerCase()
        }
      });
      const data = await res.json();
      if (data.ok) {
        setAdmins(admins.filter(u => (u.idusuario || u.id_usuario) !== idusuario));
        alert(data.message || "Usuario eliminado exitosamente");
      } else {
        alert(data.message || "No se pudo eliminar el usuario");
      }
    } catch (err) {
      alert("Error eliminando usuario");
    }
  };

  return (
    <div className="ha-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleOverlayClick={handleOverlayClick}
      />

      <div className="ha-main-content">
        {/* Header */}
        <header className="usuarios-header">
          <div className="usuarios-header-left">
            <button onClick={toggleSidebar} className="ha-menu-button">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="usuarios-title">
                <Shield size={20} />
                Gestión de Administradores
              </h1>
              <p className="usuarios-subtitle">
                Administra los usuarios con acceso al sistema
              </p>
            </div>
          </div>
        </header>

        <main className="usuarios-main">
          {/* Encabezado con búsqueda y botón agregar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
            <div className="filtro-busqueda" style={{ maxWidth: "300px" }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar administrador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              className={`btn-primario${!isAdmin ? " btn-primario-disabled" : ""}`}
              onClick={abrirCreacion}
              disabled={!isAdmin}
              title={!isAdmin ? "Solo un administrador puede crear nuevos usuarios" : ""}
            >
              <UserPlus size={16} />
              Nuevo Administrador
            </button>
          </div>

          {/* Mensaje de error de permisos */}
          {permisoError && (
            <div className="usuarios-error" style={{marginBottom: 20}}>{permisoError}</div>
          )}

          {/* Tabla de administradores */}
          {loading ? (
            <div className="cargando-container">
              <RefreshCw size={32} className="spinning" />
              <span>Cargando administradores...</span>
            </div>
          ) : (
            <div className="usuarios-table-container">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Permisos</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsFiltrados.length > 0 ? (
                    adminsFiltrados.map((admin, i) => (
                      <tr key={admin.idusuario || admin.id_usuario || i}>
                        <td>
                          <div className="usuario-info">
                            <InitialsLogo nombre={admin.correo} />
                            <span className="usuario-nombre">
                              {admin.correo.split("@")[0]}
                            </span>
                          </div>
                        </td>
                        <td className="usuario-correo">
                          <Mail size={16} style={{ marginRight: "var(--spacing-xs)" }} />
                          {admin.correo}
                        </td>
                        <td>
                          <PermisoBadge permisos={admin.permisos} />
                        </td>
                        <td className="usuario-tipo">
                          <Shield size={16} style={{ marginRight: "var(--spacing-xs)" }} />
                          {admin.tipo_usuario}
                        </td>
                        <td>
                          <div className="acciones-cell">
                            <button className="btn-secundario" onClick={() => abrirDetalle(admin)}>
                              Detalles
                            </button>
                            <button
                              className="btn-eliminar"
                              disabled={
                                !isAdmin ||
                                (admin.idusuario || admin.id_usuario) === 1
                              }
                              onClick={() => setDeleteCandidate(admin)}
                              title={
                                (admin.idusuario || admin.id_usuario) === 1
                                  ? "No puedes eliminar el administrador principal"
                                  : isAdmin
                                    ? "Eliminar usuario"
                                    : "Solo un administrador puede eliminar usuarios"
                              }
                              style={{
                                background: '#fff',
                                border: '1px solid #ff4d4f',
                                color: '#ff4d4f',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: (!isAdmin || (admin.idusuario || admin.id_usuario) === 1) ? 'not-allowed' : 'pointer',
                                opacity: (!isAdmin || (admin.idusuario || admin.id_usuario) === 1) ? 0.6 : 1,
                                transition: 'background 0.2s,border 0.2s'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="usuarios-empty">
                        No hay administradores registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Modal Detalles o Crear */}
        {modal && modal.type === "detalle" && (
          <DetallesAdminModal admin={modal.admin} onClose={cerrarModal} />
        )}
        {modal && modal.type === "crear" && (
          <AdminFormModal onClose={cerrarModal} onSubmit={handleCreate} />
        )}

        {/* Modal de confirmación de eliminación */}
        {deleteCandidate && (
          <div className="custom-modal-overlay" onClick={() => setDeleteCandidate(null)}>
            <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
              <h2 style={{ color: "#ff4d4f", display:'flex', alignItems:'center', gap:8 }}>
                <Trash2 size={28}/> Confirmar eliminación
              </h2>
              <p>
                ¿Seguro que deseas eliminar a <b>{deleteCandidate.correo}</b>?<br/>
                <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                  Esta acción no se puede deshacer.
                </span>
              </p>
              <div className="form-actions" style={{marginTop:24, display:'flex', gap:12}}>
                <button className="btn-secundario" onClick={() => setDeleteCandidate(null)}>
                  Cancelar
                </button>
                <button
                  className="btn-eliminar"
                  style={{
                    background: "#ff4d4f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 18px",
                    fontWeight: "bold"
                  }}
                  onClick={() => {
                    console.log("Eliminando admin:", deleteCandidate);
                    handleDeleteUsuario(deleteCandidate.idusuario || deleteCandidate.id_usuario);
                    setDeleteCandidate(null);
                  }}
                  disabled={(deleteCandidate.idusuario || deleteCandidate.id_usuario) === 1}
                >
                  <Trash2 size={18} style={{verticalAlign:'middle',marginRight:4}}/>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {sidebarOpen && <div className="ha-overlay" onClick={handleOverlayClick}></div>}
      </div>
    </div>
  );
}
