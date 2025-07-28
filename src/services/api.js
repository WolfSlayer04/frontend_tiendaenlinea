import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

// Categorías
export const fetchCategorias = async () => {
  try {
    const response = await apiClient.get('/categorias');
    return [{ idcategoria: 0, categoria: "TODOS" }, ...response.data];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Productos
export const fetchProductos = async (params = {}) => {
  try {
    let url = '/productos';
    if (params.q) url += `/buscar?q=${encodeURIComponent(params.q)}`;
    else if (params.idcategoria && params.idcategoria !== 0)
      url += `/categoria/${params.idcategoria}`;

    const response = await apiClient.get(url, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });

    return {
      productos: response.data.productos || [],
      total: response.data.total || response.data.length || 0,
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { productos: [], total: 0 };
  }
};

// Carrito
export const getCart = async () => {
  try {
    const response = await apiClient.get('/carrito');
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
};

export const addToCart = async (productoId, cantidad = 1, precio = 0) => {
  try {
    const response = await apiClient.post('/carrito/agregar', {
      idproducto: productoId,
      cantidad,
      precio: precio,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

export const clearCart = async () => {
  try {
    const response = await apiClient.delete('/carrito/vaciar');
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Pedidos
export const createPedido = async (pedidoData) => {
  try {
    const response = await apiClient.post('/pedidos', pedidoData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};