import { useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  UserRound,
  CalendarDays,
  IndianRupee,
  Truck,
  CheckCircle2,
  Clock3,
  CircleX,
  MapPin,
  Phone,
  Mail,
  FileText,
  Printer,
} from "lucide-react";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStatusClass(status) {
  return String(status || "Pending").toLowerCase().replaceAll(" ", "-");
}

export default function OrderDetails({ order, onBack, onStatusChange }) {
  const [currentStatus, setCurrentStatus] = useState(
    order?.status || "Pending"
  );

  if (!order) {
    return (
      <main className="admin-order-details-page">
        <div className="admin-order-details-empty">
          <div className="admin-order-details-empty-icon">
            <ShoppingCart size={32} />
          </div>
          <h2>No order selected</h2>
          <p>Select an order from the Orders page to view its details.</p>

          <button
            type="button"
            className="admin-order-details-button details-primary"
            onClick={() => onBack?.()}
          >
            <ArrowLeft size={17} />
            Back to Orders
          </button>
        </div>
      </main>
    );
  }

  const orderId = order.id || order.order_id || "—";
  const customerName =
    order.customer || order.customer_name || "Customer not available";
  const orderDate = order.date || order.created_at;
  const amount = order.amount ?? order.total_amount ?? 0;
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = Array.isArray(order.items)
    ? items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    : Number(order.items) || 0;

  function handleStatusChange(event) {
    const nextStatus = event.target.value;

    setCurrentStatus(nextStatus);

    if (typeof onStatusChange === "function") {
      onStatusChange(order, nextStatus);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="admin-order-details-page">
      <div className="admin-order-details-container">
        <div className="admin-order-details-breadcrumb">
          <button
            type="button"
            className="admin-order-details-back"
            onClick={() => onBack?.()}
          >
            <ArrowLeft size={17} />
            Back to Orders
          </button>

          <span>/</span>
          <span>Order Details</span>
        </div>

        <header className="admin-order-details-header">
          <div className="admin-order-details-title-group">
            <div className="admin-order-details-title-icon">
              <ShoppingCart size={25} />
            </div>

            <div>
              <p className="admin-order-details-eyebrow">
                ARK MARBLES / ORDER MANAGEMENT
              </p>
              <h1>Order Details</h1>
              <p className="admin-order-details-subtitle">
                Review order information and fulfilment status.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="admin-order-details-button details-secondary"
            onClick={handlePrint}
          >
            <Printer size={17} />
            Print Details
          </button>
        </header>

        <section className="admin-order-details-summary">
          <div>
            <span className="admin-order-details-label">Order number</span>
            <h2>{orderId}</h2>
            <p>
              <CalendarDays size={15} />
              Placed on {formatDate(orderDate)}
            </p>
          </div>

          <div className="admin-order-details-summary-right">
            <span
              className={`admin-order-details-status details-status-${getStatusClass(
                currentStatus
              )}`}
            >
              <span />
              {currentStatus}
            </span>

            <strong>{formatCurrency(amount)}</strong>
            <span className="admin-order-details-label">Order total</span>
          </div>
        </section>

        <section className="admin-order-details-stats">
          <article className="admin-order-details-stat-card">
            <div className="details-stat-icon details-stat-blue">
              <Package size={21} />
            </div>
            <div>
              <span>Total items</span>
              <h3>{itemCount}</h3>
            </div>
          </article>

          <article className="admin-order-details-stat-card">
            <div className="details-stat-icon details-stat-green">
              <IndianRupee size={21} />
            </div>
            <div>
              <span>Order value</span>
              <h3>{formatCurrency(amount)}</h3>
            </div>
          </article>

          <article className="admin-order-details-stat-card">
            <div className="details-stat-icon details-stat-orange">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Order status</span>
              <h3>{currentStatus}</h3>
            </div>
          </article>
        </section>

        <div className="admin-order-details-content">
          <div className="admin-order-details-main-column">
            <section className="admin-order-details-card">
              <div className="admin-order-details-card-heading">
                <div className="details-card-heading-icon">
                  <Package size={19} />
                </div>
                <div>
                  <h2>Ordered Items</h2>
                  <p>Products included in this order</p>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="admin-order-details-items-table-wrapper">
                  <table className="admin-order-details-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => {
                        const quantity = Number(item.quantity) || 1;
                        const price =
                          Number(item.price ?? item.unit_price) || 0;

                        return (
                          <tr key={item.id || item.product_id || index}>
                            <td>
                              <div className="admin-order-details-product">
                                <div className="details-product-icon">
                                  <Package size={19} />
                                </div>
                                <div>
                                  <strong>
                                    {item.name ||
                                      item.product_name ||
                                      "Product"}
                                  </strong>
                                  {item.sku && <span>SKU: {item.sku}</span>}
                                </div>
                              </div>
                            </td>
                            <td>{quantity}</td>
                            <td>{formatCurrency(price)}</td>
                            <td>
                              <strong>
                                {formatCurrency(
                                  Number(item.total) || price * quantity
                                )}
                              </strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-order-details-no-items">
                  <Package size={27} />
                  <h3>Item breakdown unavailable</h3>
                  <p>
                    Detailed product information was not supplied with this
                    order record.
                  </p>
                </div>
              )}

              <div className="admin-order-details-total-row">
                <span>Order total</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>
            </section>

            <section className="admin-order-details-card">
              <div className="admin-order-details-card-heading">
                <div className="details-card-heading-icon">
                  <Truck size={19} />
                </div>
                <div>
                  <h2>Order Fulfilment</h2>
                  <p>Manage the current order status</p>
                </div>
              </div>

              <div className="admin-order-details-status-control">
                <label htmlFor="order-status">Update status</label>

                <select
                  id="order-status"
                  value={currentStatus}
                  onChange={handleStatusChange}
                  className="admin-order-details-select"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <p>
                  The selected status is updated locally. Persisting changes
                  requires connecting this page to your order service.
                </p>
              </div>

              <div className="admin-order-details-timeline">
                <div className="details-timeline-item">
                  <div className="details-timeline-icon">
                    <CheckCircle2 size={17} />
                  </div>
                  <div>
                    <strong>Order record available</strong>
                    <p>Order information is displayed for review.</p>
                  </div>
                </div>

                <div className="details-timeline-item">
                  <div className="details-timeline-icon">
                    {currentStatus === "Cancelled" ? (
                      <CircleX size={17} />
                    ) : currentStatus === "Delivered" ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <Clock3 size={17} />
                    )}
                  </div>
                  <div>
                    <strong>Current status: {currentStatus}</strong>
                    <p>
                      {currentStatus === "Delivered"
                        ? "This order is marked as delivered."
                        : currentStatus === "Cancelled"
                          ? "This order is marked as cancelled."
                          : "Further fulfilment may be required."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="admin-order-details-side-column">
            <section className="admin-order-details-card">
              <div className="admin-order-details-card-heading">
                <div className="details-card-heading-icon">
                  <UserRound size={19} />
                </div>
                <div>
                  <h2>Customer Information</h2>
                  <p>Customer details for this order</p>
                </div>
              </div>

              <div className="admin-order-details-customer">
                <div className="details-customer-avatar">
                  {String(customerName).charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{customerName}</strong>
                  <span>Order customer</span>
                </div>
              </div>

              <div className="admin-order-details-info-list">
                <div>
                  <Phone size={17} />
                  <div>
                    <span>Phone number</span>
                    <strong>{order.phone || order.customer_phone || "—"}</strong>
                  </div>
                </div>

                <div>
                  <Mail size={17} />
                  <div>
                    <span>Email address</span>
                    <strong>{order.email || order.customer_email || "—"}</strong>
                  </div>
                </div>

                <div>
                  <MapPin size={17} />
                  <div>
                    <span>Delivery address</span>
                    <strong>
                      {order.address || order.delivery_address || "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-order-details-card">
              <div className="admin-order-details-card-heading">
                <div className="details-card-heading-icon">
                  <FileText size={19} />
                </div>
                <div>
                  <h2>Order Summary</h2>
                  <p>Financial overview</p>
                </div>
              </div>

              <div className="admin-order-details-financial-row">
                <span>Subtotal</span>
                <strong>
                  {formatCurrency(order.subtotal ?? amount)}
                </strong>
              </div>

              <div className="admin-order-details-financial-row">
                <span>Discount</span>
                <strong>
                  {formatCurrency(order.discount || 0)}
                </strong>
              </div>

              <div className="admin-order-details-financial-row">
                <span>Delivery charges</span>
                <strong>
                  {formatCurrency(order.delivery_charge || 0)}
                </strong>
              </div>

              <div className="admin-order-details-financial-row details-financial-total">
                <span>Total amount</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>

              <div className="admin-order-details-payment">
                <span>Payment method</span>
                <strong>{order.payment_method || "Not specified"}</strong>
                <span>Payment status</span>
                <strong>{order.payment_status || "Not specified"}</strong>
              </div>
            </section>
          </aside>
        </div>

        <footer className="admin-order-details-footer">
          <span>ARK MARBLES</span>
          <span>Order management</span>
        </footer>
      </div>
    </main>
  );
}