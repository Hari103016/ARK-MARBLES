import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  History,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./InventoryMovements.css";

const MOVEMENT_TYPES = ["Stock In", "Stock Out", "Adjustment"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const EMPTY_FORM = {
  marbleId: "",
  type: "Stock In",
  quantity: "",
  adjustmentDirection: "increase",
  reference: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

function formatDate(value, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const dateText = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (!includeTime) return dateText;

  return `${dateText} · ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function movementLabel(type) {
  if (type === "stock_in" || type === "Stock In") return "Inward";
  if (type === "stock_out" || type === "Stock Out") return "Outward";
  return "Adjustment";
}

function movementClass(type) {
  const label = movementLabel(type);
  if (label === "Inward") return "movement-in";
  if (label === "Outward") return "movement-out";
  return "movement-adjustment";
}

function movementIcon(type) {
  const label = movementLabel(type);
  if (label === "Inward") return ArrowDownToLine;
  if (label === "Outward") return ArrowUpFromLine;
  return ArrowLeftRight;
}

function mapMovement(row) {
  const rawType = row.movement_type;
  const signedQuantity = Number(row.quantity || 0);
  const type =
    rawType === "stock_in"
      ? "Stock In"
      : rawType === "stock_out"
        ? "Stock Out"
        : "Adjustment";

  return {
    id: row.id,
    productId: row.marble_id,
    productName: row.marbles?.name || `Product #${row.marble_id}`,
    category: row.marbles?.category || "—",
    type,
    quantity: Math.abs(signedQuantity),
    signedQuantity,
    previousStock: Number(row.previous_stock || 0),
    newStock: Number(row.new_stock || 0),
    reference: row.reference || "",
    date: row.movement_date || row.created_at,
    notes: String(row.remarks || "").replace(/^REDUCE:/, ""),
    createdAt: row.created_at,
  };
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportMovementsCsv(rows) {
  if (!rows.length) {
    window.alert("There are no stock movements to export.");
    return;
  }

  const headers = [
    "Movement ID",
    "Date",
    "Product",
    "Category",
    "Movement Type",
    "Quantity",
    "Previous Stock",
    "New Stock",
    "Reference",
    "Notes",
  ];

  const data = rows.map((row) => [
    row.id,
    row.date,
    row.productName,
    row.category,
    row.type,
    row.signedQuantity,
    row.previousStock,
    row.newStock,
    row.reference,
    row.notes,
  ]);

  const csv = [
    headers.map(csvCell).join(","),
    ...data.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ark-marbles-stock-movements.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function InventoryMovements() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [showForm, setShowForm] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    date: new Date().toISOString().slice(0, 10),
  });

  const showMessage = useCallback((message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [productResult, movementResult] = await Promise.all([
        supabase
          .from("marbles")
          .select("id, name, category, stock, stock_quantity, status, is_available")
          .order("name", { ascending: true }),
        supabase
          .from("inventory_movements")
          .select(`
            id,
            marble_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reference,
            remarks,
            movement_date,
            created_at,
            marbles ( id, name, category )
          `)
          .order("created_at", { ascending: false }),
      ]);

      if (productResult.error) throw productResult.error;
      if (movementResult.error) throw movementResult.error;

      setProducts(productResult.data || []);
      setMovements((movementResult.data || []).map(mapMovement));
    } catch (error) {
      console.error("Inventory movements load error:", error);
      showMessage(
        error.message || "Could not load stock movements from Supabase.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const searchable = [
        movement.id,
        movement.productName,
        movement.category,
        movement.reference,
        movement.notes,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesType =
        typeFilter === "All" || movement.type === typeFilter;
      const movementDate = String(movement.date || "").slice(0, 10);
      const matchesStart = !startDate || movementDate >= startDate;
      const matchesEnd = !endDate || movementDate <= endDate;

      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });
  }, [movements, search, typeFilter, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, startDate, endDate, pageSize]);

  const totalIn = movements
    .filter((item) => item.type === "Stock In")
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalOut = movements
    .filter((item) => item.type === "Stock Out")
    .reduce((sum, item) => sum + item.quantity, 0);

  const adjustmentCount = movements.filter(
    (item) => item.type === "Adjustment"
  ).length;

  const currentStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock ?? product.stock_quantity ?? 0),
    0
  );

  const pageCount = Math.max(1, Math.ceil(filteredMovements.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleMovements = filteredMovements.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openAddForm = () => {
    setForm({
      ...EMPTY_FORM,
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setForm({
      ...EMPTY_FORM,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  async function handleSubmit(event) {
    event.preventDefault();

    const quantity = Number(form.quantity);

    if (!form.marbleId) {
      showMessage("Please select a product from your inventory.", "error");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      showMessage("Enter a whole-number quantity greater than zero.", "error");
      return;
    }

    if (!form.date) {
      showMessage("Please select the movement date.", "error");
      return;
    }

    const movementType =
      form.type === "Stock In"
        ? "stock_in"
        : form.type === "Stock Out"
          ? "stock_out"
          : "adjustment";

    let remarks = form.notes.trim();

    if (
      form.type === "Adjustment" &&
      form.adjustmentDirection === "decrease"
    ) {
      remarks = `REDUCE:${remarks}`;
    }

    setSaving(true);

    try {
      const { error } = await supabase.rpc("record_inventory_movement", {
        p_marble_id: Number(form.marbleId),
        p_movement_type: movementType,
        p_quantity: quantity,
        p_reference: form.reference.trim() || null,
        p_remarks: remarks || null,
        p_movement_date: form.date,
      });

      if (error) throw error;

      setShowForm(false);
      setForm({
        ...EMPTY_FORM,
        date: new Date().toISOString().slice(0, 10),
      });

      await loadData();
      showMessage("Stock movement recorded and inventory updated.");
    } catch (error) {
      console.error("Stock movement save error:", error);
      showMessage(
        error.message || "Could not record this stock movement.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <main className="ark-movements-page">
      <div className="ark-movements-content">
        <header className="ark-movements-titlebar">
          <div className="ark-movements-titlegroup">
            <div className="ark-movements-title-icon">
              <Boxes size={30} />
            </div>
            <div>
              <p className="ark-movements-eyebrow">ARK MARBLES / INVENTORY</p>
              <h1>Stock Movements</h1>
              <p>History of all stock inward, outward and adjustment activities.</p>
            </div>
          </div>

          <div className="ark-movements-toolbar">
            <button
              type="button"
              className="ark-movement-btn primary"
              onClick={openAddForm}
            >
              <Plus size={19} /> Add Movement
            </button>
            <button
              type="button"
              className="ark-movement-btn secondary"
              onClick={() => {
                const input = document.getElementById("movement-import-file");
                input?.click();
              }}
            >
              <ArrowUpFromLine size={18} /> Import
            </button>
            <input
              id="movement-import-file"
              className="ark-movement-hidden-input"
              type="file"
              accept=".csv"
              onChange={() =>
                showMessage(
                  "CSV import is not connected yet. Use Export to download movement history.",
                  "error"
                )
              }
            />
            <button
              type="button"
              className="ark-movement-btn secondary"
              onClick={() => exportMovementsCsv(filteredMovements)}
            >
              <Download size={18} /> Export
            </button>
          </div>
        </header>

        {notice && (
          <div className={`ark-movements-notice ${noticeType}`} role="status">
            {noticeType === "error" ? (
              <AlertCircle size={19} />
            ) : (
              <CheckCircle2 size={19} />
            )}
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="ark-movements-stats">
          <article className="ark-movement-stat">
            <div className="stat-icon green"><ArrowDownToLine size={31} /></div>
            <div className="stat-copy">
              <span>Total Inward</span>
              <strong>{totalIn.toLocaleString("en-IN")}</strong>
              <small>Units added to stock</small>
            </div>
          </article>

          <article className="ark-movement-stat">
            <div className="stat-icon red"><ArrowUpFromLine size={31} /></div>
            <div className="stat-copy">
              <span>Total Outward</span>
              <strong>{totalOut.toLocaleString("en-IN")}</strong>
              <small>Units removed from stock</small>
            </div>
          </article>

          <article className="ark-movement-stat">
            <div className="stat-icon gold"><ArrowLeftRight size={31} /></div>
            <div className="stat-copy">
              <span>Adjustments</span>
              <strong>{adjustmentCount.toLocaleString("en-IN")}</strong>
              <small>Stock adjustment records</small>
            </div>
          </article>

          <article className="ark-movement-stat">
            <div className="stat-icon blue"><Package size={31} /></div>
            <div className="stat-copy">
              <span>Current Stock</span>
              <strong>{currentStock.toLocaleString("en-IN")}</strong>
              <small>Total available inventory</small>
            </div>
          </article>
        </section>

        <section className="ark-movements-workspace">
          <aside className="ark-movements-filter-panel">
            <div className="ark-movements-panel-heading">
              <Filter size={29} />
              <div>
                <h2>Filter Movements</h2>
                <p>Search and filter stock records</p>
              </div>
            </div>

            <div className="ark-movements-filter-fields">
              <label>
                <span>Search Product</span>
                <div className="ark-movement-input with-icon">
                  <Search size={19} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Product name, SKU or reference..."
                  />
                </div>
              </label>

              <label>
                <span>Movement Type</span>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="All">All Movement Types</option>
                  {MOVEMENT_TYPES.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>From Date</span>
                <div className="ark-movement-input with-icon">
                  <CalendarDays size={18} />
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
              </label>

              <label>
                <span>To Date</span>
                <div className="ark-movement-input with-icon">
                  <CalendarDays size={18} />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="ark-movements-filter-actions">
              <button
                type="button"
                className="ark-movement-btn primary"
                onClick={() => setPage(1)}
              >
                <Filter size={17} /> Apply Filters
              </button>
              <button
                type="button"
                className="ark-movement-btn secondary"
                onClick={resetFilters}
              >
                <RefreshCw size={17} /> Reset
              </button>
            </div>
          </aside>

          <section className="ark-movements-history-panel">
            <div className="ark-movements-history-heading">
              <div className="history-heading-icon">
                <History size={31} />
              </div>
              <div>
                <h2>Stock Movements History</h2>
                <p>
                  Detailed list of all inventory stock movements (
                  {filteredMovements.length.toLocaleString("en-IN")} records)
                </p>
              </div>
              <button
                type="button"
                className="ark-movements-refresh"
                onClick={loadData}
                disabled={loading}
                title="Refresh stock movements"
              >
                {loading ? (
                  <LoaderCircle className="ark-spin" size={19} />
                ) : (
                  <RefreshCw size={19} />
                )}
              </button>
            </div>

            <div className="ark-movements-table-wrap">
              <table className="ark-movements-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date &amp; Time</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Previous Stock</th>
                    <th>New Stock</th>
                    <th>Reference</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMovements.map((movement, index) => {
                    const Icon = movementIcon(movement.type);
                    const label = movementLabel(movement.type);

                    return (
                      <tr key={movement.id}>
                        <td className="row-number">
                          {(safePage - 1) * pageSize + index + 1}
                        </td>
                        <td className="date-cell">
                          <strong>{formatDate(movement.date)}</strong>
                          <small>
                            {movement.date
                              ? new Date(movement.date).toLocaleTimeString(
                                  "en-IN",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "—"}
                          </small>
                        </td>
                        <td>
                          <div className="movement-product">
                            <div className="movement-product-thumb">
                              <Package size={22} />
                            </div>
                            <div>
                              <strong>{movement.productName}</strong>
                              <small>{movement.category}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`movement-badge ${movementClass(movement.type)}`}>
                            <Icon size={16} /> {label}
                          </span>
                        </td>
                        <td className="quantity-cell">
                          {movement.signedQuantity > 0 ? "+" : ""}
                          {movement.signedQuantity.toLocaleString("en-IN")}
                        </td>
                        <td>{movement.previousStock.toLocaleString("en-IN")}</td>
                        <td className="new-stock-cell">
                          {movement.newStock.toLocaleString("en-IN")}
                        </td>
                        <td>{movement.reference || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="movement-view-btn"
                            title="View movement details"
                            onClick={() => setSelectedMovement(movement)}
                          >
                            <Eye size={19} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loading && (
                <div className="ark-movements-empty">
                  <LoaderCircle className="ark-spin" size={28} />
                  <strong>Loading stock movements...</strong>
                </div>
              )}

              {!loading && filteredMovements.length === 0 && (
                <div className="ark-movements-empty">
                  <History size={34} />
                  <strong>No stock movements found</strong>
                  <p>
                    {movements.length === 0
                      ? "Record your first stock movement to see it here."
                      : "Try changing your search or filters."}
                  </p>
                  {movements.length === 0 ? (
                    <button
                      type="button"
                      className="ark-movement-btn primary"
                      onClick={openAddForm}
                    >
                      <Plus size={17} /> Add Movement
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ark-movement-btn secondary"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <footer className="ark-movements-pagination">
              <span>
                Showing{" "}
                {filteredMovements.length === 0
                  ? 0
                  : (safePage - 1) * pageSize + 1}
                {"–"}
                {Math.min(safePage * pageSize, filteredMovements.length)} of{" "}
                {filteredMovements.length.toLocaleString("en-IN")} movements
              </span>

              <div className="pagination-controls">
                <label>
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span className="page-number">
                  {safePage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </footer>
          </section>
        </section>
      </div>

      {showForm && (
        <div
          className="ark-movement-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="ark-movement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-stock-movement-title"
          >
            <header className="ark-movement-modal-header">
              <div>
                <p>INVENTORY MANAGEMENT</p>
                <h2 id="add-stock-movement-title">Add Stock Movement</h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="ark-movement-modal-body">
                <div className="movement-form-grid">
                  <label className="span-two">
                    <span>Select Product *</span>
                    <select
                      value={form.marbleId}
                      onChange={(event) =>
                        updateForm("marbleId", event.target.value)
                      }
                      required
                    >
                      <option value="">Choose a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} — Stock:{" "}
                          {Number(
                            product.stock ?? product.stock_quantity ?? 0
                          ).toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Movement Type *</span>
                    <select
                      value={form.type}
                      onChange={(event) => updateForm("type", event.target.value)}
                    >
                      {MOVEMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Quantity *</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.quantity}
                      onChange={(event) =>
                        updateForm("quantity", event.target.value)
                      }
                      placeholder="Enter quantity"
                      required
                    />
                  </label>

                  {form.type === "Adjustment" && (
                    <label>
                      <span>Adjustment Direction *</span>
                      <select
                        value={form.adjustmentDirection}
                        onChange={(event) =>
                          updateForm("adjustmentDirection", event.target.value)
                        }
                      >
                        <option value="increase">Increase stock</option>
                        <option value="decrease">Decrease stock</option>
                      </select>
                    </label>
                  )}

                  <label>
                    <span>Movement Date *</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => updateForm("date", event.target.value)}
                      required
                    />
                  </label>

                  <label className="span-two">
                    <span>Reference Number</span>
                    <input
                      type="text"
                      value={form.reference}
                      onChange={(event) =>
                        updateForm("reference", event.target.value)
                      }
                      placeholder="Purchase order / Sales order / Invoice"
                    />
                  </label>

                  <label className="span-two">
                    <span>Notes</span>
                    <textarea
                      rows="3"
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      placeholder="Add reason or additional details..."
                    />
                  </label>
                </div>

                <div className="movement-form-hint">
                  <AlertCircle size={18} />
                  {form.type === "Stock In"
                    ? "This quantity will be added to the selected product's current stock."
                    : form.type === "Stock Out"
                      ? "This quantity will be deducted. Stock cannot become negative."
                      : "Choose whether this adjustment increases or decreases current stock."}
                </div>
              </div>

              <footer className="ark-movement-modal-footer">
                <button
                  type="button"
                  className="ark-movement-btn secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ark-movement-btn primary"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle className="ark-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {saving ? "Saving..." : "Record Movement"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedMovement && (
        <div
          className="ark-movement-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMovement(null);
          }}
        >
          <section
            className="ark-movement-modal movement-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movement-detail-title"
          >
            <header className="ark-movement-modal-header">
              <div>
                <p>STOCK MOVEMENT DETAILS</p>
                <h2 id="movement-detail-title">
                  Movement #{String(selectedMovement.id).slice(0, 8)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </header>

            <div className="ark-movement-modal-body">
              <div className="movement-detail-product">
                <div><Package size={27} /></div>
                <section>
                  <strong>{selectedMovement.productName}</strong>
                  <span>{selectedMovement.category}</span>
                </section>
              </div>

              <div className="movement-detail-grid">
                <div><span>Movement Type</span><strong>{movementLabel(selectedMovement.type)}</strong></div>
                <div><span>Quantity Change</span><strong>{selectedMovement.signedQuantity > 0 ? "+" : ""}{selectedMovement.signedQuantity}</strong></div>
                <div><span>Previous Stock</span><strong>{selectedMovement.previousStock}</strong></div>
                <div><span>New Stock</span><strong>{selectedMovement.newStock}</strong></div>
                <div><span>Date &amp; Time</span><strong>{formatDate(selectedMovement.date, true)}</strong></div>
                <div><span>Reference</span><strong>{selectedMovement.reference || "—"}</strong></div>
              </div>

              <div className="movement-detail-notes">
                <span>Notes</span>
                <p>{selectedMovement.notes || "No additional notes."}</p>
              </div>
            </div>

            <footer className="ark-movement-modal-footer">
              <button
                type="button"
                className="ark-movement-btn secondary"
                onClick={() => setSelectedMovement(null)}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
