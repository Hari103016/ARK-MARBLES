import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  Gem,
  HardHat,
  ImagePlus,
  Info,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./AddMarble.css";

const STORAGE_BUCKET = "marble-images";
const MAX_IMAGES = 5;

const EMPTY_FORM = {
  productType: "marble",
  name: "",
  sku: "",
  category: "",
  subCategory: "",
  price: "",
  stock: "0",
  minimumStock: "10",
  thickness: "",
  finish: "",
  color: "",
  size: "",
  origin: "",
  materialType: "Natural Marble",
  unit: "Sq.Ft",
  brand: "",
  materialGrade: "",
  manufacturer: "",
  description: "",
  isAvailable: true,
};

const MARBLE_CATEGORIES = [
  "Italian Marble",
  "Indian Marble",
  "Imported Marble",
  "Granite",
  "Onyx",
  "Quartz",
  "Travertine",
  "Other Natural Stone",
];

const CONSTRUCTION_CATEGORIES = [
  "Cement",
  "Steel & TMT Bars",
  "Bricks & Blocks",
  "Tiles & Stones",
  "Pipes & Plumbing",
  "Electrical",
  "Paints & Chemicals",
  "Hardware",
  "Other Construction Material",
];

const MARBLE_SUBCATEGORIES = [
  "Statuario",
  "Carrara",
  "Calacatta",
  "Nero Marquina",
  "Emperador",
  "Onyx",
  "Fusion Marble",
  "Other",
];

const CONSTRUCTION_SUBCATEGORIES = [
  "Cement Bags",
  "TMT Rods",
  "Red Clay Bricks",
  "AAC Blocks",
  "Floor Tiles",
  "PVC Pipes",
  "Electrical Fittings",
  "Paint",
  "Other",
];

