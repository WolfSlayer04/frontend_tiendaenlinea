import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import {
  Menu, Search, RefreshCw, Building,
  Store, Mail, Phone,
  ChevronLeft, ChevronRight
} from "lucide-react";
import DetallesClientePanel from "./DetallesClientePanel";
import "./Clientes.css";

// Iniciales pequeñas para las tarjetas
function InitialsLogo({ nombre }) {
  const getInitials = (nombreTexto) => {
    if (!nombreTexto) return "";
    const palabras = nombreTexto.trim().split(" ");
    if (palabras.length === 1) {
      return palabras[0][0].toUpperCase();
    } else {
      return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
    }
  };
  return (
    <div className="initials-logo" title={nombre}>
      {getInitials(nombre)}
    </div>
  );
}

export default function Clientes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const limit = 9;

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const handleOverlayClick = () => setSidebarOpen(false);

  useEffect(() => {
    setLoading(true);
    fetch("https://logica-tiendaenlina.onrender.com/api/admin/clientes")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setClientes([]);
        setLoading(false);
      });
  }, []);

  const clientesFiltrados = clientes.filter(cli => {
    const nombre = cli.usuario?.nombre_completo?.toLowerCase() || "";
    const correo = cli.usuario?.correo?.toLowerCase() || "";
    const tienda = cli.tienda?.nombre_tienda?.toLowerCase() || "";
    return (
      nombre.includes(busqueda.toLowerCase()) ||
      correo.includes(busqueda.toLowerCase()) ||
      tienda.includes(busqueda.toLowerCase())
    );
  });

  useEffect(() => {
    setPage(1);
  }, [busqueda]);

  const total = clientesFiltrados.length;
  const totalPages = Math.ceil(total / limit);

  const clientesPaginados = clientesFiltrados.slice(
    (page - 1) * limit,
    page * limit
  );

  const handleRowClick = (cli) => {
    setSelectedCliente(cli);
  };

  const closeDetails = () => {
    setSelectedCliente(null);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (page >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(page - 1);
        pageNumbers.push(page);
        pageNumbers.push(page + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="ha-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleOverlayClick={handleOverlayClick}
      />

      <div className="ha-main-content">
        <header className="clientes-header">
          <div className="clientes-header-left">
            <button onClick={toggleSidebar} className="ha-menu-button">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="clientes-title">
                <Building size={20} />
                Clientes y Tiendas
              </h1>
              <p className="clientes-subtitle">
                Administra los clientes y sus tiendas asociadas
              </p>
            </div>
          </div>
        </header>

        <main className="clientes-main">
          {/* Búsqueda */}
          <div className="clientes-filtros">
            <div className="filtro-busqueda">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o tienda..."
                value={busqueda}
                onChange={handleBusquedaChange}
              />
            </div>
          </div>

          {/* Detalles tipo panel-modal */}
          {selectedCliente && (
            <DetallesClientePanel
              cliente={selectedCliente}
              onClose={closeDetails}
            />
          )}

          {/* Tarjetas de clientes */}
          {loading ? (
            <div className="cargando-container">
              <RefreshCw size={32} className="spinning" />
              <span>Cargando clientes...</span>
            </div>
          ) : (
            <div className="clientes-tarjetas-lista">
              {clientesPaginados.length > 0 ? (
                clientesPaginados.map((cli, i) => (
                  <div className="cliente-tarjeta" key={i}>
                    <div className="cliente-tarjeta-header">
                      <InitialsLogo nombre={cli.usuario?.nombre_completo || "N/A"} />
                      <div className="cliente-tarjeta-info">
                        <div className="cliente-tarjeta-nombre">
                          <strong>{cli.usuario?.nombre_completo || "N/A"}</strong>
                        </div>
                        <div className="cliente-tarjeta-dato">
                          <Mail size={15} style={{ marginRight: 6 }} />
                          {cli.usuario?.correo || "N/A"}
                        </div>
                        {cli.usuario?.telefono && (
                          <div className="cliente-tarjeta-dato">
                            <Phone size={15} style={{ marginRight: 6 }} />
                            {cli.usuario?.telefono}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="cliente-tarjeta-extra">
                      <div className="cliente-tarjeta-campo">
                        <span className="cliente-tarjeta-campo-label">
                          <Store size={14} style={{ marginRight: 4 }} /> Tienda:
                        </span>
                        {cli.tienda?.nombre_tienda ? (
                          <span className="badge-tienda">{cli.tienda.nombre_tienda}</span>
                        ) : (
                          <span className="no-data">Sin tienda</span>
                        )}
                      </div>
                      <div className="cliente-tarjeta-campo">
                        <span className="cliente-tarjeta-campo-label">
                          Tipo:
                        </span>
                        <span className="badge-tienda">
                          {cli.tienda?.tipo_tienda ? cli.tienda.tipo_tienda : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="cliente-tarjeta-footer">
                      <button
                        className="btn-detalles"
                        onClick={() => handleRowClick(cli)}
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="clientes-empty">
                  No hay clientes que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}

          {/* Paginación */}
          {!loading && clientesFiltrados.length > 0 && totalPages > 0 && (
            <div className="paginacion">
              <span className="paginacion-info">
                Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total} clientes
              </span>
              <button
                className="paginacion-button"
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="Primera página"
              >
                <ChevronLeft size={14} style={{ marginRight: -4 }} />
                <ChevronLeft size={14} />
              </button>
              <button
                className="paginacion-button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="paginacion-pagenum">
                {getPageNumbers().map((pageNum, index) => (
                  <button
                    key={index}
                    className={`paginacion-button ${pageNum === page ? "active" : ""}`}
                    onClick={() => typeof pageNum === "number" && setPage(pageNum)}
                    disabled={pageNum === "..."}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                className="paginacion-button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                title="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="paginacion-button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                title="Última página"
              >
                <ChevronRight size={14} />
                <ChevronRight size={14} style={{ marginLeft: -4 }} />
              </button>
            </div>
          )}
        </main>

        {sidebarOpen && <div className="ha-overlay" onClick={handleOverlayClick}></div>}
      </div>
    </div>
  );
}