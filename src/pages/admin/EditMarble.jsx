import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  Save,
  RotateCcw,
  ImagePlus,
  IndianRupee,
  Ruler,
  Barcode,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  category: "",
  brand: "",
  sku: "",
  color: "",
  finish: "",
  thickness: "",
  size: "",
  price: "",
  costPrice: "",
  quantity: "",
  unit: "Sq. Ft.",
  lowStockThreshold: "10",
  description: "",
  status: "Active",
};

const CATEGORIES = [
  "Marble",
  "Granite",
  "Quartz",
  "Tiles",
  "Natural Stone",
  "Other",
];

const FINISHES = [
  "Polished",
  "Honed",
  "Leather",
  "Flamed",
  "Matt",
  "Glossy",
  "Other",
];

function normalizeMarble(marble) {
  if (!marble) return EMPTY_FORM;

  return {
    name: marble.name ?? "",
    category: marble.category ?? "",
    brand: marble.brand ?? "",
    sku: marble.sku ?? "",
    color: marble.color ?? "",
    finish: marble.finish ?? "",
    thickness: marble.thickness ?? "",
    size: marble.size ?? "",
    price: String(marble.price ?? ""),
    costPrice: String(marble.costPrice ?? marble.cost_price ?? ""),
    quantity: String(marble.quantity ?? ""),
    unit: marble.unit ?? "Sq. Ft.",
    lowStockThreshold: String(
      marble.lowStockThreshold ?? marble.low_stock_threshold ?? "10"
    ),
    description: marble.description ?? "",
    status: marble.status ?? "Active",
  };
}

