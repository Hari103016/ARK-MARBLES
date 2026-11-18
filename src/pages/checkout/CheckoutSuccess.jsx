import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShoppingBag,
  Gem,
  CalendarDays,
  IndianRupee,
  Truck,
  Copy,
} from "lucide-react";
import { useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function CheckoutSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const order = location.state?.order;

  if (!order) {
    return (
      <main className="checkout-success-page">
        <div className="checkout-success-card">
          <div className="checkout-success-icon">
            <Package size={35} />
          </div>

          <h1>No order details found</h1>

          <p>
            Open this page after completing checkout to view your order
            confirmation.
          </p>

          <Link to="/store" className="checkout-success-primary">
            Browse Store
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  const orderId =
    order.orderNumber ||
    order.order_number ||
    order.id ||
    order.order_id ||
    "Not available";

  const orderDate = order.created_at || order.date || new Date();

  const items = Array.isArray(order.items) ? order.items : [];

  const total = Number(
    order.total_amount ?? order.total ?? order.amount ?? 0
  );

  const paymentMethod =
    order.paymentMethod || order.payment_method || "Not specified";

  const customerName =
    order.customerName ||
    order.customer_name ||
    order.shippingAddress?.fullName ||
    order.shipping_address?.full_name ||
    "Customer";

  async function copyOrderId() {
    try {
      await navigator.clipboard.writeText(String(orderId));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="checkout-success-page">
      <div className="checkout-success-container">
        <header className="checkout-success-header">
          <Link to="/store" className="checkout-success-brand">
            <span className="checkout-success-brand-icon">
              <Gem size={25} />
            </span>

            <span>
              <strong>ARK MARBLES</strong>
              <small>PREMIUM STONE COLLECTIONS</small>
            </span>
          </Link>

          <span className="checkout-success-secure">
            <CheckCircle2 size={17} />
            Order confirmation
          </span>
        </header>

        <section className="checkout-success-hero">
          <div className="checkout-success-icon">
            <CheckCircle2 size={42} />
          </div>

          <span className="checkout-success-eyebrow">
            THANK YOU FOR SHOPPING WITH US
          </span>

          <h1>Order confirmed!</h1>

          <p>
            Thank you, {customerName}. Your order confirmation details
            are displayed below.
          </p>
        </section>

        <section className="checkout-success-card">
          <div className="checkout-success-order-heading">
            <div>
              <span>ORDER REFERENCE</span>
              <h2>{orderId}</h2>
            </div>

            <button
              type="button"
              className="checkout-success-copy"
              onClick={copyOrderId}
            >
              <Copy size={16} />
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>

          <div className="checkout-success-details">
            <div>
              <CalendarDays size={19} />
              <span>
                <small>Order date</small>
                <strong>{formatDate(orderDate)}</strong>
              </span>
            </div>

            <div>
              <IndianRupee size={19} />
              <span>
                <small>Total amount</small>
                <strong>{formatCurrency(total)}</strong>
              </span>
            </div>

            <div>
              <Package size={19} />
              <span>
                <small>Order status</small>
                <strong>{order.status || "Order received"}</strong>
              </span>
            </div>

            <div>
              <ShoppingBag size={19} />
              <span>
                <small>Payment method</small>
                <strong>{paymentMethod}</strong>
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="checkout-success-items">
              <h3>Order items</h3>

              {items.map((item, index) => {
                const quantity = Number(item.quantity ?? item.qty ?? 1);
                const price = Number(item.price ?? item.unit_price ?? 0);

                return (
                  <div
                    className="checkout-success-item"
                    key={item.id || item.product_id || index}
                  >
                    <div className="checkout-success-item-icon">
                      <Package size={21} />
                    </div>

                    <div className="checkout-success-item-info">
                      <strong>
                        {item.name || item.product_name || "Marble product"}
                      </strong>
                      <span>Quantity: {quantity}</span>
                    </div>

                    <strong>{formatCurrency(price * quantity)}</strong>
                  </div>
                );
              })}
            </div>
          )}

          <div className="checkout-success-total">
            <span>Grand Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="checkout-success-delivery">
            <div className="checkout-success-delivery-icon">
              <Truck size={22} />
            </div>

            <div>
              <strong>What's next?</strong>
              <p>
                Keep your order reference for future enquiries. Delivery
                updates depend on your store's order-management system.
              </p>
            </div>
          </div>

          <div className="checkout-success-actions">
            <Link
              to="/store"
              className="checkout-success-primary"
              onClick={() => navigate("/store")}
            >
              Continue Shopping
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/orders"
              className="checkout-success-secondary"
            >
              View My Orders
            </Link>
          </div>
        </section>

        <footer className="checkout-success-footer">
          <span>© {new Date().getFullYear()} ARK MARBLES</span>
          <span>Premium Stone Collections</span>
        </footer>
      </div>
    </main>
  );
}