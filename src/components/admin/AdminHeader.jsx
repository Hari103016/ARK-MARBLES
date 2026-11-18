
import React from "react";
import { Bell, Search, UserRound } from "lucide-react";

export default function AdminHeader() {
  const iconButtonStyle = {
    width: "42px",
    height: "42px",
    border: "1px solid #806126",
    borderRadius: "9px",
    background: "#111719",
    color: "#e8c16f",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  };

  return (
    <header
      style={{
        minHeight: "82px",
        padding: "14px 28px",
        background: "#080b0d",
        borderBottom: "1px solid #806126",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap",
        boxSizing: "border-box",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "#e9bd63",
            fontFamily: "Georgia, serif",
            fontSize: "27px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          ARK MARBLES
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: "#c2b8a7",
            fontSize: "13px",
          }}
        >
          Complete Control of Marbles, Construction & Operations
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          type="button"
          aria-label="Search"
          style={iconButtonStyle}
          onClick={() => {
            document.querySelector("input:not([type='hidden'])")?.focus();
          }}
        >
          <Search size={21} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          style={iconButtonStyle}
          onClick={() => window.alert("You have no new notifications.")}
        >
          <Bell size={21} />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#f4ead8",
          }}
        >
          <span
            style={{
              width: "42px",
              height: "42px",
              display: "grid",
              placeItems: "center",
              color: "#211708",
              background: "linear-gradient(135deg, #f7d98a, #bd872e)",
              borderRadius: "50%",
            }}
          >
            <UserRound size={22} />
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <strong style={{ fontSize: "14px" }}>Admin</strong>
            <small style={{ color: "#bdb3a2", fontSize: "12px" }}>
              Administrator
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}
