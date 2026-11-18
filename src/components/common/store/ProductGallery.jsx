import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export default function ProductGallery({
  images = [],
  productName = "Marble",
}) {
  const validImages = images.filter(
    (image) => typeof image === "string" && image.trim() !== ""
  );

  const galleryImages = validImages.length
    ? validImages
    : ["/images/hero-marble.jpg"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeImage = galleryImages[activeIndex];

  const showPrevious = () => {
    setActiveIndex((index) =>
      index === 0 ? galleryImages.length - 1 : index - 1
    );
    setIsZoomed(false);
  };

  const showNext = () => {
    setActiveIndex((index) =>
      index === galleryImages.length - 1 ? 0 : index + 1
    );
    setIsZoomed(false);
  };

  return (
    <section className="product-gallery" aria-label={`${productName} images`}>
      <div className="product-gallery-main">
        <img
          src={activeImage}
          alt={`${productName} - image ${activeIndex + 1}`}
          className={`product-gallery-image${isZoomed ? " is-zoomed" : ""}`}
          onClick={() => setIsZoomed((zoomed) => !zoomed)}
        />

        <button
          type="button"
          className="product-gallery-zoom"
          onClick={() => setIsZoomed((zoomed) => !zoomed)}
          aria-label={isZoomed ? "Zoom out" : "Zoom in"}
        >
          <Maximize2 size={18} />
        </button>

        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              className="product-gallery-arrow product-gallery-previous"
              onClick={showPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              className="product-gallery-arrow product-gallery-next"
              onClick={showNext}
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <span className="product-gallery-counter">
          {activeIndex + 1} / {galleryImages.length}
        </span>
      </div>

      {galleryImages.length > 1 && (
        <div className="product-gallery-thumbnails">
          {galleryImages.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              className={`product-gallery-thumbnail${
                index === activeIndex ? " is-active" : ""
              }`}
              onClick={() => {
                setActiveIndex(index);
                setIsZoomed(false);
              }}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}