import React, { useState, useEffect, useRef } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import Toast from "../Components/Toast";
import ProductCard from "../Components/ProductCard";
import ProductModal from "../Components/ProductoModal";
import CarritoModal from "../Components/CarritoModal";
import { useStoreInfo } from "../config";
import { MessageCircle, Home, Search, ChevronLeft, ChevronRight } from "lucide-react";
import "./home.css";

// Funciones utilitarias
const getFieldValue = (field, defaultValue = "") => {
  if (field === null || field === undefined) return defaultValue;
  if (typeof field === "object" && field !== null && "Valid" in field) {
    if (!field.Valid) return defaultValue;
    if ("String" in field && typeof field.String === "string") return field.String;
    if ("Float64" in field && typeof field.Float64 === "number") return field.Float64;
    if ("Int64" in field && typeof field.Int64 === "number") return field.Int64;
    return defaultValue;
  }
  if (typeof field === "string" || typeof field === "number") return field;
  return defaultValue;
};

const sanitizeProduct = (product) => {
  const sanitized = {};
  for (const key in product) {
    sanitized[key] = getFieldValue(product[key], "");
  }
  return sanitized;
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [carritoOpen, setCarritoOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [cartItems, setCartItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  const storeInfo = useStoreInfo();

  // === NUEVO: obtener usuario desde localStorage ===
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const idUsuario = usuario.id_usuario;

  const productsPerPage = 18;

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`https://logica-tiendaenlina.onrender.com/api/categorias?id_usuario=${idUsuario}`);
        if (!response.ok) throw new Error("Error al cargar categorías");
        const data = await response.json();
        setCategories([{ idcategoria: 0, categoria: "TODOS" }, ...data]);
      } catch {
        setCategories([{ idcategoria: 0, categoria: "TODOS" }]);
      }
    };
    fetchCategories();
  }, [idUsuario]);

  // Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url;
        if (pendingSearch) {
          url = `https://logica-tiendaenlina.onrender.com/api/productos/iva/buscar?q=${encodeURIComponent(
            pendingSearch
          )}&id_usuario=${idUsuario}&page=${currentPage}&limit=${productsPerPage}`;
        } else if (selectedCategory && selectedCategory !== 0) {
          url = `https://logica-tiendaenlina.onrender.com/api/productos/iva/categoria/${selectedCategory}?id_usuario=${idUsuario}&page=${currentPage}&limit=${productsPerPage}`;
        } else {
          url = `https://logica-tiendaenlina.onrender.com/api/productos/iva?id_usuario=${idUsuario}&page=${currentPage}&limit=${productsPerPage}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error al cargar productos");
        const data = await response.json();
        const productList = data.productos || data || [];
        const total = data.total || productList.length || 0;
        const sanitizedList = productList.map(sanitizeProduct);
        setProducts(sanitizedList);
        setTotalProducts(total);
        setTotalPages(Math.max(1, Math.ceil(total / productsPerPage)));
      } catch {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pendingSearch, selectedCategory, currentPage, idUsuario]);

  // Cargar carrito
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito");
        if (!response.ok) throw new Error("Error fetching cart items");
        const data = await response.json();
        setCartItems(Array.isArray(data) ? data : []);
      } catch {
        setCartItems([]);
      }
    };
    fetchCartItems();
  }, [modalOpen, carritoOpen]);

  // Sugerencias autocomplete
  const fetchSuggestions = async (value) => {
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `https://logica-tiendaenlina.onrender.com/api/productos/sugerencias?q=${encodeURIComponent(value)}&id_usuario=${idUsuario}`
      );
      if (!response.ok) throw new Error("Error al buscar sugerencias");
      const data = await response.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Cambiar categoría limpia búsqueda y productos
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setPendingSearch("");
  };

  // Seleccionar sugerencia: buscar por su idproducto
  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.nombre || suggestion.descripcion || "");
    setShowSuggestions(false);
    setSuggestions([]);
    setCurrentPage(1);
    setPendingSearch(suggestion.idproducto ? String(suggestion.idproducto) : (suggestion.nombre || suggestion.descripcion || ""));
  };

  // Submit del form: buscar por lo que hay en el input
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      setPendingSearch(searchQuery);
      setShowSuggestions(false);
      setSuggestions([]);
      setCurrentPage(1);
    }
  };

  // Cambiar de página
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      document.querySelector(".products-panel").scrollIntoView({ behavior: "smooth" });
    }
  };
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      document.querySelector(".products-panel").scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleShowModal = (product) => {
    setModalProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalProduct(null);
    setModalOpen(false);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleAddToCart = async (product, cantidad, precio) => {
    const payload = {
      idproducto: Number(product.idproducto),
      cantidad: Number(cantidad),
      precio: Number(precio)
    };
    try {
      const response = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to add to cart");
      showToast(`¡${product.nombre || product.descripcion || "Producto"} añadido al carrito!`, "success");
      handleCloseModal();
      // Actualizar carrito:
      try {
        const response = await fetch("https://logica-tiendaenlina.onrender.com/api/carrito");
        if (!response.ok) throw new Error("Error fetching cart items");
        const data = await response.json();
        setCartItems(Array.isArray(data) ? data : []);
      } catch {
        setCartItems([]);
      }
      // Efecto visual
      const cartButton = document.querySelector(".cart-btn");
      if (cartButton) {
        cartButton.classList.add("cart-pulse");
        setTimeout(() => {
          cartButton.classList.remove("cart-pulse");
        }, 1000);
      }
    } catch {
      showToast("No se pudo agregar al carrito", "error");
    }
  };

  // Usar info de tienda para WhatsApp
  function openWhatsApp() {
    const { number, defaultMessage } = storeInfo.whatsapp || {};
    const phone = (number || "").replace(/[^0-9]/g, "");
    const text = encodeURIComponent(defaultMessage || "");
    window.open(`https://wa.me/52${phone}?text=${text}`, "_blank");
  }

  return (
    <div className="main-container">
      <Header cartItems={cartItems} onCart={() => setCarritoOpen(true)} />
      <main className="main-content">
        <div className="centered-content">
          {/* Buscador */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group" style={{ position: "relative", maxWidth: 450, width: "100%" }}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Buscar productos..."
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-btn">
                <Search size={20} />
              </button>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="search-suggestions-list">
                  {suggestions.map((s, idx) => (
                    <li
                      key={s.idproducto || idx}
                      className="search-suggestion-item"
                      onMouseDown={() => handleSuggestionSelect(s)}
                    >
                      {s.nombre || s.descripcion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
          {/* Conteo de productos */}
          <div className="products-count">
            {totalProducts} {totalProducts === 1 ? "producto" : "productos"}
          </div>
          {/* Categorías */}
          <div className="categories-panel">
            <h2 className="categories-title">Categorías</h2>
            <div className="categories-list">
              {categories.map((category) => (
                <button
                  key={category.idcategoria}
                  onClick={() => handleCategoryClick(category.idcategoria)}
                  className={`category-btn ${
                    selectedCategory === category.idcategoria ? "category-btn-selected" : ""
                  }`}
                >
                  {category.categoria}
                </button>
              ))}
            </div>
          </div>
          {/* Productos */}
          <div className="products-panel">
            {loading ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="products-grid">
                  {products.map((product, idx) => (
                    <ProductCard key={product.idproducto || idx} product={product} onShowModal={handleShowModal} />
                  ))}
                </div>
                <div className="pagination">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`pagination-btn ${currentPage === 1 ? "pagination-btn-disabled" : ""}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="pagination-text">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`pagination-btn ${currentPage === totalPages ? "pagination-btn-disabled" : ""}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="no-products">
                <div>
                  <p className="no-products-title">No se encontraron productos</p>
                  <p>Intenta con otra búsqueda o categoría</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* MODAL PRODUCTO */}
      <ProductModal
        product={modalProduct || {}}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
      />
      {/* MODAL CARRITO */}
      <CarritoModal
        open={carritoOpen}
        onClose={() => setCarritoOpen(false)}
        items={cartItems}
        setItems={setCartItems}
      />
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <Footer />
      <div className="whatsapp-btn-container">
        <button className="whatsapp-btn" onClick={openWhatsApp}>
          <MessageCircle size={24} className="whatsapp-icon" />
        </button>
      </div>
    </div>
  );
}