import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';

import LoginRegister from './pages/loginregistre';
import Home from './pages/home';
import CarritoPage from './pages/CarritoPage';
import PedidoConfirmadoPage from './pages/PedidoConfirmadoPage';
import CheckoutPage from './pages/CheckoutPage';
import InformacionUsuario from './pages/informacion_usuario';

import ProtectedRoute from './Components/ProtectedRoute';

import HomeAdmin from "./Pages - Admin/homeadmin";
import Sucursales from "./Pages - Admin/views/sucursales";
import Pedidos from "./Pages - Admin/views/Pedidos";
import Productos from "./Pages - Admin/views/Productos";
import Usuarios from "./Pages - Admin/views/Usuarios";
import Clientes from "./Pages - Admin/views/Clientes";
import ConfiguracionPersonalizada from "./Pages - Admin/views/ConfiguracionPersonalizada";

// IMPORTA EL HOOK
import { useStoreInfo } from './config';

// HOOK PARA FAVICON Y TITLE
function useDynamicFaviconAndTitle(logotipoUrl, name) {
  useEffect(() => {
    if (name) document.title = name;
    if (logotipoUrl) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = logotipoUrl;
    }
  }, [logotipoUrl, name]);
}

function App() {
  const { logotipoUrl, name } = useStoreInfo();
  useDynamicFaviconAndTitle(logotipoUrl, name);

  return (
    // <AuthProvider> debe envolver a <Router>, no al revés
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRegister />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carrito"
            element={
              <ProtectedRoute>
                <CarritoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/realizar-pedido"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedido-confirmado"
            element={
              <ProtectedRoute>
                <PedidoConfirmadoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <InformacionUsuario />
              </ProtectedRoute>
            }
          />
          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <HomeAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sucursales"
            element={
              <ProtectedRoute requiredRole="admin">
            <Sucursales />
          </ProtectedRoute>
            }
/>
          <Route
            path="/admin/pedidos"
            element={
              <ProtectedRoute requiredRole="admin">
                <Pedidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/productos"
            element={
              <ProtectedRoute requiredRole="admin">
                <Productos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute requiredRole="admin">
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <ProtectedRoute requiredRole="admin">
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/configuracion"
            element={
              <ProtectedRoute requiredRole="admin">
                <ConfiguracionPersonalizada />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;