import React from "react";
import {
  X,
  Layers3,
  Package,
  ShieldCheck,
  FileText,
  ExternalLink,
  Pencil,
  Box,
} from "lucide-react";
import "./CategoryDetailsModal.css";

export default function CategoryDetailsModal({
  category,
  productCount = 0,
  onClose,
  onEdit,
}) {
  if (!category) return null;

  const imageUrl = category.image_url || "";

  const isActive = category.is_active !== false;

  return (
    <div className="blue-modal-overlay" onClick={onClose}>
      <div
        className="blue-category-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="blue-modal-header">
          <div className="blue-modal-heading">
            <Layers3 size={22} />
            <span>Category Details</span>
          </div>

          <button
            className="blue-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        {/* Title */}
        <div className="blue-modal-title-section">
          <h2>{category.name}</h2>
          <p>
            {category.description ||
              "Explore our premium marble and stone collection."}
          </p>
        </div>

        {/* Image */}
        <div className="blue-modal-image-wrapper">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={category.name}
              className="blue-modal-image"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className="blue-modal-image-fallback"
            style={{ display: imageUrl ? "none" : "flex" }}
          >
            <Box size={42} />
            <span>No category image available</span>
          </div>
        </div>

        {/* Information cards */}
        <div className="blue-modal-info-grid">
          <div className="blue-info-card">
            <Box size={23} />
            <span>Category ID</span>
            <strong title={category.id}>
              {category.id
                ? `${String(category.id).slice(0, 12)}...`
                : "N/A"}
            </strong>
          </div>

          <div className="blue-info-card">
            <Package size={23} />
            <span>Products</span>
            <strong>{productCount}</strong>
          </div>

          <div className="blue-info-card">
            <ShieldCheck size={23} />
            <span>Status</span>
            <strong className={isActive ? "blue-active" : "blue-inactive"}>
              {isActive ? "Active" : "Inactive"}
            </strong>
          </div>
        </div>

        {/* Description */}
        <div className="blue-modal-description">
          <div className="blue-description-heading">
            <FileText size={20} />
            <span>Description</span>
          </div>

          <p>
            {category.description || "No description added."}
          </p>
        </div>

        {/* Open image */}
        {imageUrl && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="blue-open-image"
          >
            Open Image <ExternalLink size={15} />
          </a>
        )}

        {/* Footer */}
        <div className="blue-modal-footer">
          <button
            className="blue-close-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="blue-edit-button"
            onClick={() => onEdit(category)}
          >
            <Pencil size={16} />
            Edit Category
          </button>
        </div>
      </div>
    </div>
  );
}