
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Minus,
  ArrowLeftRight,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RefreshCw,
  Filter,
  Image as ImageIcon,
  Gem,
  Save,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./Inventory.css";

const PAGE_SIZE = 5;

const getStock = (product) =>
  Number(product.stock_quantity ?? product.stock ?? product.quantity ?? 0);

const getName = (product) =>
  product.name || product.marble_name || product.title || "Unnamed Product";

const getImage = (product) =>
  product.image_url || product.image || product.image_path || "";

const getPrice = (product) =>
  Number(product.price_per_sqft ?? product.price ?? 0);

const getCategory = (product) =>
  product.category || product.category_name || "Other";

const getCode = (product, index) =>
  product.product_code ||
  product.sku ||
  `ARK-MB-${String(index + 1).padStart(3, "0")}`;

const getMinimumStock = (product) =>
  Number(product.min_stock ?? product.minimum_stock ?? 10);

const getStockStatus = (product) => {
  const stock = getStock(product);

  if (stock <= 0) return "out";
  if (stock <= getMinimumStock(product)) return "low";
  return "in";
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const initialForm = {
  name: "",
  category: "Marbles",
  price_per_sqft: "",
  stock_quantity: "",
  min_stock: "10",
  color: "",
  finish: "",
  thickness: "",
  status: "available",
  image_url: "",
  description: "",
};

export default function Inventory() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [activeFilter, setActiveFilter] = useState("all");
  const [materialType, setMaterialType] = useState("All Types");
  const [page, setPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [stockAmount, setStockAmount] = useState("");
  const [stockAction, setStockAction] = useState("add");

  const loadProducts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("marbles")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setProducts(data || []);
    } catch (err) {
      console.error("Inventory loading error:", err);
      setError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const statistics = useMemo(() => {
    const totalProducts = products.length;

    const totalStock = products.reduce(
      (sum, product) => sum + getStock(product),
      0
    );

    const lowStock = products.filter(
      (product) => getStockStatus(product) === "low"
    ).length;

    const inStock = products.filter(
      (product) => getStockStatus(product) === "in"
    ).length;

    const outOfStock = products.filter(
      (product) => getStockStatus(product) === "out"
    ).length;

    return {
      totalProducts,
      totalStock,
      lowStock,
      inStock,
      outOfStock,
    };
  }, [products]);

  const categories = useMemo(() => {
    return [
      "All Categories",
      ...new Set(products.map(getCategory).filter(Boolean)),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product, index) => {
      const name = getName(product).toLowerCase();
      const code = getCode(product, index).toLowerCase();
      const productCategory = getCategory(product).toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        code.includes(term) ||
        productCategory.includes(term);

      const matchesCategory =
        category === "All Categories" ||
        productCategory === category.toLowerCase();

      const typeValue = product.material_type || product.product_type ||
        (productCategory.toLowerCase().includes("marble") ||
         productCategory.toLowerCase().includes("stone") ||
         productCategory.toLowerCase().includes("fusion") ? "Marbles" : "Construction");
      const matchesMaterialType =
        materialType === "All Types" || typeValue.toLowerCase() === materialType.toLowerCase();

      const status = getStockStatus(product);

      const matchesStatus =
        activeFilter === "all" ||
        (activeFilter === "low" && status === "low") ||
        (activeFilter === "in" && status === "in") ||
        (activeFilter === "out" && status === "out");

      return matchesSearch && matchesCategory && matchesMaterialType && matchesStatus;
    });
  }, [products, search, category, activeFilter, materialType]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, category, activeFilter, materialType]);

  const openAddStock = (product, action = "add") => {
    setSelectedProduct(product);
    setStockAction(action);
    setStockAmount("");
    setModalType("stock");
  };

  const openEdit = (product) => {
    setSelectedProduct(product);

    setForm({
      name: getName(product),
      category: getCategory(product),
      price_per_sqft: getPrice(product),
      stock_quantity: getStock(product),
      min_stock: getMinimumStock(product),
      color: product.color || "",
      finish: product.finish || "",
      thickness: product.thickness || "",
      status: product.status || "available",
      image_url: getImage(product),
    });

    setModalType("edit");
  };

  const openView = (product) => {
    setSelectedProduct(product);
    setModalType("view");
  };

  const closeModal = () => {
    setModalType("");
    setSelectedProduct(null);
    setForm(initialForm);
    setStockAmount("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();

    if (!selectedProduct?.id) {
      setError("Product ID is missing. Cannot update this product.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updates = {
        name: form.name.trim(),
        category: form.category,
        price_per_sqft: Number(form.price_per_sqft) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
        min_stock: Number(form.min_stock) || 0,
        color: form.color || null,
        finish: form.finish || null,
        thickness: form.thickness || null,
        status: form.status,
        image_url: form.image_url || null,
        description: form.description?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("marbles")
        .update(updates)
        .eq("id", selectedProduct.id);

      if (updateError) throw updateError;

      closeModal();
      await loadProducts(true);
    } catch (err) {
      console.error("Product update error:", err);
      setError(err.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async (event) => {
    event.preventDefault();

    if (!selectedProduct?.id) return;

    const amount = Number(stockAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid stock quantity.");
      return;
    }

    const currentStock = getStock(selectedProduct);

    if (stockAction === "remove" && amount > currentStock) {
      setError("You cannot remove more stock than currently available.");
      return;
    }

    const newStock =
      stockAction === "add"
        ? currentStock + amount
        : currentStock - amount;

    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("marbles")
        .update({
          stock_quantity: newStock,
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProduct.id);

      if (updateError) {
        // Retry using the stock_quantity column only.
        const { error: retryError } = await supabase
          .from("marbles")
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedProduct.id);

        if (retryError) throw retryError;
      }

      closeModal();
      await loadProducts(true);
    } catch (err) {
      console.error("Stock update error:", err);
      setError(err.message || "Unable to update stock.");
    } finally {
      setSaving(false);
    }
  };

  // Open the custom luxury delete confirmation dialog.
  const handleDelete = (product) => {
    setDeleteTarget(product);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id || deleting) return;

    setDeleting(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("marbles")
        .delete()
        .eq("id", deleteTarget.id);

      if (deleteError) throw deleteError;

      setDeleteTarget(null);
      await loadProducts(true);
    } catch (err) {
      console.error("Delete product error:", err);
      setError(err.message || "Unable to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Product Code",
      "Product Name",
      "Category",
      "Price Per Sq.Ft",
      "Stock",
      "Minimum Stock",
      "Status",
      "Color",
      "Finish",
      "Thickness",
    ];

    const rows = filteredProducts.map((product, index) => [
      getCode(product, index),
      getName(product),
      getCategory(product),
      getPrice(product),
      getStock(product),
      getMinimumStock(product),
      getStockStatus(product),
      product.color || "",
      product.finish || "",
      product.thickness || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ARK-MARBLES-Inventory.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (product) => {
    const status = getStockStatus(product);

    if (status === "out") return "Out of Stock";
    if (status === "low") return "Low Stock";
    return "In Stock";
  };

  const getStockTabCount = (filter) => {
    if (filter === "all") return statistics.totalProducts;
    if (filter === "low") return statistics.lowStock;
    if (filter === "in") return statistics.inStock;
    return statistics.outOfStock;
  };

  return (
    <div className="ark-inventory-page">
      {/* INVENTORY PAGE HEADER */}
      <div className="ark-inventory-heading">
        <div className="ark-inventory-title-group">
          <div className="ark-inventory-eyebrow">ARK MARBLES / INVENTORY</div>
          <h1>Inventory Management</h1>
          <p>Track, manage and monitor marble, construction materials and stock levels</p>
        </div>
        <div className="ark-inventory-heading-actions">
          <div className="ark-inventory-global-search">
            <Search size={21} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, SKU, category..."
              aria-label="Search inventory"
            />
          </div>
          <button className="ark-inventory-action-btn ark-inventory-export" onClick={exportCSV}>
            <Download size={18} /> Export
          </button>
          <button
            className="ark-inventory-action-btn"
            onClick={() => navigate("/admin/inventory/add")}
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="ark-inventory-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={17} /></button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="ark-inventory-stats">
        <div className="ark-inventory-stat-card stat-total">
          <div className="ark-inventory-stat-icon"><Package /></div>
          <div className="ark-inventory-stat-content">
            <span>Total Products</span>
            <strong>{statistics.totalProducts}</strong>
            <small>Active items in inventory</small>
          </div>
        </div>
        <div className="ark-inventory-stat-card stat-in">
          <div className="ark-inventory-stat-icon"><Boxes /></div>
          <div className="ark-inventory-stat-content">
            <span>In Stock</span>
            <strong>{statistics.inStock}</strong>
            <small>Available for sale</small>
          </div>
        </div>
        <div className="ark-inventory-stat-card stat-low">
          <div className="ark-inventory-stat-icon"><AlertTriangle /></div>
          <div className="ark-inventory-stat-content">
            <span>Low Stock</span>
            <strong>{statistics.lowStock}</strong>
            <small>Items need restock</small>
          </div>
        </div>
        <div className="ark-inventory-stat-card stat-out">
          <div className="ark-inventory-stat-icon"><Package /></div>
          <div className="ark-inventory-stat-content">
            <span>Out of Stock</span>
            <strong>{statistics.outOfStock}</strong>
            <small>Currently unavailable</small>
          </div>
        </div>
        <div className="ark-inventory-stat-card stat-value">
          <div className="ark-inventory-stat-icon"><Boxes /></div>
          <div className="ark-inventory-stat-content">
            <span>Inventory Value</span>
            <strong>₹{products.reduce((sum, item) => sum + getPrice(item) * getStock(item), 0).toLocaleString("en-IN")}</strong>
            <small>Total stock value (at price)</small>
          </div>
        </div>
        <div className="ark-inventory-stat-card stat-movement">
          <div className="ark-inventory-stat-icon"><RefreshCw /></div>
          <div className="ark-inventory-stat-content">
            <span>Recent Movements</span>
            <strong>0</strong>
            <small>Last 7 days</small>
          </div>
        </div>
      </div>

      {/* FILTER SIDEBAR + INVENTORY TABLE */}
      <div className="ark-inventory-workspace">
        <aside className="ark-inventory-filter-panel">
          <div className="ark-filter-heading">
            <Filter size={29} />
            <div><h2>Inventory Filters</h2><p>Filter and find inventory items</p></div>
          </div>

          <label className="ark-filter-field">
            <span>Search Product</span>
            <div className="ark-filter-input-wrap">
              <Search size={20} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Product name, SKU..."
              />
            </div>
          </label>

          <label className="ark-filter-field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="ark-filter-field">
            <span>Stock Status</span>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
              <option value="all">All Stock Status</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </label>

          <label className="ark-filter-field">
            <span>Material Type</span>
            <select value={materialType} onChange={(event) => setMaterialType(event.target.value)}>
              <option>All Types</option>
              <option>Marbles</option>
              <option>Construction</option>
            </select>
          </label>

          <div className="ark-filter-actions">
            <button className="ark-filter-apply" onClick={() => setPage(1)}>
              <Filter size={18} /> Apply Filters
            </button>
            <button className="ark-filter-reset" onClick={() => {
              setSearch("");
              setCategory("All Categories");
              setActiveFilter("all");
              setMaterialType("All Types");
              setPage(1);
            }}>
              <RefreshCw size={17} /> Reset
            </button>
          </div>
        </aside>

        <section className="ark-inventory-panel">
          <div className="ark-inventory-panel-heading">
            <div className="ark-inventory-panel-title">
              <Package size={34} />
              <div>
                <h2>Inventory Items</h2>
                <p>All marble and construction materials ({filteredProducts.length} items)</p>
              </div>
            </div>
            <div className="ark-inventory-panel-actions">
              <button className="ark-panel-add" onClick={() => navigate("/admin/inventory/add")}>
                <Plus size={20} /> Add Product
              </button>
              <button onClick={() => {
                const product = products[0];
                if (product) openAddStock(product, "add");
                else setError("Add a product before adjusting stock.");
              }}><Download size={18} /> Import</button>
              <button onClick={exportCSV}><Download size={18} /> Export</button>
              <button onClick={() => {
                const product = products[0];
                if (product) openAddStock(product, "add");
                else setError("No products available for a stock movement.");
              }}><ArrowLeftRight size={18} /> Stock Movement</button>
            </div>
          </div>

          <div className="ark-inventory-table-wrap">
            <table className="ark-inventory-table">
              <thead><tr>
                <th className="ark-select-col"></th>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Price (₹)</th>
                <th>Stock Value (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="ark-inventory-empty"><RefreshCw className="ark-refresh-spin" size={24} /> Loading inventory...</td></tr>
                ) : visibleProducts.length === 0 ? (
                  <tr><td colSpan="9" className="ark-inventory-empty"><Package size={38} /><strong>No products found</strong><span>Try changing your search or filters.</span></td></tr>
                ) : visibleProducts.map((product, index) => {
                  const absoluteIndex = (currentPage - 1) * PAGE_SIZE + index;
                  const status = getStockStatus(product);
                  const image = getImage(product);
                  const stock = getStock(product);
                  return (
                    <tr key={product.id || absoluteIndex}>
                      <td><span className="ark-table-checkbox" /></td>
                      <td>
                        <div className="ark-table-product">
                          <div className="ark-product-image">
                            {image ? <img src={image} alt={getName(product)} onError={(event) => {
                              event.currentTarget.style.display = "none";
                              event.currentTarget.nextSibling.style.display = "grid";
                            }} /> : null}
                            <span className="ark-product-image-fallback" style={{display: image ? "none" : "grid"}}><ImageIcon size={21} /></span>
                          </div>
                          <div><strong>{getName(product)}</strong><small>SKU: {getCode(product, absoluteIndex)}</small></div>
                        </div>
                      </td>
                      <td><span className="ark-category-pill">{getCategory(product)}</span></td>
                      <td className="ark-stock-number">{stock.toLocaleString("en-IN")}</td>
                      <td>{product.unit || product.stock_unit || "Sq.ft"}</td>
                      <td className="ark-money-cell">₹{getPrice(product).toLocaleString("en-IN")}</td>
                      <td className="ark-money-cell">₹{(getPrice(product) * stock).toLocaleString("en-IN")}</td>
                      <td><span className={`ark-stock-badge ${status}`}>{getStatusLabel(product)}</span></td>
                      <td><div className="ark-inventory-row-actions">
                        <button title="Edit product" onClick={() => openEdit(product)}><Pencil size={21} /></button>
                        <button title="Delete product" className="delete" onClick={() => handleDelete(product)}><Trash2 size={21} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ark-inventory-pagination">
            <span>Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} items</span>
            <div className="ark-pagination-controls">
              <label>Rows per page:
                <select value={PAGE_SIZE} disabled><option value="5">5</option></select>
              </label>
              <div className="ark-pagination-buttons">
                <button disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></button>
                {Array.from({length: totalPages}, (_, i) => i + 1).map((number) => (
                  <button key={number} className={currentPage === number ? "active" : ""} onClick={() => setPage(number)}>{number}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* LUXURY PRODUCT SHOWCASE */}
      {modalType === "view" && selectedProduct && (
        <div className="ark-inventory-modal-overlay ark-luxury-overlay" onClick={closeModal}>
          <section
            className="ark-luxury-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ark-luxury-product-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="ark-luxury-close"
              onClick={closeModal}
              aria-label="Close product details"
            >
              <X size={22} />
            </button>

            <div className="ark-luxury-product-layout">
              <div className="ark-luxury-gallery">
                {getImage(selectedProduct) ? (
                  <img
                    className="ark-luxury-main-image"
                    src={getImage(selectedProduct)}
                    alt={getName(selectedProduct)}
                  />
                ) : (
                  <div className="ark-luxury-main-image ark-luxury-image-fallback">
                    <ImageIcon size={54} />
                    <span>Product image not available</span>
                  </div>
                )}
                <div className="ark-luxury-image-caption">
                  <Gem size={15} />
                  <span>ARK MARBLES · PREMIUM COLLECTION</span>
                </div>
              </div>

              <div className="ark-luxury-product-info">
                <span className="ark-luxury-kicker">
                  {getCategory(selectedProduct)} · PRODUCT DETAILS
                </span>

                <h2 id="ark-luxury-product-title">{getName(selectedProduct)}</h2>
                <p className="ark-luxury-subtitle">
                  Natural stone selected for timeless interiors.
                </p>

                <div className="ark-luxury-price-row">
                  <strong>₹{getPrice(selectedProduct).toLocaleString("en-IN")}</strong>
                  <span>/ Sq.Ft</span>
                </div>

                <div className={`ark-luxury-stock-pill ${getStockStatus(selectedProduct)}`}>
                  <CheckCircle2 size={15} />
                  {getStatusLabel(selectedProduct)}
                  <span>· {getStock(selectedProduct).toLocaleString("en-IN")} units</span>
                </div>

                <div className="ark-luxury-spec-grid">
                  <div className="ark-luxury-spec">
                    <Gem size={20} />
                    <span>Category</span>
                    <strong>{getCategory(selectedProduct)}</strong>
                  </div>
                  <div className="ark-luxury-spec">
                    <Boxes size={20} />
                    <span>Finish</span>
                    <strong>{selectedProduct.finish || "Not specified"}</strong>
                  </div>
                  <div className="ark-luxury-spec">
                    <Package size={20} />
                    <span>Thickness</span>
                    <strong>{selectedProduct.thickness || "Not specified"}</strong>
                  </div>
                  <div className="ark-luxury-spec">
                    <CheckCircle2 size={20} />
                    <span>Minimum stock</span>
                    <strong>{getMinimumStock(selectedProduct)} units</strong>
                  </div>
                  <div className="ark-luxury-spec">
                    <Gem size={20} />
                    <span>Color</span>
                    <strong>{selectedProduct.color || "Not specified"}</strong>
                  </div>
                  <div className="ark-luxury-spec">
                    <Package size={20} />
                    <span>Product code</span>
                    <strong>{selectedProduct.product_code || selectedProduct.sku || "—"}</strong>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="ark-luxury-description">
                    <h3>Product Description</h3>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}

                <div className="ark-luxury-actions">
                  <button
                    type="button"
                    className="ark-luxury-secondary"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="ark-luxury-primary"
                    onClick={() => openEdit(selectedProduct)}
                  >
                    <Pencil size={17} />
                    Edit Product
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {modalType === "edit" && selectedProduct && (
        <div className="ark-inventory-modal-overlay" onClick={closeModal}>
          <form
            className="ark-inventory-modal"
            onSubmit={handleUpdateProduct}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ark-inventory-modal-header">
              <div>
                <span>INVENTORY MANAGEMENT</span>
                <h2>Edit Product</h2>
              </div>

              <button type="button" onClick={closeModal}>
                <X />
              </button>
            </div>

            <div className="ark-inventory-form-grid">
              <label>
                Product Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Price Per Sq.Ft
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price_per_sqft"
                  value={form.price_per_sqft}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Stock Quantity
                <input
                  type="number"
                  min="0"
                  name="stock_quantity"
                  value={form.stock_quantity}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Color
                <input
                  name="color"
                  value={form.color}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Finish
                <input
                  name="finish"
                  value={form.finish}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Thickness
                <input
                  name="thickness"
                  value={form.thickness}
                  onChange={handleFormChange}
                  placeholder="18 mm"
                />
              </label>

              <label>
                Minimum Stock
                <input
                  type="number"
                  min="0"
                  name="min_stock"
                  value={form.min_stock}
                  onChange={handleFormChange}
                />
              </label>

              <label className="ark-form-full">
                Image URL
                <input
                  name="image_url"
                  value={form.image_url}
                  onChange={handleFormChange}
                  placeholder="https://..."
                />
              </label>

              <label className="ark-form-full">
                Product Description
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Describe the marble, appearance and recommended use..."
                />
              </label>

              <label className="ark-form-full">
                Product Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="ark-inventory-modal-footer">
              <button
                type="button"
                className="ark-modal-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ark-modal-primary"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LUXURY DELETE CONFIRMATION */}
      {deleteTarget && (
        <div
          className="ark-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="ark-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ark-delete-title"
            aria-describedby="ark-delete-description"
          >
            <button
              type="button"
              className="ark-delete-close"
              aria-label="Close delete confirmation"
              onClick={() => !deleting && setDeleteTarget(null)}
              disabled={deleting}
            >
              <X size={20} />
            </button>

            <div className="ark-delete-heading">
              <div className="ark-delete-emblem">
                <Trash2 size={29} />
              </div>
              <span className="ark-delete-eyebrow">
                ARK MARBLES · INVENTORY CONTROL
              </span>
              <h2 id="ark-delete-title">Delete Product?</h2>
              <p id="ark-delete-description">
                Are you sure you want to delete this product?
                <br />
                This action <strong>cannot be undone.</strong>
              </p>
            </div>

            <div className="ark-delete-product">
              {getImage(deleteTarget) ? (
                <img
                  src={getImage(deleteTarget)}
                  alt={getName(deleteTarget)}
                />
              ) : (
                <div className="ark-delete-product-placeholder">
                  <Gem size={34} />
                </div>
              )}

              <div className="ark-delete-product-copy">
                <strong>{getName(deleteTarget)}</strong>
                <span>
                  {getCode(
                    deleteTarget,
                    products.findIndex((item) => item.id === deleteTarget.id)
                  )}
                </span>
                <div className="ark-delete-stock">
                  <Package size={25} />
                  <span>
                    <small>Current Stock</small>
                    <b>{getStock(deleteTarget).toLocaleString("en-IN")} <em>units</em></b>
                  </span>
                </div>
              </div>
            </div>

            <div className="ark-delete-actions">
              <button
                type="button"
                className="ark-delete-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <X size={18} />
                Keep Product
              </button>

              <button
                type="button"
                className="ark-delete-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <Trash2 size={18} />
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {modalType === "stock" && selectedProduct && (
        <div className="ark-inventory-modal-overlay" onClick={closeModal}>
          <form
            className="ark-inventory-modal ark-stock-modal"
            onSubmit={handleStockUpdate}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ark-inventory-modal-header">
              <div>
                <span>STOCK MANAGEMENT</span>
                <h2>
                  {stockAction === "add" ? "Add Stock" : "Remove Stock"}
                </h2>
              </div>

              <button type="button" onClick={closeModal}>
                <X />
              </button>
            </div>

            <div className="ark-stock-product-summary">
              <strong>{getName(selectedProduct)}</strong>
              <span>
                Current stock: {getStock(selectedProduct)}
              </span>
            </div>

            <label className="ark-stock-input-label">
              Quantity
              <input
                type="number"
                min="1"
                value={stockAmount}
                onChange={(event) => setStockAmount(event.target.value)}
                placeholder="Enter quantity"
                required
              />
            </label>

            <div className="ark-stock-action-choice">
              <button
                type="button"
                className={stockAction === "add" ? "active" : ""}
                onClick={() => setStockAction("add")}
              >
                <Plus size={17} />
                Add Stock
              </button>

              <button
                type="button"
                className={stockAction === "remove" ? "active" : ""}
                onClick={() => setStockAction("remove")}
              >
                <Minus size={17} />
                Remove Stock
              </button>
            </div>

            <div className="ark-inventory-modal-footer">
              <button
                type="button"
                className="ark-modal-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ark-modal-primary"
                disabled={saving}
              >
                {saving ? "Updating..." : "Update Stock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