const UNITS = [
  "Sq.Ft",
  "Sq.M",
  "Piece",
  "Bag",
  "Kg",
  "Ton",
  "Meter",
  "Feet",
  "Box",
  "Bundle",
  "Litre",
  "Roll",
];

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function makeSku(type) {
  const prefix = type === "marble" ? "ARK-MB" : "ARK-CM";
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

export default function AddMarble() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const imageUrlRefs = useRef([]);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    sku: makeSku("marble"),
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successProduct, setSuccessProduct] = useState(null);

  const isMarble = form.productType === "marble";
  const categories = isMarble ? MARBLE_CATEGORIES : CONSTRUCTION_CATEGORIES;
  const subCategories = isMarble
    ? MARBLE_SUBCATEGORIES
    : CONSTRUCTION_SUBCATEGORIES;

  const heroImage = imagePreviews[activeImage] || "";

  const infoRows = useMemo(() => {
    if (isMarble) {
      return [
        ["Product Type", form.materialType || "Marble Slab"],
        ["Ideal Usage", "Flooring, Wall Cladding, Countertops"],
        ["Features", "Durable, Elegant, Long Lasting"],
        ["Available Sizes", form.size || "Custom Size Available"],
        ["Finish Options", form.finish || "Polished / Honed / Matt"],
        ["Applications", "Residential, Commercial, Hotels"],
      ];
    }

    return [
      ["Product Type", "Construction Material"],
      ["Category", form.category || "Building Material"],
      ["Brand", form.brand || "Multiple Brands"],
      ["Unit of Measure", form.unit || "Piece"],
      ["Material Grade", form.materialGrade || "As per manufacturer"],
      ["Applications", "Residential, Commercial, Infrastructure"],
    ];
  }, [form, isMarble]);

  useEffect(() => {
    return () => {
      imageUrlRefs.current.forEach((url) => URL.revokeObjectURL(url));
      imageUrlRefs.current = [];
    };
  }, []);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const changeProductType = (type) => {
    setForm((current) => ({
      ...EMPTY_FORM,
      productType: type,
      sku: makeSku(type),
      unit: type === "marble" ? "Sq.Ft" : "Bag",
      isAvailable: current.isAvailable,
    }));
    clearImages();
    setError("");
  };

  const clearImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    imageUrlRefs.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlRefs.current = [];
    setActiveImage(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addImages = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const invalid = incoming.find((file) => !allowed.includes(file.type));
    if (invalid) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    const tooLarge = incoming.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      setError("Each image must be 10 MB or smaller.");
      return;
    }

    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      setError("You can upload a maximum of 5 product images.");
      return;
    }

    const selected = incoming.slice(0, remaining);
    const urls = selected.map((file) => URL.createObjectURL(file));
    imageUrlRefs.current.push(...urls);
    setImageFiles((current) => [...current, ...selected]);
    setImagePreviews((current) => [...current, ...urls]);
    setActiveImage((current) => (current === 0 ? 0 : current));
    setError("");
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    imageUrlRefs.current = imageUrlRefs.current.filter((url) => url !== imagePreviews[index]);
    setImageFiles((current) => current.filter((_, i) => i !== index));
    setImagePreviews((current) => current.filter((_, i) => i !== index));
    setActiveImage((current) => {
      if (current > index) return current - 1;
      if (current >= imagePreviews.length - 1) return Math.max(0, current - 1);
      return current;
    });
  };

  const uploadImages = async () => {
    const uploaded = [];

    for (const file of imageFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${form.productType}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        if (uploaded.length) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(uploaded.map((item) => item.path));
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) {
        throw new Error("Supabase did not return a public image URL.");
      }

      uploaded.push({ path, url: data.publicUrl });
    }

    return uploaded;
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Please enter the product name.";
    if (!form.category.trim()) return "Please select a category.";
    if (!form.sku.trim()) return "Please enter a product code (SKU).";
    if (form.price === "" || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      return "Please enter a valid product price.";
    }
    if (form.stock === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      return "Please enter a valid whole-number stock quantity.";
    }
    if (
      form.minimumStock === "" ||
      !Number.isInteger(Number(form.minimumStock)) ||
      Number(form.minimumStock) < 0
    ) {
      return "Please enter a valid minimum stock quantity.";
    }
    if (!form.unit) return "Please select a unit of measure.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    let uploadedImages = [];

    try {
      uploadedImages = await uploadImages();

      const stock = Number(form.stock);
      const price = Number(form.price);
      const imageUrls = uploadedImages.map((item) => item.url);
      const descriptionParts = [
        form.description.trim() || null,
        form.size.trim() ? `Size: ${form.size.trim()}` : null,
        form.origin.trim() ? `Origin: ${form.origin.trim()}` : null,
        form.brand.trim() ? `Brand: ${form.brand.trim()}` : null,
        form.materialGrade.trim() ? `Grade: ${form.materialGrade.trim()}` : null,
        form.manufacturer.trim() ? `Manufacturer: ${form.manufacturer.trim()}` : null,
        form.unit ? `Unit: ${form.unit}` : null,
        form.subCategory ? `Sub category: ${form.subCategory}` : null,
      ].filter(Boolean);

      const productData = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        product_type: form.productType,
        category: form.category.trim(),
        sub_category: form.subCategory || null,
        description: descriptionParts.join(" | ") || null,
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
        price,
        stock,
        stock_quantity: stock,
        minimum_stock: Number(form.minimumStock),
        unit: form.unit,
        price_per_sqft: isMarble && form.unit === "Sq.Ft" ? price : null,
        status: form.isAvailable ? (stock > 0 ? "available" : "out_of_stock") : "hidden",
        is_available: form.isAvailable,
        color: isMarble ? form.color || null : null,
        finish: isMarble ? form.finish || null : null,
        thickness: isMarble ? form.thickness || null : null,
      };

      const { data, error: insertError } = await supabase
        .from("marbles")
        .insert([productData])
        .select("id, name, category, price, stock, sku, product_type")
        .single();

      if (insertError) {
        if (uploadedImages.length) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(uploadedImages.map((item) => item.path));
        }
        throw insertError;
      }

      setSuccessProduct(data);
    } catch (err) {
      console.error("Add product error:", err);
      setError(
        `${err.message || "Unable to save the product."}${err.code ? ` (Code: ${err.code})` : ""}`
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    clearImages();
    setForm({
      ...EMPTY_FORM,
      sku: makeSku(form.productType),
      productType: form.productType,
      unit: form.productType === "marble" ? "Sq.Ft" : "Bag",
    });
    setError("");
    setSuccessProduct(null);
  };

  return (
    <div className="ark-add-product-page">
      <div className="ark-add-product-heading">
        <div>
          <span className="ark-add-eyebrow">ARK MARBLES / INVENTORY</span>
          <h1>{isMarble ? "Manage Marbles" : "Manage Construction Items"}</h1>
          <p>
            {isMarble
              ? "Add, update and manage marble products, pricing and availability."
              : "Add, update and manage construction materials, pricing and stock availability."}
          </p>
        </div>

        <div className="ark-product-mode-switch" role="group" aria-label="Product type">
          <button
            type="button"
            className={isMarble ? "active" : ""}
            onClick={() => changeProductType("marble")}
          >
            <Gem size={18} /> Marbles
          </button>
          <button
            type="button"
            className={!isMarble ? "active" : ""}
            onClick={() => changeProductType("construction")}
          >
            <HardHat size={18} /> Construction
          </button>
        </div>
      </div>

      {error && (
        <div className="ark-add-product-error" role="alert">
          <X size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      <form className="ark-add-product-layout" onSubmit={handleSubmit}>
        <section className="ark-add-form-card">
          <div className="ark-add-form-card-heading">
            <div className="ark-add-heading-icon">
              {isMarble ? <Gem size={30} /> : <HardHat size={30} />}
            </div>
            <div>
              <h2>{isMarble ? "Add New Marble" : "Add Construction Item"}</h2>
              <p>
                {isMarble
                  ? "Create a new marble product in your inventory"
                  : "Create a new construction material in your inventory"}
              </p>
            </div>
          </div>

          <div className="ark-add-fields-wrap">
            <div className="ark-add-field-grid two-columns">
              <div className="ark-add-field">
                <label htmlFor="productName">
                  {isMarble ? "Marble Name" : "Material Name"} <b>*</b>
                </label>
                <input
                  id="productName"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder={isMarble ? "Enter marble name" : "Enter construction material name"}
                  required
                />
              </div>

              <div className="ark-add-field">
                <label htmlFor="productSku">Product Code (SKU) <b>*</b></label>
                <input
                  id="productSku"
                  name="sku"
                  value={form.sku}
                  onChange={updateField}
                  placeholder={isMarble ? "ARK-MB-000001" : "ARK-CM-000001"}
                  required
                />
              </div>

              <div className="ark-add-field">
                <label htmlFor="productCategory">Category <b>*</b></label>
                <select
                  id="productCategory"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="ark-add-field">
                <label htmlFor="productSubCategory">Sub Category</label>
                <select
                  id="productSubCategory"
                  name="subCategory"
                  value={form.subCategory}
                  onChange={updateField}
                >
                  <option value="">Select Sub Category</option>
                  {subCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ark-add-field-grid three-columns">
              <div className="ark-add-field">
                <label htmlFor="productPrice">
                  {isMarble ? "Price per Sq.ft (₹)" : "Price per Unit (₹)"} <b>*</b>
                </label>
                <input
                  id="productPrice"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="ark-add-field">
                <label htmlFor="productStock">Stock Quantity <b>*</b></label>
                <input
                  id="productStock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={updateField}
                  placeholder="0"
                  required
                />
              </div>

              <div className="ark-add-field">
                <label htmlFor="minimumStock">Minimum Stock</label>
                <input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.minimumStock}
                  onChange={updateField}
                  placeholder="10"
                />
              </div>
            </div>

            {isMarble ? (
              <div className="ark-add-field-grid three-columns">
                <div className="ark-add-field">
                  <label htmlFor="productThickness">Thickness</label>
                  <select id="productThickness" name="thickness" value={form.thickness} onChange={updateField}>
                    <option value="">Select Thickness</option>
                    {["12 mm", "15 mm", "18 mm", "20 mm", "Other"].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="ark-add-field">
                  <label htmlFor="productFinish">Finish</label>
                  <select id="productFinish" name="finish" value={form.finish} onChange={updateField}>
                    <option value="">Select Finish</option>
                    {["Polished", "Honed", "Matt", "Leather", "Glossy", "Brushed"].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="ark-add-field">
                  <label htmlFor="productColor">Color</label>
                  <select id="productColor" name="color" value={form.color} onChange={updateField}>
                    <option value="">Select Color</option>
                    {["White", "Black", "Grey", "Beige", "Brown", "Green", "Blue", "Multicolor"].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="ark-add-field-grid three-columns">
                <div className="ark-add-field">
                  <label htmlFor="productUnit">Unit of Measure <b>*</b></label>
                  <select id="productUnit" name="unit" value={form.unit} onChange={updateField}>
                    {UNITS.filter((unit) => unit !== "Sq.M").map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="ark-add-field">
                  <label htmlFor="productBrand">Brand</label>
                  <input id="productBrand" name="brand" value={form.brand} onChange={updateField} placeholder="e.g. UltraTech" />
                </div>
                <div className="ark-add-field">
                  <label htmlFor="productGrade">Material Grade</label>
                  <input id="productGrade" name="materialGrade" value={form.materialGrade} onChange={updateField} placeholder="e.g. 53 Grade / Fe 550" />
                </div>
              </div>
            )}

            {isMarble ? (
              <div className="ark-add-field-grid two-columns">
                <div className="ark-add-field">
                  <label htmlFor="productSize">Available Size</label>
                  <input id="productSize" name="size" value={form.size} onChange={updateField} placeholder="e.g. 9 ft × 6 ft / Custom size" />
                </div>
                <div className="ark-add-field">
                  <label htmlFor="productOrigin">Origin</label>
                  <input id="productOrigin" name="origin" value={form.origin} onChange={updateField} placeholder="e.g. Italy, India, Turkey" />
                </div>
              </div>
            ) : (
              <div className="ark-add-field-grid two-columns">
                <div className="ark-add-field">
                  <label htmlFor="productSize">Size / Weight</label>
                  <input id="productSize" name="size" value={form.size} onChange={updateField} placeholder="e.g. 50 kg, 12 mm, 6 metre" />
                </div>
                <div className="ark-add-field">
                  <label htmlFor="productManufacturer">Manufacturer</label>
                  <input id="productManufacturer" name="manufacturer" value={form.manufacturer} onChange={updateField} placeholder="Enter manufacturer name" />
                </div>
              </div>
            )}

            <div className="ark-add-field ark-add-description">
              <label htmlFor="productDescription">Description</label>
              <textarea
                id="productDescription"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Enter product description..."
                rows={3}
              />
            </div>

            <div className="ark-add-product-images">
              <div className="ark-add-image-label-row">
                <label>Product Images (Max 5)</label>
                <span>{imageFiles.length}/5 images selected</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                hidden
                onChange={(event) => {
                  addImages(event.target.files);
                  event.target.value = "";
                }}
              />

              <div className="ark-add-image-strip">
                <button
                  type="button"
                  className="ark-add-upload-tile"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    addImages(event.dataTransfer.files);
                  }}
                  disabled={imageFiles.length >= MAX_IMAGES}
                >
                  <CloudUpload size={39} />
                  <strong>Click to upload images</strong>
                  <small>PNG, JPG, WebP (Max 10 MB each)</small>
                </button>

                {imagePreviews.map((preview, index) => (
                  <div className={`ark-add-thumb ${activeImage === index ? "selected" : ""}`} key={preview}>
                    <button type="button" className="ark-add-thumb-preview" onClick={() => setActiveImage(index)}>
                      <img src={preview} alt={`Product preview ${index + 1}`} />
                    </button>
                    <button
                      type="button"
                      className="ark-add-thumb-remove"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

                {imageFiles.length < MAX_IMAGES && (
                  <button
                    type="button"
                    className="ark-add-more-tile"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={34} />
                    <span>Add More</span>
                  </button>
                )}
              </div>
            </div>

            <label className="ark-add-availability">
              <input
                type="checkbox"
                name="isAvailable"
                checked={form.isAvailable}
                onChange={updateField}
              />
              <span className="ark-add-checkmark"><CheckCircle2 size={19} /></span>
              <span>
                <strong>{form.isAvailable ? "Active Product" : "Inactive Product"}</strong>
                <small>
                  {form.isAvailable
                    ? "Product can be displayed in the store and inventory."
                    : "Product will be hidden from customer-facing listings."}
                </small>
              </span>
            </label>

            <div className="ark-add-form-actions">
              <button className="ark-add-save-btn" type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="ark-add-spin" size={20} /> : <Save size={20} />}
                {saving ? "Saving Product..." : `Save ${isMarble ? "Marble" : "Construction Item"}`}
              </button>
              <button className="ark-add-reset-btn" type="button" onClick={resetForm} disabled={saving}>
                <RefreshCw size={19} /> Reset Form
              </button>
            </div>
          </div>
        </section>

        <aside className="ark-add-side-column">
          <section className="ark-add-gallery-card">
            <div className="ark-add-gallery-main">
              {heroImage ? (
                <img src={heroImage} alt="Selected product" />
              ) : (
                <div className="ark-add-gallery-placeholder">
                  {isMarble ? <Gem size={72} /> : <Package size={72} />}
                  <strong>{isMarble ? "Marble Product Preview" : "Construction Product Preview"}</strong>
                  <span>Upload product images to preview them here</span>
                </div>
              )}

              {imagePreviews.length > 1 && (
                <>
                  <button
                    type="button"
                    className="ark-add-gallery-arrow previous"
                    onClick={() => setActiveImage((activeImage - 1 + imagePreviews.length) % imagePreviews.length)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={25} />
                  </button>
                  <button
                    type="button"
                    className="ark-add-gallery-arrow next"
                    onClick={() => setActiveImage((activeImage + 1) % imagePreviews.length)}
                    aria-label="Next image"
                  >
                    <ChevronRight size={25} />
                  </button>
                </>
              )}
            </div>

            <div className="ark-add-gallery-dots">
              {(imagePreviews.length ? imagePreviews : Array.from({ length: 5 })).map((_, index) => (
                <button
                  type="button"
                  key={index}
                  className={activeImage === index && imagePreviews.length ? "active" : ""}
                  onClick={() => imagePreviews.length && setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  disabled={!imagePreviews.length}
                />
              ))}
            </div>
          </section>

          <section className="ark-add-info-card">
            <div className="ark-add-info-heading">
              <Info size={29} />
              <h2>{isMarble ? "Marble Information" : "Construction Information"}</h2>
            </div>
            <div className="ark-add-info-rows">
              {infoRows.map(([label, value]) => (
                <div className="ark-add-info-row" key={label}>
                  <span>{label}</span>
                  <b>:</b>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="ark-add-side-note">
            <CircleHelp size={19} />
            <p>
              {isMarble
                ? "Add clear images from different angles. Include the correct thickness, finish and origin to help customers compare marble slabs."
                : "Enter the correct selling unit, brand and material grade. Stock quantity is tracked using the selected unit."}
            </p>
          </section>
        </aside>
      </form>

      {successProduct && (
        <div className="ark-add-success-overlay">
          <section className="ark-add-success-modal" role="dialog" aria-modal="true">
            <div className="ark-add-success-icon"><CheckCircle2 size={48} /></div>
            <h2>Product Added Successfully!</h2>
            <p>
              <strong>{successProduct.name}</strong> has been added to your inventory.
            </p>
            <div className="ark-add-success-summary">
              <span>SKU <b>{successProduct.sku || form.sku}</b></span>
              <span>Price <b>₹{formatINR(successProduct.price)}</b></span>
              <span>Stock <b>{successProduct.stock}</b></span>
            </div>
            <div className="ark-add-success-actions">
              <button type="button" onClick={() => navigate("/admin/inventory")}>View Inventory</button>
              <button type="button" onClick={resetForm}>Add Another Product</button>
            </div>
            <button type="button" className="ark-add-success-close" onClick={() => setSuccessProduct(null)} aria-label="Close">
              <X size={21} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
