import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  Trash2,
  Search,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  Database,
  CalendarDays,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./RecycleBin.css";

const PAGE_SIZE = 10;

const prettyTableName = (value = "") =>
  value.split(".").pop().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getRecordLabel = (item) => {
  if (item.record_label) return item.record_label;
  const data = item.record_data || {};
  return (
    data.name ||
    data.marble_name ||
    data.title ||
    data.full_name ||
    data.customer_name ||
    data.order_number ||
    data.order_id ||
    data.email ||
    data.sku ||
    `Record ${item.record_id || ""}`
  );
};

const formatDate = (value) => {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RecycleBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [notice, setNotice] = useState({ type: "", text: "" });

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("recycle_bin")
      .select("id, source_table, record_id, record_label, record_data, deleted_at")
      .order("deleted_at", { ascending: false });

    if (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to load deleted records.",
      });
      setItems([]);
    } else {
      setItems(data || []);
      setNotice({ type: "", text: "" });
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const tableOptions = useMemo(
    () => [...new Set(items.map((item) => item.source_table))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTable =
        tableFilter === "all" || item.source_table === tableFilter;
      const searchable = [
        getRecordLabel(item),
        item.source_table,
        item.record_id,
        JSON.stringify(item.record_data || {}),
      ]
        .join(" ")
        .toLowerCase();
      return matchesTable && (!term || searchable.includes(term));
    });
  }, [items, search, tableFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, tableFilter]);

  const handleRestore = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    setNotice({ type: "", text: "" });

    const { error } = await supabase.rpc("restore_recycle_bin_item", {
      p_recycle_id: item.id,
    });

    if (error) {
      setNotice({
        type: "error",
        text: `Could not restore ${getRecordLabel(item)}: ${error.message}`,
      });
    } else {
      setItems((current) => current.filter((row) => row.id !== item.id));
      setNotice({
        type: "success",
        text: `${getRecordLabel(item)} was restored successfully.`,
      });
    }

    setBusyId(null);
  };

  const handlePermanentDelete = async () => {
    if (!confirmItem || busyId) return;
    const item = confirmItem;
    setBusyId(item.id);

    const { error } = await supabase
      .from("recycle_bin")
      .delete()
      .eq("id", item.id);

    if (error) {
      setNotice({ type: "error", text: error.message });
    } else {
      setItems((current) => current.filter((row) => row.id !== item.id));
      setNotice({
        type: "success",
        text: `${getRecordLabel(item)} was permanently deleted.`,
      });
    }

    setBusyId(null);
    setConfirmItem(null);
  };

  return (
    <main className="ark-recycle-page">
      <div className="ark-recycle-heading">
        <div>
          <span className="ark-recycle-eyebrow">ARK MARBLES / ADMINISTRATION</span>
          <h1>Recycle Bin</h1>
          <p>Review deleted records and restore them whenever needed.</p>
        </div>
        <button
          type="button"
          className="ark-recycle-refresh"
          onClick={() => loadItems(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw size={17} className={refreshing ? "ark-recycle-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="ark-recycle-stats">
        <div className="ark-recycle-stat">
          <span className="ark-recycle-stat-icon"><Trash2 size={24} /></span>
          <div><small>Deleted Records</small><strong>{items.length}</strong><em>All admin sections</em></div>
        </div>
        <div className="ark-recycle-stat">
          <span className="ark-recycle-stat-icon"><Database size={24} /></span>
          <div><small>Record Types</small><strong>{tableOptions.length}</strong><em>Different data sections</em></div>
        </div>
        <div className="ark-recycle-stat">
          <span className="ark-recycle-stat-icon"><ArchiveRestore size={24} /></span>
          <div><small>Restorable Items</small><strong>{items.length}</strong><em>Available to recover</em></div>
        </div>
      </section>

      <section className="ark-recycle-panel">
        <div className="ark-recycle-toolbar">
          <div>
            <h2><Trash2 size={22} /> Deleted Items</h2>
            <p>Deleted products, customers, orders and other admin records.</p>
          </div>
          <div className="ark-recycle-filters">
            <label className="ark-recycle-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search deleted records..."
                aria-label="Search deleted records"
              />
            </label>
            <select
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
              aria-label="Filter by record type"
            >
              <option value="all">All record types</option>
              {tableOptions.map((table) => (
                <option value={table} key={table}>{prettyTableName(table)}</option>
              ))}
            </select>
          </div>
        </div>

        {notice.text && (
          <div className={`ark-recycle-notice ${notice.type}`} role="status">
            {notice.type === "error" && <AlertTriangle size={17} />}
            {notice.text}
          </div>
        )}

        {loading ? (
          <div className="ark-recycle-empty"><RefreshCw className="ark-recycle-spin" size={28} /><strong>Loading deleted records...</strong></div>
        ) : visibleItems.length === 0 ? (
          <div className="ark-recycle-empty">
            <span><ArchiveRestore size={34} /></span>
            <strong>{items.length ? "No matching records" : "Recycle Bin is empty"}</strong>
            <p>{items.length ? "Try changing your search or filter." : "When an admin deletes a record, it will appear here with a restore option."}</p>
          </div>
        ) : (
          <>
            <div className="ark-recycle-table-wrap">
              <table className="ark-recycle-table">
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Section</th>
                    <th>Record ID</th>
                    <th>Deleted On</th>
                    <th className="actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="ark-recycle-record">
                          <span className="ark-recycle-record-icon"><Database size={18} /></span>
                          <strong>{getRecordLabel(item)}</strong>
                        </div>
                      </td>
                      <td><span className="ark-recycle-type">{prettyTableName(item.source_table)}</span></td>
                      <td className="ark-recycle-id">{item.record_id || "—"}</td>
                      <td><span className="ark-recycle-date"><CalendarDays size={15} />{formatDate(item.deleted_at)}</span></td>
                      <td>
                        <div className="ark-recycle-actions">
                          <button
                            type="button"
                            className="restore"
                            onClick={() => handleRestore(item)}
                            disabled={Boolean(busyId)}
                            title="Restore record"
                          >
                            <RotateCcw size={16} /> {busyId === item.id ? "Restoring..." : "Restore"}
                          </button>
                          <button
                            type="button"
                            className="purge"
                            onClick={() => setConfirmItem(item)}
                            disabled={Boolean(busyId)}
                            title="Permanently delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ark-recycle-pagination">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredItems.length)} of {filteredItems.length} records
              </span>
              <div>
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <strong>{page} / {totalPages}</strong>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </section>

      {confirmItem && (
        <div className="ark-recycle-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setConfirmItem(null);
        }}>
          <section className="ark-recycle-modal" role="dialog" aria-modal="true" aria-labelledby="ark-recycle-confirm-title">
            <button className="close" type="button" onClick={() => setConfirmItem(null)} aria-label="Close"><X size={19} /></button>
            <span className="warning"><AlertTriangle size={27} /></span>
            <h2 id="ark-recycle-confirm-title">Permanently delete?</h2>
            <p><strong>{getRecordLabel(confirmItem)}</strong> will be removed from the recycle bin and cannot be restored.</p>
            <div className="modal-actions">
              <button type="button" className="cancel" onClick={() => setConfirmItem(null)}>Cancel</button>
              <button type="button" className="confirm" onClick={handlePermanentDelete} disabled={Boolean(busyId)}>
                <Trash2 size={16} /> Delete permanently
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
