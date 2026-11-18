
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  ImagePlus,
  Tag,
  LoaderCircle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Categories.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  image_url: "",
  is_active: true,
};

function getErrorMessage(error) {
  if (!error) return "An unexpected error occurred.";
  if (error.code === "23505") return "A category with this name already exists.";
  if (error.code === "23503") {
    return "This category is being used by other records and cannot be deleted.";
  }
  return error.message || "Please try again.";
}

function exportCategoriesCsv(categories) {
  if (!categories.length) {
    window.alert("There are no categories to export.");
    return;
  }

  const headers = ["Category ID", "Category Name", "Description", "Image URL", "Active"];
  const escapeCsv = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = categories.map((category) =>
    [
      category.id,
      category.name,
      category.description,
      category.display_image_url || category.image_url,
      category.is_active ?? true,
    ]
      .map(escapeCsv)
      .join(",")
  );

  const blob = new Blob(
    ["\uFEFF", [headers.map(escapeCsv).join(","), ...rows].join("\r\n")],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ark-marbles-categories.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}


// Convert local paths such as "images/marbles/example.png" into root paths.
// Full Supabase Storage URLs are left unchanged.
function normalizeImageUrl(value) {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

// These are real image files visible in the project's public/images folders.
// They are used only when a category and its products do not have an image URL.
const CATEGORY_IMAGE_FALLBACKS = {
  "white marble": ["/images/marbles/carrara-white.png", "/images/marbles/calacatta-gold.png"],
  "black marble": ["/images/marbles/Nero Marquina Marble.png"],
  "onyx marble": ["/images/marbles/Honey Onyx Marble.png"],
  "green marble": ["/images/marbles/Verde Alpi Marble.png"],
  "grey marble": ["/images/marbles/Grey Emperador Marble.png"],
  "gray marble": ["/images/marbles/Grey Emperador Marble.png"],
  "brown marble": ["/images/marbles/Emperador Brown Marble.png"],
  "red marble": ["/images/marbles/Burgundy Wave Marble.png"],
  "blue marble": ["/images/marbles/Blue Crystal Marble.png"],
  "fusion marble": [
    "/images/marbles/Blue River Fusion Marble.png",
    "/images/marbles/Emerald Fusion Marble.png",
    "/images/marbles/Black & White Fusion Marble.png",
  ],
  granite: ["/images/marbles/world-class-marbles.png"],
  "imported marble": ["/images/marbles/world-class-marbles.png"],
  "indian marble": ["/images/marbles/Verde Alpi Marble.png"],
  "italian marble": ["/images/marbles/Calacatta Gold.png", "/images/marbles/calacatta-gold.png"],
  travertine: ["/images/marbles/Honey Onyx Marble.png"],
  marbles: ["/images/marbles/world-class-marbles.png"],
  cement: ["/images/construction/cement.jpg"],
  "steel & tmt rods": ["/images/construction/tmt-rod.jpg"],
  "bricks & blocks": ["/images/construction/red-brick.jpg"],
  "pipes & plumbing": ["/images/construction/pvc-pipe.jpg"],
  "construction essentials": ["/images/construction/tile-adhesive.jpg"],
};

function getCategoryImageCandidates(category, products) {
  const categoryName = String(category?.name ?? "").trim().toLowerCase();

  const productImages = products
    .filter(
      (product) =>
        String(product.category ?? "").trim().toLowerCase() === categoryName
    )
    .map((product) => normalizeImageUrl(product.image_url))
    .filter(Boolean);

  const candidates = [
    normalizeImageUrl(category?.image_url),
    ...productImages,
    ...(CATEGORY_IMAGE_FALLBACKS[categoryName] ?? []),
  ];

  return [...new Set(candidates.filter(Boolean))];
}

function CategoryImage({
  candidates = [],
  alt = "Category",
  className = "",
  fallbackClassName = "admin-categories-image-fallback",
  fallbackIcon = <Package size={22} />,
}) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [candidates.join("|")]);

  if (!candidates.length || imageIndex >= candidates.length) {
    return <div className={fallbackClassName}>{fallbackIcon}</div>;
  }

  return (
    <img
      className={className}
      src={candidates[imageIndex]}
      alt={alt}
      loading="lazy"
      onError={() => setImageIndex((current) => current + 1)}
    />
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (queryError) throw queryError;

      setCategories(data ?? []);

      const { data: productRows, error: productsError } = await supabase
        .from("marbles")
        .select("id, category, image_url");

      if (productsError) {
        console.warn("Could not load product counts:", productsError.message);
        setProducts([]);
      } else {
        setProducts(productRows ?? []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const productCategoryNames = useMemo(() => {
    return [...new Set(
      products
        .map((product) => String(product.category ?? "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Match category records to the exact category strings used by products.
  // Categories without products remain visible but are treated as inactive.
  const catalogueCategories = useMemo(() => {
    return categories.map((category) => {
      const matchingProducts = products.filter(
        (product) =>
          String(product.category ?? "").trim().toLowerCase() ===
          String(category.name ?? "").trim().toLowerCase()
      );

      const imageCandidates = getCategoryImageCandidates(category, matchingProducts);

      return {
        ...category,
        product_count: matchingProducts.length,
        display_image_url: imageCandidates[0] || "",
        image_candidates: imageCandidates,
        is_active: matchingProducts.length > 0 && (category.is_active ?? true),
      };
    });
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return catalogueCategories;

    return catalogueCategories.filter((category) =>
      [
        category.id,
        category.name,
        category.description,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [catalogueCategories, search]);

  const openAddForm = () => {
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview("");
    setError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      image_url: category.image_url ?? "",
      is_active: category.is_active ?? true,
    });
    setImageFile(null);
    setImagePreview(category.image_url ?? "");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview("");
    setError("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadCategoryImage = async () => {
    if (!imageFile) return form.image_url.trim() || null;

    const safeName = imageFile.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-");
    const filePath = `categories/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("category-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice(null);

    const name = form.name.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        String(category.name ?? "").trim().toLowerCase() ===
          name.toLowerCase() &&
        category.id !== editingCategory?.id
    );

    if (duplicate) {
      setError("A category with this name already exists.");
      return;
    }

    setSaving(true);

    try {
      const uploadedImageUrl = await uploadCategoryImage();
      const payload = {
        name,
        description: form.description.trim() || null,
        image_url: uploadedImageUrl,
        is_active: form.is_active ?? true,
      };

      const result = editingCategory
        ? await supabase
            .from("categories")
            .update(payload)
            .eq("id", editingCategory.id)
            .select()
            .single()
        : await supabase
            .from("categories")
            .insert(payload)
            .select()
            .single();

      if (result.error) throw result.error;

      setShowForm(false);
      setEditingCategory(null);
      setForm({ ...EMPTY_FORM });
      setImageFile(null);
      setImagePreview("");
      setNotice({
        type: "success",
        message: editingCategory
          ? "Category updated successfully."
          : "Category created successfully.",
      });

      await loadCategories(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory || deleting) return;

    setDeleting(true);
    setError("");
    setNotice(null);

    try {
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", deletingCategory.id);

      if (deleteError) throw deleteError;

      setSelectedCategory((current) =>
        current?.id === deletingCategory.id ? null : current
      );

      setDeleteSuccess(true);
      setNotice({
        type: "success",
        message: "Category deleted successfully.",
      });
      await loadCategories(true);
      // Keep the success animation visible briefly, then close automatically.
      window.setTimeout(() => {
        setDeletingCategory(null);
        setDeleteSuccess(false);
      }, 850);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const activeImage = (category) =>
    getCategoryImageCandidates(category, products)[0] || "";

  const getCategoryType = (categoryName = "") => {
    const value = String(categoryName).trim().toLowerCase();
    const constructionTerms = [
      "cement", "steel", "tmt", "brick", "block", "pipe", "plumbing",
      "electrical", "hardware", "adhesive", "paint", "sand", "construction"
    ];
    return constructionTerms.some((term) => value.includes(term))
      ? "Construction"
      : "Marble";
  };

  const getProductCount = (categoryName = "") =>
    products.filter(
      (product) =>
        String(product.category ?? "").trim().toLowerCase() ===
        String(categoryName).trim().toLowerCase()
    ).length;

  const categoryTypeCounts = productCategoryNames.reduce(
    (counts, categoryName) => {
      const type = getCategoryType(categoryName);
      counts[type] += 1;
      return counts;
    },
    { Marble: 0, Construction: 0 }
  );

  const marbleCategoryCount = categoryTypeCounts.Marble;
  const constructionCategoryCount = categoryTypeCounts.Construction;

  const toggleCategoryStatus = async (category) => {
    const nextStatus = !(category.product_count > 0 && (category.is_active ?? true));
    setError("");
    setNotice(null);

    const { error: updateError } = await supabase
      .from("categories")
      .update({ is_active: nextStatus })
      .eq("id", category.id);

    if (updateError) {
      setError(getErrorMessage(updateError));
      return;
    }

    setCategories((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, is_active: nextStatus } : item
      )
    );
    setNotice({
      type: "success",
      message: `${category.name} is now ${nextStatus ? "active" : "inactive"}.`,
    });
  };

  return (
    <main className="admin-categories-page">
      <div className="admin-categories-container">
        <header className="admin-categories-header">
          <div className="admin-categories-heading">
            <div className="admin-categories-heading-icon">
              <Layers size={26} />
            </div>
            <div>
              <p className="admin-categories-eyebrow">
                ARK MARBLES / CATALOGUE
              </p>
              <h1>Categories</h1>
              <p className="admin-categories-subtitle">
                Organize marble, granite, quartz, tiles, cement, steel, bricks, sand, plumbing, electrical, and hardware.
              </p>
            </div>
          </div>

          <div className="admin-categories-header-actions">
            <button
              type="button"
              className="admin-categories-button categories-secondary"
              onClick={() => loadCategories(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "categories-spinning" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              className="admin-categories-button categories-secondary"
              onClick={() => exportCategoriesCsv(filteredCategories)}
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              type="button"
              className="admin-categories-button categories-primary"
              onClick={openAddForm}
            >
              <Plus size={17} />
              Add Category
            </button>
          </div>
        </header>

        {notice && (
          <div className="admin-categories-notice notice-success" role="status">
            <CheckCircle2 size={18} />
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="admin-categories-notice notice-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="admin-categories-stats">
          <article className="admin-categories-stat-card">
            <div className="admin-categories-stat-icon"><Layers size={22} /></div>
            <div><span>Total Categories</span><h2>{productCategoryNames.length}</h2><p>Categories used by products</p></div>
          </article>
          <article className="admin-categories-stat-card">
            <div className="admin-categories-stat-icon"><Tag size={22} /></div>
            <div><span>Marble Categories</span><h2>{marbleCategoryCount}</h2><p>Stone and marble collections</p></div>
          </article>
          <article className="admin-categories-stat-card">
            <div className="admin-categories-stat-icon"><Package size={22} /></div>
            <div><span>Construction Categories</span><h2>{constructionCategoryCount}</h2><p>Building material collections</p></div>
          </article>
          <article className="admin-categories-stat-card">
            <div className="admin-categories-stat-icon"><ImagePlus size={22} /></div>
            <div><span>Total Products</span><h2>{products.length}</h2><p>Products in your catalogue</p></div>
          </article>
        </section>

        <section className="admin-categories-panel">
          <div className="admin-categories-panel-heading">
            <div>
              <h2>All Categories</h2>
              <p>Product counts and active categories are matched to the exact category names in your marbles catalogue. Unused legacy categories are retained as inactive.</p>
            </div>
            <span className="admin-categories-count">
              {filteredCategories.length} records
            </span>
          </div>

          <div className="admin-categories-filters">
            <label className="admin-categories-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by category name, description, or ID..."
                aria-label="Search categories"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <button
              type="button"
              className="admin-categories-reset"
              onClick={() => setSearch("")}
            >
              <RefreshCw size={15} />
              Clear search
            </button>
          </div>

          {loading ? (
            <div className="admin-categories-loading">
              <LoaderCircle size={30} className="categories-spinning" />
              <h3>Loading categories</h3>
              <p>Connecting to your catalogue...</p>
            </div>
          ) : error && categories.length === 0 ? (
            <div className="admin-categories-empty">
              <AlertCircle size={30} />
              <h3>Could not load categories</h3>
              <p>Check your Supabase connection, table permissions, and RLS policies.</p>
              <button
                type="button"
                className="admin-categories-button categories-primary"
                onClick={() => loadCategories()}
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="admin-categories-empty">
              <div className="admin-categories-empty-icon">
                <Tag size={29} />
              </div>
              <h3>
                {categories.length === 0
                  ? "Your catalogue is ready"
                  : "No matching categories"}
              </h3>
              <p>
                {categories.length === 0
                  ? "Create your first category to start organizing your products."
                  : "Try another search term or clear the current search."}
              </p>
              {categories.length === 0 ? (
                <button
                  type="button"
                  className="admin-categories-button categories-primary"
                  onClick={openAddForm}
                >
                  <Plus size={16} />
                  Add your first category
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-categories-button categories-secondary"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="admin-categories-table-wrap">
              <table className="admin-categories-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category image</th>
                    <th>Category name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category, index) => {
                    const categoryType = getCategoryType(category.name);
                    return (
                      <tr key={category.id}>
                        <td className="categories-row-number">{index + 1}</td>
                        <td>
                          <div className="categories-table-image">
                            <CategoryImage
                              candidates={category.image_candidates || getCategoryImageCandidates(category, products)}
                              alt={category.name}
                            />
                          </div>
                        </td>
                        <td>
                          <strong className="categories-table-name">{category.name}</strong>
                          <span className="categories-table-id">ID: {category.id}</span>
                        </td>
                        <td>
                          <span className={`categories-type-pill ${
                            categoryType === "Construction" ? "construction-type" : ""
                          }`}>
                            {categoryType}
                          </span>
                        </td>
                        <td className="categories-table-description">
                          {category.description || "No description added"}
                        </td>
                        <td className="categories-product-count">
                          {category.product_count ?? getProductCount(category.name)} Products
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`categories-status-toggle ${
                              (category.is_active ?? true) ? "is-active" : "is-inactive"
                            }`}
                            onClick={() => toggleCategoryStatus(category)}
                            disabled={(category.product_count ?? 0) === 0}
                            title={(category.product_count ?? 0) === 0 ? "Unused categories stay inactive until products use them." : "Change category status"}
                            aria-label={`Set ${category.name} ${
                              (category.is_active ?? true) ? "inactive" : "active"
                            }`}
                          >
                            <span className="categories-status-switch"><i /></span>
                            <span>{(category.is_active ?? true) ? "Active" : "Inactive"}</span>
                          </button>
                        </td>
                        <td>
                          <div className="categories-table-actions">
                            <button
                              type="button"
                              className="admin-categories-icon-button"
                              onClick={() => setSelectedCategory(category)}
                              title="View category"
                              aria-label={`View ${category.name}`}
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              type="button"
                              className="admin-categories-icon-button"
                              onClick={() => openEditForm(category)}
                              title="Edit category"
                              aria-label={`Edit ${category.name}`}
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              type="button"
                              className="admin-categories-icon-button categories-delete"
                              onClick={() => setDeletingCategory(category)}
                              title="Delete category"
                              aria-label={`Delete ${category.name}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="admin-categories-footer">
            <span>
              Showing {filteredCategories.length} of {categories.length} categories
            </span>
            <span>ARK MARBLES ADMIN</span>
          </footer>
        </section>
      </div>

      {showForm && (
        <div
          className="admin-categories-modal-backdrop category-edit-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="admin-categories-modal category-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-category-form-title"
          >
            <header className="admin-categories-modal-header category-edit-header">
              <div>
                <p className="category-edit-eyebrow">ARK MARBLES · CATEGORY STUDIO</p>
                <h2 id="admin-category-form-title" className="category-edit-title">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
              </div>
              <button
                type="button"
                className="admin-categories-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="admin-categories-form-body category-edit-form-body">
                {error && (
                  <div className="admin-categories-inline-error" role="alert">
                    <AlertCircle size={17} />
                    {error}
                  </div>
                )}

                <label className="admin-categories-field">
                  Category name <span>*</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Marble, Cement, Steel, Tiles, Plumbing"
                    maxLength={120}
                    required
                    autoFocus
                  />
                </label>

                <label className="admin-categories-field">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe this product category..."
                    rows={4}
                    maxLength={1000}
                  />
                </label>

                <label className="admin-categories-field">
                  Upload category image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                  />
                  <small className="categories-upload-help">
                    JPG, PNG, WebP or GIF. Maximum file size: 5 MB.
                  </small>
                </label>

                {imagePreview && (
                  <div className="admin-categories-image-preview">
                    <span>IMAGE PREVIEW</span>
                    <img src={imagePreview} alt="Category preview" />
                    <button
                      type="button"
                      className="categories-remove-image"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setForm((current) => ({ ...current, image_url: "" }));
                      }}
                    >
                      Remove image
                    </button>
                  </div>
                )}

                <label className="categories-active-field">
                  <input
                    type="checkbox"
                    checked={form.is_active ?? true}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Category is active
                </label>
              </div>

              <footer className="admin-categories-modal-footer category-edit-footer">
                <button
                  type="button"
                  className="admin-categories-button categories-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-categories-button categories-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle size={16} className="categories-spinning" />
                  ) : editingCategory ? (
                    <Pencil size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedCategory && (
        <div
          className="admin-categories-modal-backdrop category-blue-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCategory(null);
          }}
        >
          <section
            className="category-blue-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-blue-title"
          >
            <header className="category-blue-header">
              <div className="category-blue-heading">
                <span className="category-blue-icon"><Layers size={20} /></span>
                <div>
                  <p className="category-blue-eyebrow">ARK MARBLES / COLLECTION</p>
                  <h2 id="category-blue-title">{selectedCategory.name}</h2>
                </div>
              </div>
              <button
                type="button"
                className="category-blue-close"
                onClick={() => setSelectedCategory(null)}
                aria-label="Close category details"
              >
                <X size={20} />
              </button>
            </header>

            <div className="category-blue-body">
              <div className="category-blue-image-frame">
                <CategoryImage
                  candidates={getCategoryImageCandidates(selectedCategory, products)}
                  alt={selectedCategory.name}
                  className="category-blue-image"
                  fallbackClassName="category-blue-image-fallback"
                  fallbackIcon={<ImagePlus size={42} />}
                />
                <span className="category-blue-image-label">PREMIUM COLLECTION</span>
              </div>

              <div className="category-blue-summary">
                <article className="category-blue-summary-card">
                  <Package size={21} />
                  <span>Category ID</span>
                  <strong title={selectedCategory.id}>
                    {selectedCategory.id ? String(selectedCategory.id) : "N/A"}
                  </strong>
                </article>
                <article className="category-blue-summary-card">
                  <Layers size={21} />
                  <span>Products</span>
                  <strong>{getProductCount(selectedCategory.name)}</strong>
                </article>
                <article className="category-blue-summary-card">
                  <CheckCircle2 size={21} />
                  <span>Status</span>
                  <strong className={(selectedCategory.is_active ?? true) ? "category-blue-active" : "category-blue-inactive"}>
                    {(selectedCategory.is_active ?? true) ? "Active" : "Inactive"}
                  </strong>
                </article>
              </div>

              <div className="category-blue-description">
                <div className="category-blue-description-title">
                  <Tag size={19} />
                  <span>About this category</span>
                </div>
                <p>
                  {selectedCategory.description ||
                    `Explore the ${selectedCategory.name} collection at ARK MARBLES.`}
                </p>
              </div>
            </div>

            <footer className="category-blue-footer">
              {activeImage(selectedCategory) ? (
                <a
                  className="category-blue-open-image"
                  href={activeImage(selectedCategory)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} /> View full image
                </a>
              ) : (
                <span className="category-blue-no-image">No image available</span>
              )}
              <div className="category-blue-actions">
                <button
                  type="button"
                  className="category-blue-secondary"
                  onClick={() => setSelectedCategory(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="category-blue-primary"
                  onClick={() => {
                    const category = selectedCategory;
                    setSelectedCategory(null);
                    openEditForm(category);
                  }}
                >
                  <Pencil size={16} /> Edit Category
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {deletingCategory && (
        <div
          className={`admin-categories-modal-backdrop category-delete-backdrop ${
            deleteSuccess ? "is-success" : ""
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeletingCategory(null);
              setDeleteSuccess(false);
            }
          }}
        >
          <section
            className={`admin-categories-confirm-modal category-delete-modal ${
              deleteSuccess ? "is-success" : ""
            }`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-category-delete-title"
          >
            <div className={`admin-categories-confirm-icon category-delete-icon ${
              deleteSuccess ? "is-success" : ""
            }`}>
              {deleteSuccess ? <CheckCircle2 size={27} /> : <Trash2 size={25} />}
            </div>
            <p className="category-delete-eyebrow">
              {deleteSuccess ? "ACTION COMPLETED" : "ARK MARBLES · CONFIRMATION"}
            </p>
            <h2 id="admin-category-delete-title">
              {deleteSuccess ? "Category Deleted" : "Delete this category?"}
            </h2>
            <p className="category-delete-message">
              {deleteSuccess ? (
                <><strong>{deletingCategory.name}</strong> has been removed successfully.</>
              ) : (
                <>You are about to permanently delete <strong>{deletingCategory.name}</strong>. This action cannot be undone. Categories linked to products may be protected by the database.</>
              )}
            </p>
            {!deleteSuccess && (
              <div className="admin-categories-modal-footer category-delete-actions">
                <button
                  type="button"
                  className="admin-categories-button categories-secondary"
                  onClick={() => setDeletingCategory(null)}
                  disabled={deleting}
                >
                  Keep Category
                </button>
                <button
                  type="button"
                  className="admin-categories-button categories-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <LoaderCircle size={16} className="categories-spinning" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {deleting ? "Deleting..." : "Delete Category"}
                </button>
              </div>
            )}
            {deleteSuccess && (
              <div className="category-delete-progress">
                <span />
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
