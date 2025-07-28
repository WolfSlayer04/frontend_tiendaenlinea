import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isAuth: false,
    user: null,
    tienda: null,
    admin: null,
  });

  const [loading, setLoading] = useState(true);

  // Cargar estado desde localStorage al montar el componente
  useEffect(() => {
    console.log("AuthProvider MOUNT - revisando localStorage...");

    const authData = localStorage.getItem('auth') === 'true';
    const user = localStorage.getItem('usuario') ? JSON.parse(localStorage.getItem('usuario')) : null;
    const tienda = localStorage.getItem('tienda') ? JSON.parse(localStorage.getItem('tienda')) : null;
    const admin = localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')) : null;

    console.log("localStorage al montar:", { auth: authData, user, tienda, admin });

    if (authData) {
      setAuthState({
        isAuth: true,
        user,
        tienda,
        admin,
      });
    }

    setLoading(false);
  }, []);

  // Función login: acepta userData.usuario y userData.tienda o userData.admin
  const login = (userData) => {
    console.log("LOGIN SE EJECUTA con:", userData);

    localStorage.setItem('auth', 'true');

    if (userData.usuario && userData.tienda) {
      // Inicio como usuario normal
      localStorage.setItem('usuario', JSON.stringify(userData.usuario));
      localStorage.setItem('tienda', JSON.stringify(userData.tienda));

      localStorage.removeItem('admin');
      setAuthState({
        isAuth: true,
        user: userData.usuario,
        tienda: userData.tienda,
        admin: null,
      });

      console.log("Después de login como usuario:", {
        auth: localStorage.getItem('auth'),
        usuario: localStorage.getItem('usuario'),
        tienda: localStorage.getItem('tienda'),
        admin: localStorage.getItem('admin'),
      });

    } else if (userData.admin) {
      // Inicio como administrador
      localStorage.setItem('admin', JSON.stringify(userData.admin));

      localStorage.removeItem('usuario');
      localStorage.removeItem('tienda');
      setAuthState({
        isAuth: true,
        user: null,
        tienda: null,
        admin: userData.admin,
      });

      console.log("Después de login como admin:", {
        auth: localStorage.getItem('auth'),
        usuario: localStorage.getItem('usuario'),
        tienda: localStorage.getItem('tienda'),
        admin: localStorage.getItem('admin'),
      });
    }
  };

  // Función logout
  const logout = () => {
    console.log("LOGOUT ejecutado");
    localStorage.removeItem('auth');
    localStorage.removeItem('usuario');
    localStorage.removeItem('tienda');
    localStorage.removeItem('admin');

    setAuthState({
      isAuth: false,
      user: null,
      tienda: null,
      admin: null,
    });

    console.log("LOGOUT completado. localStorage ahora:", {
      auth: localStorage.getItem('auth'),
      usuario: localStorage.getItem('usuario'),
      tienda: localStorage.getItem('tienda'),
      admin: localStorage.getItem('admin'),
    });
  };

  const value = {
    authState,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  return useContext(AuthContext);
}