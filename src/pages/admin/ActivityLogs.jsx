
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Users,
  LogIn,
  FilePenLine,
  Search,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  AlertCircle,
  List,
  X,
  UserRound,
  Clock,
  Globe,
  ShieldCheck
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./ActivityLogs.css";

const PAGE_SIZE = 5;

const ACTIONS = [
  "Login",
  "Logout",
  "Create",
  "Update",
  "Delete",
  "View"
];

const getActionClass = action =>
  String(action || "other").toLowerCase();

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("All Users");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [dateFilter, setDateFilter] = useState("all");

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const { data, error: fetchError } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (fetchError) {
      console.error("Activity logs error:", fetchError);
      setError(fetchError.message);
      setLogs([]);
      setSelectedLog(null);
    } else {
      const records = data || [];
      setLogs(records);

      setSelectedLog(current => {
        if (!records.length) return null;

        return records.find(item => item.id === current?.id)
          || records[0];
      });
    }

    setLoading(false);
    setRefreshing(false);
  }

  const users = useMemo(() => {
    return [
      ...new Set(
        logs.map(log => log.user_name).filter(Boolean)
      )
    ].sort();
  }, [logs]);

  const modules = useMemo(() => {
    return [
      ...new Set(
        logs.map(log => log.module).filter(Boolean)
      )
    ].sort();
  }, [logs]);

  const todayCount = useMemo(() => {
    const today = new Date();

    return logs.filter(log => {
      const date = new Date(log.created_at);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [logs]);

  const loginCount = logs.filter(
    log => log.action === "Login"
  ).length;

  const updateCount = logs.filter(
    log => log.action === "Update"
  ).length;

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();
    const now = new Date();

    return logs.filter(log => {
      const matchesSearch =
        !query ||
        [
          log.user_name,
          log.action,
          log.module,
          log.description,
          log.ip_address
        ]
          .filter(Boolean)
          .some(value =>
            String(value).toLowerCase().includes(query)
          );

      const matchesUser =
        userFilter === "All Users" ||
        log.user_name === userFilter;

      const matchesAction =
        actionFilter === "All Actions" ||
        log.action === actionFilter;

      const matchesModule =
        moduleFilter === "All Modules" ||
        log.module === moduleFilter;

      const logDate = new Date(log.created_at);

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate =
          logDate.toDateString() === now.toDateString();
      } else if (dateFilter === "7days") {
        const previous = new Date();
        previous.setDate(previous.getDate() - 7);
        matchesDate = logDate >= previous;
      } else if (dateFilter === "30days") {
        const previous = new Date();
        previous.setDate(previous.getDate() - 30);
        matchesDate = logDate >= previous;
      }

      return (
        matchesSearch &&
        matchesUser &&
        matchesAction &&
        matchesModule &&
        matchesDate
      );
    });
  }, [
    logs,
    search,
    userFilter,
    actionFilter,
    moduleFilter,
    dateFilter
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function resetFilters() {
    setSearch("");
    setUserFilter("All Users");
    setActionFilter("All Actions");
    setModuleFilter("All Modules");
    setDateFilter("all");
    setPage(1);
  }

  function exportCSV() {
    if (!filteredLogs.length) {
      window.alert("No activity records available to export.");
      return;
    }

    const headers = [
      "User",
      "Action",
      "Module",
      "Description",
      "Timestamp",
      "IP Address"
    ];

    const rows = filteredLogs.map(log => [
      log.user_name,
      log.action,
      log.module,
      log.description,
      log.created_at,
      log.ip_address
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ark-marbles-activity-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  function changePage(nextPage) {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  }

  function renderStat(Icon, value, label, trend) {
    return (
      <div className="activity-stat-card">
        <div className="activity-stat-icon">
          <Icon size={25} />
        </div>

        <div className="activity-stat-info">
          <strong>{value.toLocaleString("en-IN")}</strong>
          <span>{label}</span>
        </div>

        {trend && (
          <span className="activity-stat-trend">
            {trend}
          </span>
        )}
      </div>
    );
  }

  function renderAction(action) {
    return (
      <span
        className={`activity-action-badge ${getActionClass(action)}`}
      >
        {action || "Other"}
      </span>
    );
  }

  if (loading) {
    return (
      <main className="ark-activity-page">
        <div className="activity-loading">
          <RefreshCw className="activity-spin" size={27} />
          <p>Loading activity history...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="ark-activity-page">

      {/* PAGE HEADER */}

      <div className="activity-breadcrumb">
        <Activity size={15} />
        <span>Dashboard</span>
        <span>›</span>
        <strong>Activity Logs</strong>
      </div>

      <header className="activity-page-header">
        <div>
          <h1>Activity Logs</h1>
          <p>
            Monitor and track all administrative activities in your system.
          </p>
        </div>

        <button
          className="activity-refresh-button"
          onClick={() => loadLogs(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "activity-spin" : ""}
          />
          Refresh
        </button>
      </header>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="activity-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => loadLogs()}>
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <section className="activity-stats-grid">
        {renderStat(
          Activity,
          logs.length,
          "Total Activities",
          null
        )}

        {renderStat(
          CalendarDays,
          todayCount,
          "Today's Activities",
          null
        )}

        {renderStat(
          LogIn,
          loginCount,
          "Logins",
          null
        )}

        {renderStat(
          FilePenLine,
          updateCount,
          "Updates",
          null
        )}
      </section>

      {/* SEARCH AND FILTERS */}

      <section className="activity-filter-bar">

        <div className="activity-search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search by user, action or description..."
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <label className="activity-filter-select">
          <Users size={16} />
          <select
            value={userFilter}
            onChange={event => {
              setUserFilter(event.target.value);
              setPage(1);
            }}
          >
            <option>All Users</option>
            {users.map(user => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>

        <label className="activity-filter-select">
          <Activity size={16} />
          <select
            value={actionFilter}
            onChange={event => {
              setActionFilter(event.target.value);
              setPage(1);
            }}
          >
            <option>All Actions</option>
            {ACTIONS.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>

        <label className="activity-filter-select">
          <List size={16} />
          <select
            value={moduleFilter}
            onChange={event => {
              setModuleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option>All Modules</option>
            {modules.map(module => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>

        <label className="activity-filter-select">
          <CalendarDays size={16} />
          <select
            value={dateFilter}
            onChange={event => {
              setDateFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <ChevronDown size={14} />
        </label>

        <button
          className="activity-export-button"
          onClick={exportCSV}
        >
          <Download size={16} />
          Export Logs
        </button>

        <button
          className="activity-clear-button"
          onClick={resetFilters}
        >
          Clear
        </button>

      </section>

      {/* HISTORY AND DETAILS */}

      <section className="activity-main-grid">

        <div className="activity-history-card">

          <div className="activity-card-heading">
            <List size={21} />
            <h2>Activity History</h2>
            <span>{filteredLogs.length} records</span>
          </div>

          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="activity-empty"
                    >
                      <Activity size={27} />
                      <strong>No activity records found</strong>
                      <span>
                        Try changing your search or filters.
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={
                        selectedLog?.id === log.id
                          ? "selected"
                          : ""
                      }
                      onClick={() => setSelectedLog(log)}
                    >
                      <td>
                        {(currentPage - 1) * PAGE_SIZE +
                          index + 1}
                      </td>

                      <td>
                        <div className="activity-user-cell">
                          <span className="activity-avatar">
                            {(log.user_name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <strong>{log.user_name || "Unknown"}</strong>
                        </div>
                      </td>

                      <td>{renderAction(log.action)}</td>

                      <td>{log.module || "General"}</td>

                      <td className="activity-description-cell">
                        {log.description}
                      </td>

                      <td className="activity-date-cell">
                        {formatDate(log.created_at)}
                      </td>

                      <td>{log.ip_address || "—"}</td>

                      <td>
                        <button
                          className="activity-view-button"
                          onClick={event => {
                            event.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="activity-pagination">
            <span>
              Showing{" "}
              {filteredLogs.length
                ? (currentPage - 1) * PAGE_SIZE + 1
                : 0}
              {" "}to{" "}
              {Math.min(
                currentPage * PAGE_SIZE,
                filteredLogs.length
              )}
              {" "}of {filteredLogs.length} activities
            </span>

            <div className="activity-page-buttons">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <button
                      key={pageNumber}
                      className={
                        currentPage === pageNumber
                          ? "active"
                          : ""
                      }
                      onClick={() => changePage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                }
              )}

              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

        </div>

        {/* ACTIVITY DETAILS PANEL */}

        <aside className="activity-details-card">

          <div className="activity-details-heading">
            <ShieldCheck size={20} />
            <h2>Activity Details</h2>
          </div>

          {selectedLog ? (
            <div className="activity-details-content">

              <div className="activity-details-user">
                <span className="activity-details-avatar">
                  <UserRound size={32} />
                </span>

                <div>
                  <strong>{selectedLog.user_name || "Unknown User"}</strong>
                  <small>
                    {selectedLog.user_id
                      ? "Registered User"
                      : "User Account"}
                  </small>
                </div>
              </div>

              <div className="activity-detail-row">
                <span>Action</span>
                {renderAction(selectedLog.action)}
              </div>

              <div className="activity-detail-row">
                <span>Module</span>
                <strong>
                  {selectedLog.module || "General"}
                </strong>
              </div>

              <div className="activity-detail-row activity-detail-description">
                <span>Description</span>
                <strong>{selectedLog.description}</strong>
              </div>

              <div className="activity-detail-row">
                <span>Timestamp</span>
                <strong>
                  {formatTime(selectedLog.created_at)}
                </strong>
              </div>

              <div className="activity-detail-row">
                <span>IP Address</span>
                <strong>
                  {selectedLog.ip_address || "Not recorded"}
                </strong>
              </div>

              <div className="activity-detail-row">
                <span>User ID</span>
                <strong className="activity-user-id">
                  {selectedLog.user_id || "Not available"}
                </strong>
              </div>

            </div>
          ) : (
            <div className="activity-details-empty">
              <Eye size={25} />
              <p>Select an activity to view its details.</p>
            </div>
          )}

        </aside>

      </section>

      {/* FOOTER */}

      <footer className="activity-page-footer">
        <span>© {new Date().getFullYear()} ARK MARBLES</span>
        <strong>
          PREMIUM MARBLE &amp; NATURAL STONE MANAGEMENT
        </strong>
        <span>Powered by ARK MARBLES</span>
      </footer>

    </main>
  );
}