export default function EditMarble({ marble, onBack, onSave }) {
  const [form, setForm] = useState(() => normalizeMarble(marble));
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    marble?.image_url || marble?.imageUrl || ""
  );
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(normalizeMarble(marble));
    setImage(null);
    setImagePreview(marble?.image_url || marble?.imageUrl || "");
    setNotice("");
  }, [marble]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function showNotice(message, type = "success") {
    setNotice(message);
    setNoticeType(type);
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("Please select a valid image file.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice("Image size must be 5 MB or less.", "error");
      event.target.value = "";
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setNotice("");
  }

  function resetForm() {
    setForm(normalizeMarble(marble));
    setImage(null);
    setImagePreview(marble?.image_url || marble?.imageUrl || "");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!marble) {
      showNotice("No marble product was selected for editing.", "error");
      return;
    }

    if (!form.name.trim()) {
      showNotice("Please enter the product name.", "error");
      return;
    }

    if (!form.category) {
      showNotice("Please select a product category.", "error");
      return;
    }

    const price = Number(form.price);
    const costPrice = Number(form.costPrice || 0);
    const quantity = Number(form.quantity);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      showNotice("Enter a valid selling price.", "error");
      return;
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      showNotice("Enter a valid cost price.", "error");
      return;
    }

    if (
      form.quantity === "" ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      showNotice("Enter a valid stock quantity.", "error");
      return;
    }

    if (
      form.lowStockThreshold === "" ||
      !Number.isFinite(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      showNotice("Enter a valid low-stock threshold.", "error");
      return;
    }

    if (typeof onSave !== "function") {
      showNotice(
        "No save handler is connected. Connect your marble service to save changes.",
        "error"
      );
      return;
    }

    const updatedMarble = {
      ...marble,
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      price,
      costPrice,
      quantity,
      lowStockThreshold,
      image,
    };

    try {
      setSaving(true);
      await onSave(updatedMarble);
      showNotice("Marble update submitted successfully.");
    } catch (error) {
      showNotice(
        error?.message || "Unable to update the marble product.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!marble) {
    return (
      <main className="admin-edit-marble-page">
        <div className="admin-edit-marble-empty">
          <Package size={38} />
          <h2>No marble selected</h2>
          <p>Select a product from the inventory page to edit its details.</p>

          <button
            type="button"
            className="admin-edit-marble-button edit-marble-primary"
            onClick={() => onBack?.()}
          >
            <ArrowLeft size={17} />
            Back to Inventory
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-edit-marble-page">
      <div className="admin-edit-marble-container">
        <div className="admin-edit-marble-breadcrumb">
          <button
            type="button"
            className="admin-edit-marble-back"
            onClick={() => onBack?.()}
          >
            <ArrowLeft size={17} />
            Back to Inventory
          </button>

          <span>/</span>
          <span>Edit Marble</span>
        </div>

        <header className="admin-edit-marble-header">
          <div className="admin-edit-marble-heading">
            <div className="admin-edit-marble-heading-icon">
              <Package size={25} />
            </div>

            <div>
              <p className="admin-edit-marble-eyebrow">
                ARK MARBLES / INVENTORY
              </p>
              <h1>Edit Marble</h1>
              <p className="admin-edit-marble-subtitle">
                Update product specifications, pricing, and stock information.
              </p>
            </div>
          </div>
        </header>

        {notice && (
          <div
            className={`admin-edit-marble-notice ${
              noticeType === "error" ? "notice-error" : "notice-success"
            }`}
            role="status"
          >
            {noticeType === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}

            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="admin-edit-marble-form"
        >
          <div className="admin-edit-marble-main">
            <section className="admin-edit-marble-card">
              <div className="admin-edit-marble-card-heading">
                <div className="edit-marble-section-icon">
                  <Package size={19} />
                </div>

                <div>
                  <h2>Basic Information</h2>
                  <p>Update the main details of this product.</p>
                </div>
              </div>

              <div className="admin-edit-marble-grid">
                <label className="admin-edit-marble-field">
                  Product Name *
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Enter product name"
                    required
                  />
                </label>

                <label className="admin-edit-marble-field">
                  Category *
                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-edit-marble-field">
                  Brand / Origin
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(event) =>
                      updateField("brand", event.target.value)
                    }
                    placeholder="Enter brand or origin"
                  />
                </label>

                <label className="admin-edit-marble-field">
                  SKU / Product Code
                  <div className="admin-edit-marble-input-icon">
                    <Barcode size={17} />
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(event) =>
                        updateField("sku", event.target.value)
                      }
                      placeholder="Enter SKU"
                    />
                  </div>
                </label>

                <label className="admin-edit-marble-field">
                  Color
                  <input
                    type="text"
                    value={form.color}
                    onChange={(event) =>
                      updateField("color", event.target.value)
                    }
                    placeholder="Enter color"
                  />
                </label>

                <label className="admin-edit-marble-field">
                  Surface Finish
                  <select
                    value={form.finish}
                    onChange={(event) =>
                      updateField("finish", event.target.value)
                    }
                  >
                    <option value="">Select finish</option>
                    {FINISHES.map((finish) => (
                      <option key={finish} value={finish}>
                        {finish}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-edit-marble-field">
                  Thickness
                  <input
                    type="text"
                    value={form.thickness}
                    onChange={(event) =>
                      updateField("thickness", event.target.value)
                    }
                    placeholder="e.g. 18 mm"
                  />
                </label>

                <label className="admin-edit-marble-field">
                  Slab / Tile Size
                  <div className="admin-edit-marble-input-icon">
                    <Ruler size={17} />
                    <input
                      type="text"
                      value={form.size}
                      onChange={(event) =>
                        updateField("size", event.target.value)
                      }
                      placeholder="e.g. 10 × 5 ft"
                    />
                  </div>
                </label>

                <label className="admin-edit-marble-field admin-edit-marble-field-full">
                  Product Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Enter product description"
                    rows={4}
                  />
                </label>
              </div>
            </section>

            <section className="admin-edit-marble-card">
              <div className="admin-edit-marble-card-heading">
                <div className="edit-marble-section-icon">
                  <IndianRupee size={19} />
                </div>

                <div>
                  <h2>Pricing Information</h2>
                  <p>Update cost and selling prices.</p>
                </div>
              </div>

              <div className="admin-edit-marble-grid">
                <label className="admin-edit-marble-field">
                  Selling Price *
                  <div className="admin-edit-marble-input-icon">
                    <IndianRupee size={17} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        updateField("price", event.target.value)
                      }
                      required
                    />
                  </div>
                </label>

                <label className="admin-edit-marble-field">
                  Cost Price
                  <div className="admin-edit-marble-input-icon">
                    <IndianRupee size={17} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(event) =>
                        updateField("costPrice", event.target.value)
                      }
                    />
                  </div>
                </label>

                <label className="admin-edit-marble-field">
                  Selling Unit
                  <select
                    value={form.unit}
                    onChange={(event) =>
                      updateField("unit", event.target.value)
                    }
                  >
                    <option value="Sq. Ft.">Square Feet (Sq. Ft.)</option>
                    <option value="Sq. M.">Square Metres (Sq. M.)</option>
                    <option value="Slab">Slab</option>
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                    <option value="Ton">Ton</option>
                  </select>
                </label>

                <div className="admin-edit-marble-price-preview">
                  <span>Updated selling price</span>
                  <strong>
                    ₹
                    {(Number(form.price) || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <small>Per {form.unit}</small>
                </div>
              </div>
            </section>

            <section className="admin-edit-marble-card">
              <div className="admin-edit-marble-card-heading">
                <div className="edit-marble-section-icon">
                  <Package size={19} />
                </div>

                <div>
                  <h2>Inventory Information</h2>
                  <p>Update stock quantity and product availability.</p>
                </div>
              </div>

              <div className="admin-edit-marble-grid">
                <label className="admin-edit-marble-field">
                  Stock Quantity *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      updateField("quantity", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="admin-edit-marble-field">
                  Low Stock Threshold
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.lowStockThreshold}
                    onChange={(event) =>
                      updateField("lowStockThreshold", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="admin-edit-marble-field">
                  Product Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>

                <div className="admin-edit-marble-stock-preview">
                  <Package size={19} />
                  <div>
                    <span>Current stock</span>
                    <strong>
                      {form.quantity === "" ? "—" : form.quantity} {form.unit}
                    </strong>
                    <small>
                      {form.quantity === ""
                        ? "Quantity not entered"
                        : Number(form.quantity) === 0
                          ? "Out of stock"
                          : Number(form.quantity) <=
                              Number(form.lowStockThreshold)
                            ? "Low stock"
                            : "Stock available"}
                    </small>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="admin-edit-marble-sidebar">
            <section className="admin-edit-marble-card">
              <div className="admin-edit-marble-card-heading">
                <div className="edit-marble-section-icon">
                  <ImagePlus size={19} />
                </div>

                <div>
                  <h2>Product Image</h2>
                  <p>Update the product image.</p>
                </div>
              </div>

              <label className="admin-edit-marble-image-upload">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Marble product preview"
                    className="admin-edit-marble-image-preview"
                  />
                ) : (
                  <div className="admin-edit-marble-image-placeholder">
                    <ImagePlus size={29} />
                    <strong>Choose product image</strong>
                    <span>Click to upload a new image</span>
                    <small>Maximum file size: 5 MB</small>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>

              {imagePreview && (
                <button
                  type="button"
                  className="admin-edit-marble-remove-image"
                  onClick={() => {
                    setImage(null);
                    setImagePreview("");
                  }}
                >
                  <X size={15} />
                  Remove image preview
                </button>
              )}

              <p className="admin-edit-marble-image-note">
                A newly selected image is passed to the save handler as a
                File object. Upload it to your storage service before saving
                its URL to the database.
              </p>
            </section>

            <section className="admin-edit-marble-card admin-edit-marble-summary">
              <h3>Product Summary</h3>

              <div className="edit-marble-summary-row">
                <span>Product</span>
                <strong>{form.name || "—"}</strong>
              </div>

              <div className="edit-marble-summary-row">
                <span>Category</span>
                <strong>{form.category || "—"}</strong>
              </div>

              <div className="edit-marble-summary-row">
                <span>Selling price</span>
                <strong>
                  ₹
                  {(Number(form.price) || 0).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>

              <div className="edit-marble-summary-row">
                <span>Quantity</span>
                <strong>
                  {form.quantity === "" ? "—" : form.quantity} {form.unit}
                </strong>
              </div>

              <div className="edit-marble-summary-row">
                <span>Status</span>
                <strong>{form.status}</strong>
              </div>
            </section>
          </aside>

          <div className="admin-edit-marble-form-actions">
            <button
              type="button"
              className="admin-edit-marble-button edit-marble-secondary"
              onClick={resetForm}
              disabled={saving}
            >
              <RotateCcw size={17} />
              Reset Changes
            </button>

            <button
              type="submit"
              className="admin-edit-marble-button edit-marble-primary"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <footer className="admin-edit-marble-footer">
          <span>ARK MARBLES</span>
          <span>Inventory Management</span>
        </footer>
      </div>
    </main>
  );
}