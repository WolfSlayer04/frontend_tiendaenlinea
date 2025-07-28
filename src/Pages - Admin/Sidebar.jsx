import React, { useState, useEffect } from 'react';
import {
  Home, Users, Package, ShoppingCart, Settings, User,
  BarChart2, DollarSign, Calendar, FileText
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [pendingOrders, setPendingOrders] = useState(0);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    fetch('https://logica-tiendaenlina.onrender.com/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setPendingOrders(data.pedidos_pendientes_mes ?? 0);
      })
      .catch(() => setPendingOrders(0));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('admin');
    if (stored) {
      try {
        setAdminInfo(JSON.parse(stored));
      } catch {
        setAdminInfo(null);
      }
    }
  }, []);

  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/admin' },
    { 
      icon: ShoppingCart, 
      label: 'Pedidos', 
      path: '/admin/pedidos', 
      badge: pendingOrders > 0 ? pendingOrders : undefined 
    },
    { icon: Package, label: 'Productos', path: '/admin/productos' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: User, label: 'Clientes', path: '/admin/clientes' },
    { icon: FileText, label: 'Sucursales', path: '/admin/sucursales'},
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleNav = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <>
      <aside className="ha-sidebar open">
        <div className="ha-sidebar-header">
          <div className="ha-brand">
            <div className="ha-brand-icon">A</div>
            <span className="ha-sidebar-title">Panel</span>
          </div>
        </div>
        
        <nav className="ha-sidebar-nav">
          {menuItems.map((item, idx) => (
            <a
              key={idx}
              href={item.path}
              className={`ha-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={(e) => handleNav(e, item.path)}
            >
              <item.icon size={18} className="ha-sidebar-icon" />
              <span className="ha-sidebar-label">{item.label}</span>
              {item.badge && (
                <span className="ha-sidebar-badge">{item.badge}</span>
              )}
            </a>
          ))}
        </nav>
        
        <div className="ha-sidebar-footer">
          <div className="ha-user-info">
            <div className="ha-user-avatar">
              <span>{adminInfo?.tipo_usuario?.[0] || 'A'}</span>
            </div>
            <div className="ha-user-details">
              <span className="ha-user-name">
                {adminInfo?.nombre || 'Bienvenido'}
              </span>
              <span className="ha-user-role">
                {adminInfo?.tipo_usuario || 'Administrador'}
              </span>
            </div>
          </div>
          <button 
            className="ha-logout-button"
            onClick={() => {
              localStorage.removeItem('admin');
              localStorage.removeItem('auth');
              navigate('/login');
            }}
          >
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}