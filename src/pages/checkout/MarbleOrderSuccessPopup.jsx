import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { X, ShoppingBag } from "lucide-react";
import "./MarbleOrderSuccessPopup.css";

export default function MarbleOrderSuccessPopup({
  isOpen,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const colors = [
      "#00c987",
      "#10b981",
      "#34d399",
      "#d7a83e",
      "#f4d47e",
      "#ffffff",
    ];

    let interval;
    let closeTimer;

    // Main celebration
    confetti({
      particleCount: 130,
      spread: 110,
      startVelocity: 45,
      gravity: 0.9,
      ticks: 220,
      scalar: 1.1,
      colors,
      zIndex: 1000001,
      origin: { x: 0.5, y: 0.55 },
    });

    // Left-side celebration
    confetti({
      particleCount: 65,
      angle: 60,
      spread: 80,
      startVelocity: 45,
      colors,
      zIndex: 1000001,
      origin: { x: 0.08, y: 0.65 },
    });

    // Right-side celebration
    confetti({
      particleCount: 65,
      angle: 120,
      spread: 80,
      startVelocity: 45,
      colors,
      zIndex: 1000001,
      origin: { x: 0.92, y: 0.65 },
    });

    // Smaller continuing confetti
    const endTime = Date.now() + 3000;

    interval = window.setInterval(() => {
      if (Date.now() >= endTime) {
        window.clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 8,
        spread: 80,
        startVelocity: 25,
        ticks: 150,
        colors,
        zIndex: 1000001,
        origin: {
          x: Math.random(),
          y: 0.55,
        },
      });
    }, 180);

    // Automatically close after 5 seconds
    closeTimer = window.setTimeout(() => {
      onClose?.();
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(closeTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ark-success-overlay">

      <button
        className="ark-success-backdrop"
        type="button"
        aria-label="Close popup"
        onClick={onClose}
      />

      <section
        className="ark-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ark-success-title"
      >

        {/* Close button */}
        <button
          className="ark-success-close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={21} />
        </button>

        {/* Marble decoration */}
        <div className="ark-marble-decoration">
          <div className="ark-marble-wave ark-marble-wave-left" />
          <div className="ark-marble-wave ark-marble-wave-right" />
        </div>

        <div className="ark-success-content">

          {/* Original green tick */}
          <div className="ark-success-emblem">
            <div className="ark-success-tick-circle">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  className="ark-success-tick-path"
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Brand */}
          <div className="ark-success-brand">
            ARK MARBLES
          </div>

          {/* Gold divider */}
          <div className="ark-success-divider">
            <span />
            <i>◆</i>
            <span />
          </div>

          {/* Success badge */}
          <div className="ark-success-label">
            <span />
            ORDER PLACED SUCCESSFULLY
          </div>

          {/* Main message */}
          <h1 id="ark-success-title">
            Thank You for Your
            <span> Order!</span>
          </h1>

          <p className="ark-success-message">
            Thank you for choosing ARK MARBLES.
            <br />
            Your order has been placed successfully.
          </p>

          {/* Decorative stone icon */}
          <div className="ark-success-stone-icon">
            <svg
              viewBox="0 0 100 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 39L29 12L43 29L57 7L91 39H8Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M29 12L34 39M57 7L64 39M43 29L49 39"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Tagline */}
          <div className="ark-success-tagline">
            PREMIUM STONE COLLECTIONS
          </div>

        </div>

        {/* Footer */}
        <div className="ark-success-footer">

          <div className="ark-success-auto-close">
            <ShoppingBag size={23} />
            <span>
              Thank you! Closing automatically...
            </span>
          </div>

          <button
            type="button"
            className="ark-success-continue"
            onClick={onClose}
          >
            Continue Shopping
            <span>→</span>
          </button>

        </div>

      </section>
    </div>
  );
}