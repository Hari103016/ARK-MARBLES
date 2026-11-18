import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Trash2,
  ShoppingCart,
  Package,
  UserRound,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Clock,
  Filter,
  X,
  CheckCircle2,
  Settings,
} from "lucide-react";

const INITIAL_NOTIFICATIONS = [];

const FILTER_OPTIONS = ["All", "Unread", "Read"];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case "order":
      return ShoppingCart;
    case "inventory":
      return Package;
    case "customer":
      return UserRound;
    case "payment":
      return CreditCard;
    case "enquiry":
      return MessageSquare;
    case "alert":
      return AlertTriangle;
    default:
      return Bell;
  }
}

function getNotificationColor(type) {
  switch (type) {
    case "order":
      return "notification-blue";
    case "inventory":
      return "notification-orange";
    case "customer":
      return "notification-purple";
    case "payment":
      return "notification-green";
    case "enquiry":
      return "notification-cyan";
    case "alert":
      return "notification-red";
    default:
      return "notification-gray";
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notice, setNotice] = useState("");

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        [notification.title, notification.message, notification.type].some(
          (value) => String(value ?? "").toLowerCase().includes(query)
        );

      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" && !notification.read) ||
        (filter === "Read" && notification.read);

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, filter]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const readCount = notifications.filter(
    (notification) => notification.read
  ).length;

  function markAsRead(id) {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );

    setSelectedNotification((previous) =>
      previous?.id === id ? { ...previous, read: true } : previous
    );
  }

  function markAllAsRead() {
    if (unreadCount === 0) {
      setNotice("There are no unread notifications.");
      return;
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

    setNotice(
      "All notifications marked as read for this page session. Database persistence is not configured."
    );
  }

  function deleteNotification(id) {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== id)
    );

    setSelectedNotification((previous) =>
      previous?.id === id ? null : previous
    );

    setNotice(
      "Notification removed from this page session. It has not been deleted from a database."
    );
  }

  function clearReadNotifications() {
    if (readCount === 0) {
      setNotice("There are no read notifications to clear.");
      return;
    }

    setNotifications((previous) =>
      previous.filter((notification) => !notification.read)
    );

    setNotice(
      "Read notifications cleared from this page session only."
    );
  }

  function resetFilters() {
    setSearch("");
    setFilter("All");
  }

  return (
    <main className="admin-notifications-page">
      <div className="admin-notifications-container">
        <header className="admin-notifications-header">
          <div className="admin-notifications-heading">
            <div className="admin-notifications-heading-icon">
              <Bell size={25} />
              {unreadCount > 0 && (
                <span className="admin-notifications-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <div>
              <p className="admin-notifications-eyebrow">
                ARK MARBLES / ADMIN
              </p>
              <h1>Notifications</h1>
              <p className="admin-notifications-subtitle">
                Review important updates and keep track of admin activity.
              </p>
            </div>
          </div>

          <div className="admin-notifications-header-actions">
            <button
              type="button"
              className="admin-notifications-button notifications-secondary"
              onClick={markAllAsRead}
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          </div>
        </header>

        <div className="admin-notifications-notice">
          <AlertTriangle size={17} />
          <span>
            Notifications are stored in component state only. Connect your
            notification service to load and persist real notifications.
          </span>
        </div>

        {notice && (
          <div className="admin-notifications-feedback">
            <CheckCircle2 size={17} />
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <section className="admin-notifications-stats">
          <article className="admin-notifications-stat-card">
            <div className="admin-notifications-stat-icon notification-stat-blue">
              <Bell size={22} />
            </div>
            <div>
              <span>Total notifications</span>
              <h2>{notifications.length}</h2>
              <p>All updates</p>
            </div>
          </article>

          <article className="admin-notifications-stat-card">
            <div className="admin-notifications-stat-icon notification-stat-orange">
              <Clock size={22} />
            </div>
            <div>
              <span>Unread</span>
              <h2>{unreadCount}</h2>
              <p>Require your attention</p>
            </div>
          </article>

          <article className="admin-notifications-stat-card">
            <div className="admin-notifications-stat-icon notification-stat-green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span>Read</span>
              <h2>{readCount}</h2>
              <p>Previously reviewed</p>
            </div>
          </article>
        </section>

        <section className="admin-notifications-panel">
          <div className="admin-notifications-panel-heading">
            <div>
              <h2>All notifications</h2>
              <p>Manage your notification list.</p>
            </div>

            <span className="admin-notifications-count">
              {filteredNotifications.length} notifications
            </span>
          </div>

          <div className="admin-notifications-toolbar">
            <label className="admin-notifications-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                aria-label="Search notifications"
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

            <div className="admin-notifications-filter">
              <Filter size={16} />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter notifications"
              >
                {FILTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="admin-notifications-button notifications-secondary"
              onClick={clearReadNotifications}
            >
              <Trash2 size={16} />
              Clear Read
            </button>
          </div>

          <div className="admin-notifications-list">
            {filteredNotifications.map((notification) => {
              const NotificationIcon = getNotificationIcon(
                notification.type
              );

              return (
                <article
                  key={notification.id}
                  className={`admin-notifications-item ${
                    notification.read ? "notification-is-read" : "notification-is-unread"
                  }`}
                >
                  <div
                    className={`admin-notifications-item-icon ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    <NotificationIcon size={20} />
                  </div>

                  <button
                    type="button"
                    className="admin-notifications-item-content"
                    onClick={() => {
                      setSelectedNotification(notification);
                      markAsRead(notification.id);
                    }}
                  >
                    <div className="admin-notifications-item-title-row">
                      <h3>{notification.title}</h3>
                      {!notification.read && (
                        <span className="admin-notifications-unread-dot" />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="admin-notifications-item-time">
                      <Clock size={13} />
                      {formatDate(notification.date)}
                    </span>
                  </button>

                  <div className="admin-notifications-item-actions">
                    {!notification.read && (
                      <button
                        type="button"
                        className="admin-notifications-icon-button"
                        title="Mark as read"
                        aria-label="Mark as read"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="admin-notifications-icon-button notification-delete"
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="admin-notifications-empty">
                <div className="admin-notifications-empty-icon">
                  <Bell size={29} />
                </div>
                <h3>No notifications found</h3>
                <p>
                  {notifications.length === 0
                    ? "There are no notification records available yet."
                    : "Try a different search term or filter."}
                </p>

                {(search || filter !== "All") && (
                  <button
                    type="button"
                    className="admin-notifications-button notifications-secondary"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>

          <footer className="admin-notifications-footer">
            <span>
              Showing {filteredNotifications.length} of {notifications.length}{" "}
              notifications
            </span>
            <span>ARK Marbles Admin</span>
          </footer>
        </section>

        <section className="admin-notifications-preferences">
          <div className="admin-notifications-preferences-icon">
            <Settings size={21} />
          </div>
          <div>
            <h3>Notification preferences</h3>
            <p>
              Notification delivery and preferences can be configured after
              connecting your notification service.
            </p>
          </div>
        </section>
      </div>

      {selectedNotification && (
        <div
          className="admin-notifications-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotification(null);
            }
          }}
        >
          <section
            className="admin-notifications-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-notification-detail-title"
          >
            <header className="admin-notifications-modal-header">
              <div>
                <p>NOTIFICATION DETAILS</p>
                <h2 id="admin-notification-detail-title">
                  {selectedNotification.title}
                </h2>
              </div>

              <button
                type="button"
                className="admin-notifications-modal-close"
                onClick={() => setSelectedNotification(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </header>

            <div className="admin-notifications-modal-body">
              <p>{selectedNotification.message}</p>

              <div className="admin-notifications-detail-row">
                <span>Category</span>
                <strong>{selectedNotification.type || "General"}</strong>
              </div>

              <div className="admin-notifications-detail-row">
                <span>Date and time</span>
                <strong>{formatDate(selectedNotification.date)}</strong>
              </div>

              <div className="admin-notifications-detail-row">
                <span>Read status</span>
                <strong>
                  {selectedNotification.read ? "Read" : "Unread"}
                </strong>
              </div>
            </div>

            <footer className="admin-notifications-modal-footer">
              <button
                type="button"
                className="admin-notifications-button notifications-secondary"
                onClick={() => setSelectedNotification(null)}
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