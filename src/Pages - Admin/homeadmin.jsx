import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Menu, CalendarDays, DollarSign, LogOut, Info, Users, Package, ShoppingCart
} from 'lucide-react';

import Sidebar from './Sidebar';
import './homeadmin.css';

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function parseMonthFromYearMonth(yearMonth) {
  const [year, month] = yearMonth.split('-');
  if (!year || !month) return '';
  return `${MONTHS_ES[parseInt(month, 10) - 1]} '${year.slice(-2)}`;
}

function formatCurrency(num) {
  if (typeof num !== "number") num = Number(num) || 0;
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
}

const getAdminInfo = () => {
  try {
    const data = localStorage.getItem('admin');
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export default function HomeAdmin() {
  // Remove sidebarOpen state and related functions as sidebar will always be open
  // const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [salesData, setSalesData] = useState([]);
  const [dailySalesData, setDailySalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [stats, setStats] = useState([
    {
      title: 'Ventas Totales',
      value: '$0',
      icon: DollarSign,
      color: '#4F378B',
      detail: '0 transacciones'
    },
    {
      title: 'Usuarios Activos',
      value: '0',
      icon: Users,
      color: '#006A6A',
      detail: '0 usuarios'
    },
    {
      title: 'Productos',
      value: '0',
      icon: Package,
      color: '#7D5260',
      detail: '0 productos'
    },
  ]);
  const [monthlyTable, setMonthlyTable] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userProfileRef = useRef(null);

  const parseDateToISO = (dateString) => {
    if (!dateString) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return dateString.substring(0, 10);
    }
    try {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.toISOString().substring(0, 10);
      }
    } catch (e) {}
    return null;
  };

  const parseDay = (fecha) => {
    const isoDate = parseDateToISO(fecha);
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const getStatus = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'completado') return { label: 'Completado', badge: 'completed' };
    if (s === 'pending' || s === 'pendiente') return { label: 'Pendiente', badge: 'pending' };
    if (s === 'enviado' || s === 'shipped') return { label: 'Enviado', badge: 'shipped' };
    if (s === 'cancelado') return { label: 'Cancelado', badge: 'cancelled' };
    return { label: status || 'Otro', badge: 'shipped' };
  };

  // Remove toggleSidebar and handleOverlayClick as sidebar will always be open
  // const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  // const handleOverlayClick = () => setSidebarOpen(false);
  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  useEffect(() => {
    // Estadísticas generales y productos vendidos por mes
    fetch('https://logica-tiendaenlina.onrender.com/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        const productosHistorico = Array.isArray(data.productos_vendidos_historico)
          ? data.productos_vendidos_historico
          : [];

        // Indicadores mensuales (para la tabla)
        fetch('https://logica-tiendaenlina.onrender.com/api/indicadores/mensual')
          .then(res2 => res2.json())
          .then(data2 => {
            if (Array.isArray(data2.data)) {
              const now = new Date();
              const yearMonthNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              const ventasTotalesMes = data2.data.reduce((acc, item) => {
                const isoDate = parseDateToISO(item.fecha);
                if (isoDate && isoDate.startsWith(yearMonthNow)) {
                  return acc + Number(item.tot_pedidos || 0);
                }
                return acc;
              }, 0);

              setStats([
                {
                  title: 'Ventas Totales',
                  value: formatCurrency(ventasTotalesMes),
                  icon: DollarSign,
                  color: '#7B6BF2',
                  detail: `${data.usuarios_activos || 30} transacciones`
                },
                {
                  title: 'Usuarios Activos',
                  value: data.usuarios_activos?.toLocaleString('es-MX') || '0',
                  icon: Users,
                  color: '#49BAAF',
                  detail: `${data.usuarios_activos || 0} usuarios`
                },
                {
                  title: 'Productos',
                  value: data.productos_vendidos_mes?.toLocaleString('es-MX') || '0',
                  icon: Package,
                  color: '#F86060',
                  detail: `${data.productos_vendidos_mes || 0} productos`
                },
              ]);

              // Agrupar mensual y combinar productos vendidos
              const monthlyAgrupado = {};
              data2.data.forEach(item => {
                const isoDate = parseDateToISO(item.fecha);
                if (!isoDate) return;
                const yearMonth = isoDate.slice(0, 7); // "YYYY-MM"
                if (!monthlyAgrupado[yearMonth]) {
                  monthlyAgrupado[yearMonth] = {
                    yearMonth,
                    mes: parseMonthFromYearMonth(yearMonth),
                    ventas: 0,
                    pedidos: 0,
                    productos_vendidos: 0
                  };
                }
                monthlyAgrupado[yearMonth].ventas += Number(item.tot_pedidos ?? 0);
                monthlyAgrupado[yearMonth].pedidos += Number(item.num_pedidos ?? 0);
              });

              // Combina con productos vendidos por mes
              productosHistorico.forEach((prod) => {
                const yearMonth = `${prod.anio}-${String(prod.mes).padStart(2, '0')}`;
                if (monthlyAgrupado[yearMonth]) {
                  monthlyAgrupado[yearMonth].productos_vendidos = prod.total;
                }
              });

              const monthlyArr = Object.values(monthlyAgrupado)
                .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

              setMonthlyTable(monthlyArr);
              setSalesData(monthlyArr);
            }
          });
      });

    // Datos diarios
    fetch('https://logica-tiendaenlina.onrender.com/api/indicadores/diario')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) {
          const dailyAgrupado = {};
          data.data.forEach(item => {
            const isoDate = parseDateToISO(item.fecha);
            if (!isoDate) return;
            if (!dailyAgrupado[isoDate]) {
              dailyAgrupado[isoDate] = {
                fecha: isoDate,
                dia: parseDay(isoDate),
                ventas: 0,
                pedidos: 0,
                usuarios: 0
              };
            }
            dailyAgrupado[isoDate].ventas += Number(item.tot_pedidos ?? 0);
            dailyAgrupado[isoDate].pedidos += Number(item.num_pedidos ?? 0);
            dailyAgrupado[isoDate].usuarios += Number(item.num_clientes ?? 0);
          });

          const dailyArr = Object.values(dailyAgrupado)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
          setDailySalesData(dailyArr.slice(-7));
        }
      });

    // Pedidos recientes
    fetch('https://logica-tiendaenlina.onrender.com/api/pedidos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) {
          const pedidosOrdenados = data.data.slice().sort((a, b) => {
            const fechaA = new Date(parseDateToISO(a.pedido.fecha_creacion));
            const fechaB = new Date(parseDateToISO(b.pedido.fecha_creacion));
            return fechaB.getTime() - fechaA.getTime();
          });
          const mapped = pedidosOrdenados.slice(0, 5).map(item => {
            const ped = item.pedido;
            return {
              id: '#' + (ped.id_pedido ?? ped.id ?? '-'),
              amount: ped.total ?? 0,
              status: ped.estatus || 'pendiente'
            };
          });
          setRecentOrders(mapped);
        }
      });
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userProfileRef.current && !userProfileRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('auth');
    window.location.href = "/login";
  };

  const adminInfo = getAdminInfo();

  return (
    <div className="ha-container">
      {/* Sidebar: Always render with sidebarOpen={true} and remove toggleSidebar/handleOverlayClick */}
      <Sidebar
        sidebarOpen={true} // Set to true to always keep it open
        // Remove toggleSidebar and handleOverlayClick props
      />

    {/* Main Content: Always add the 'open' class */}
<div className="ha-main-content open"> {/* Always apply 'open' class */}
  <header className="ha-header">
    <div className="ha-header-content">
      <div className="ha-header-left">
        {/* Remove the menu button as it's no longer needed to toggle */}
        {/* <button 
          onClick={toggleSidebar} 
          className="ha-menu-button" 
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button> */}
        <div className="ha-header-title">
          <h1 className="ha-title">Panel de Administración</h1>
          <p className="ha-subtitle">Resumen detallado del estado de su negocio</p>
        </div>
      </div>
      {/* La sección de usuario ha sido eliminada del header, ya está en el Sidebar */}
    </div>
  </header>

        {/* Dashboard Centered Content */}
        <div className="ha-center-wrapper">
          <main className="ha-main-container">
            {/* Stats Grid */}
            <div className="ha-stats-grid">
              {stats.map((stat, idx) => (
                <div key={idx} className="ha-stat-card">
                  <div className="ha-stat-card-content">
                    <div className="ha-stat-info">
                      <div className="ha-stat-header">
                        <p className="ha-stat-title">{stat.title}</p>
                      </div>
                      <p className="ha-stat-value">{stat.value}</p>
                      <div className="ha-stat-footer">
                        <span className="ha-stat-detail">{stat.detail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="ha-bottom-grid">
              {/* Ventas Diarias: gráfico de barras */}
              <div className="ha-analytics-card">
                <div className="ha-card-header">
                  <div className="ha-card-header-left">
                    <h3 className="ha-card-title">Ventas Diarias (Últimos 7 días)</h3>
                  </div>
                </div>
                <div className="ha-chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dailySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F8" vertical={false} />
                      <XAxis 
                        dataKey="fecha" 
                        stroke="#8E8CA9"
                        tickFormatter={fecha => {
                          const d = new Date(fecha);
                          return isNaN(d) ? fecha : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
                        }}
                        tick={{fontSize: 12}}
                      />
                      <YAxis 
                        stroke="#8E8CA9" 
                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                        tick={{fontSize: 12}}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={label => {
                          const d = new Date(label);
                          return `Día: ${
                            isNaN(d) ? label : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                          }`;
                        }}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E8E6F8',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="ventas" name="Ventas" fill="#7B6BF2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Tabla Mensual */}
              <div className="ha-analytics-card ha-table-card">
                <div className="ha-card-header">
                  <h3 className="ha-card-title">Resumen Mensual</h3>
                </div>
                <div className="ha-table-container">
                  <table className="ha-table">
                    <thead>
                      <tr className="ha-table-header">
                        <th className="ha-table-header-cell">Mes</th>
                        <th className="ha-table-header-cell">Total Ventas</th>
                        <th className="ha-table-header-cell"># Pedidos</th>
                        <th className="ha-table-header-cell"># Productos Vendidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyTable.map((item, idx) => (
                        <tr key={idx} className="ha-table-row">
                          <td className="ha-table-cell">{item.mes}</td>
                          <td className="ha-table-cell">{formatCurrency(item.ventas)}</td>
                          <td className="ha-table-cell">{item.pedidos}</td>
                          <td className="ha-table-cell">{item.productos_vendidos || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pedidos recientes */}
              <div className="ha-analytics-card ha-table-card">
                <div className="ha-card-header">
                  <h3 className="ha-card-title">Pedidos Recientes</h3>
                  <button className="ha-view-all-btn">Ver todos</button>
                </div>
                <div className="ha-table-container">
                  <table className="ha-table">
                    <thead>
                      <tr className="ha-table-header">
                        <th className="ha-table-header-cell">Pedido</th>
                        <th className="ha-table-header-cell">Monto</th>
                        <th className="ha-table-header-cell">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, idx) => {
                        const status = getStatus(order.status);
                        return (
                          <tr key={idx} className="ha-table-row">
                            <td className="ha-table-cell">{order.id}</td>
                            <td className="ha-table-cell">{formatCurrency(order.amount)}</td>
                            <td className="ha-table-cell">
                              <span className={`ha-status-badge ${status.badge}`}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Remove Overlay as it's not needed for an always-open sidebar */}
      {/* {sidebarOpen && (
        <div 
          className="ha-overlay" 
          onClick={handleOverlayClick}
        />
      )} */}
    </div>
  );
}