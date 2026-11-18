import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  Gem,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Package,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  const value = date ? new Date(date) : new Date();

  if (Number.isNaN(value.getTime())) {
    return new Date().toLocaleDateString("en-IN");
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function OrderInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  const order = location.state?.order || location.state || {};

  const items = Array.isArray(order.items) ? order.items : [];

  const orderNumber =
    order.order_number ||
    order.orderNumber ||
    order.id ||
    "Pending Confirmation";

  const orderDate = formatDate(order.created_at || order.date);

  const subtotal = Number(
    order.subtotal ??
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity ?? item.qty ?? 1),
        0
      )
  );

  const shipping = Number(order.shipping_cost ?? order.shipping ?? 0);
  const discount = Number(order.discount ?? 0);

  const total = Number(
    order.total_amount ??
      order.total ??
      subtotal + shipping - discount
  );

  const customer = order.customer || order.customer_details || {};

  const customerName =
    customer.name ||
    order.customer_name ||
    order.customerName ||
    "Customer";

  const address =
    customer.address ||
    order.shipping_address ||
    order.address ||
    "";

  const phone = customer.phone || order.phone || "";
  const email = customer.email || order.email || "";

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    handlePrint();
  };

  return (
    <main className="ark-invoice-page">
      <style>{`
        .ark-invoice-page {
          min-height: 100vh;
          padding: 32px 20px;
          background: #f3f5f8;
          color: #172033;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-invoice-container {
          max-width: 960px;
          margin: 0 auto;
        }

        .ark-invoice-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .ark-invoice-toolbar-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ark-invoice-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border: 1px solid #dce2eb;
          border-radius: 9px;
          background: #fff;
          color: #263247;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .ark-invoice-button-primary {
          border-color: #183a63;
          background: #183a63;
          color: white;
        }

        .ark-invoice-paper {
          padding: 52px;
          background: white;
          border: 1px solid #e7ebf0;
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(20, 35, 55, 0.07);
        }

        .ark-invoice-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ark-invoice-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          flex-shrink: 0;
          background: #183a63;
          color: #e5c58c;
          border-radius: 12px;
        }

        .ark-invoice-brand h1 {
          margin: 0;
          font-size: 24px;
          letter-spacing: 2px;
        }

        .ark-invoice-brand p {
          margin: 5px 0 0;
          color: #788399;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .ark-invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 32px;
          border-bottom: 2px solid #183a63;
        }

        .ark-invoice-title {
          text-align: right;
        }

        .ark-invoice-title h2 {
          margin: 0;
          color: #183a63;
          font-size: 32px;
          letter-spacing: 2px;
        }

        .ark-invoice-title p {
          margin: 8px 0 0;
          color: #7b8494;
          font-size: 12px;
        }

        .ark-invoice-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 7px 10px;
          border-radius: 30px;
          background: #e8f8ef;
          color: #187747;
          font-size: 11px;
          font-weight: 700;
        }

        .ark-invoice-status-pending {
          background: #fff4d9;
          color: #8b6500;
        }

        .ark-invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin: 34px 0;
        }

        .ark-invoice-section-label {
          margin: 0 0 13px;
          color: #8a94a6;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.7px;
          text-transform: uppercase;
        }

        .ark-invoice-customer-name {
          margin: 0 0 10px;
          font-size: 16px;
          font-weight: 700;
        }

        .ark-invoice-contact-line {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 9px 0;
          color: #626e82;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .ark-invoice-contact-line svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ark-invoice-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 12px 0;
          font-size: 12px;
        }

        .ark-invoice-meta-row span {
          color: #778195;
        }

        .ark-invoice-meta-row strong {
          text-align: right;
          overflow-wrap: anywhere;
        }

        .ark-invoice-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .ark-invoice-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ark-invoice-table th {
          padding: 15px 12px;
          background: #183a63;
          color: white;
          font-size: 10px;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ark-invoice-table th:first-child {
          border-radius: 7px 0 0 7px;
        }

        .ark-invoice-table th:last-child {
          border-radius: 0 7px 7px 0;
        }

        .ark-invoice-table td {
          padding: 18px 12px;
          border-bottom: 1px solid #edf0f4;
          color: #4b5669;
          font-size: 12px;
          vertical-align: top;
        }

        .ark-invoice-table td strong {
          color: #172033;
        }

        .ark-invoice-product-name {
          min-width: 130px;
          color: #172033 !important;
          font-weight: 700;
        }

        .ark-invoice-empty {
          padding: 24px 12px;
          color: #778195;
          font-size: 12px;
          text-align: center;
        }

        .ark-invoice-summary {
          width: min(100%, 350px);
          margin: 28px 0 0 auto;
        }

        .ark-invoice-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 11px 0;
          color: #677286;
          font-size: 12px;
        }

        .ark-invoice-summary-row strong {
          color: #172033;
          text-align: right;
        }

        .ark-invoice-grand-total {
          margin-top: 8px;
          padding: 18px 16px;
          border-radius: 8px;
          background: #183a63;
          color: white;
          font-size: 15px;
          font-weight: 700;
        }

        .ark-invoice-grand-total strong {
          color: #e5c58c;
          font-size: 19px;
        }

        .ark-invoice-payment {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 35px;
          padding: 20px;
          border: 1px solid #e6ebf1;
          border-radius: 9px;
          background: #f9fafc;
        }

        .ark-invoice-payment h3 {
          margin: 0 0 8px;
          font-size: 12px;
        }

        .ark-invoice-payment p {
          margin: 0;
          color: #788399;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-invoice-footer {
          margin-top: 35px;
          padding-top: 22px;
          border-top: 1px solid #e6ebf1;
          text-align: center;
        }

        .ark-invoice-footer h3 {
          margin: 0 0 8px;
          color: #183a63;
          font-size: 16px;
        }

        .ark-invoice-footer p {
          margin: 5px 0;
          color: #8a94a6;
          font-size: 11px;
          line-height: 1.7;
        }

        .ark-invoice-print-note {
          margin-top: 20px;
          color: #7b8494;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 650px) {
          .ark-invoice-page {
            padding: 16px 10px;
          }

          .ark-invoice-paper {
            padding: 22px 16px;
          }

          .ark-invoice-header {
            flex-direction: column;
          }

          .ark-invoice-title {
            text-align: left;
          }

          .ark-invoice-title h2 {
            font-size: 27px;
          }

          .ark-invoice-brand h1 {
            font-size: 19px;
          }

          .ark-invoice-info {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .ark-invoice-payment {
            flex-direction: column;
          }

          .ark-invoice-toolbar {
            align-items: stretch;
          }

          .ark-invoice-toolbar-group {
            width: 100%;
          }

          .ark-invoice-toolbar-group .ark-invoice-button {
            flex: 1;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          .ark-invoice-page {
            padding: 0;
            background: white;
          }

          .ark-invoice-toolbar,
          .ark-invoice-print-note {
            display: none !important;
          }

          .ark-invoice-paper {
            max-width: none;
            padding: 0;
            border: none;
            border-radius: 0;
            box-shadow: none;
          }

          .ark-invoice-table-wrap {
            overflow: visible;
          }

          .ark-invoice-table {
            min-width: 0;
          }

          .ark-invoice-table th,
          .ark-invoice-grand-total {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="ark-invoice-container">
        <div className="ark-invoice-toolbar">
          <button
            type="button"
            className="ark-invoice-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="ark-invoice-toolbar-group">
            <button
              type="button"
              className="ark-invoice-button"
              onClick={handlePrint}
            >
              <Printer size={17} />
              Print Invoice
            </button>

            <button
              type="button"
              className="ark-invoice-button ark-invoice-button-primary"
              onClick={handleDownload}
            >
              <Download size={17} />
              Download PDF
            </button>
          </div>
        </div>

        <article className="ark-invoice-paper" ref={invoiceRef}>
          <header className="ark-invoice-header">
            <div className="ark-invoice-brand">
              <div className="ark-invoice-logo">
                <Gem size={30} />
              </div>

              <div>
                <h1>ARK MARBLES</h1>
                <p>PREMIUM STONE COLLECTIONS</p>
              </div>
            </div>

            <div className="ark-invoice-title">
              <h2>INVOICE</h2>
              <p>Invoice No: {orderNumber}</p>

              <span
                className={`ark-invoice-status ${
                  !orderNumber ||
                  orderNumber === "Pending Confirmation"
                    ? "ark-invoice-status-pending"
                    : ""
                }`}
              >
                <CheckCircle2 size={14} />
                {orderNumber === "Pending Confirmation"
                  ? "Awaiting Confirmation"
                  : "Order Recorded"}
              </span>
            </div>
          </header>

          <section className="ark-invoice-info">
            <div>
              <h3 className="ark-invoice-section-label">Bill To</h3>

              <p className="ark-invoice-customer-name">{customerName}</p>

              {address && (
                <p className="ark-invoice-contact-line">
                  <MapPin size={15} />
                  <span>{address}</span>
                </p>
              )}

              {phone && (
                <p className="ark-invoice-contact-line">
                  <Phone size={15} />
                  <span>{phone}</span>
                </p>
              )}

              {email && (
                <p className="ark-invoice-contact-line">
                  <Mail size={15} />
                  <span>{email}</span>
                </p>
              )}

              {!address && !phone && !email && (
                <p className="ark-invoice-contact-line">
                  Customer contact details were not provided.
                </p>
              )}
            </div>

            <div>
              <h3 className="ark-invoice-section-label">
                Invoice Information
              </h3>

              <div className="ark-invoice-meta-row">
                <span>Invoice Number</span>
                <strong>{orderNumber}</strong>
              </div>

              <div className="ark-invoice-meta-row">
                <span>Invoice Date</span>
                <strong>{orderDate}</strong>
              </div>

              <div className="ark-invoice-meta-row">
                <span>Payment Method</span>
                <strong>
                  {order.payment_method ||
                    order.paymentMethod ||
                    "Not specified"}
                </strong>
              </div>

              <div className="ark-invoice-meta-row">
                <span>Order Status</span>
                <strong>{order.status || "Pending"}</strong>
              </div>
            </div>
          </section>

          <section>
            <h3 className="ark-invoice-section-label">Order Summary</h3>

            <div className="ark-invoice-table-wrap">
              <table className="ark-invoice-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => {
                      const price = Number(item.price || 0);
                      const quantity = Number(
                        item.quantity ?? item.qty ?? 1
                      );

                      return (
                        <tr key={item.id || item.product_id || index}>
                          <td className="ark-invoice-product-name">
                            {item.name ||
                              item.product_name ||
                              item.title ||
                              "Marble Product"}
                          </td>

                          <td>{formatCurrency(price)}</td>
                          <td>{quantity}</td>
                          <td>
                            <strong>
                              {formatCurrency(price * quantity)}
                            </strong>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="ark-invoice-empty">
                        <Package
                          size={20}
                          style={{
                            display: "inline-block",
                            verticalAlign: "middle",
                            marginRight: 8,
                          }}
                        />
                        No order items were passed to this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ark-invoice-summary">
            <div className="ark-invoice-summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>

            <div className="ark-invoice-summary-row">
              <span>Shipping</span>
              <strong>{formatCurrency(shipping)}</strong>
            </div>

            <div className="ark-invoice-summary-row">
              <span>Discount</span>
              <strong>- {formatCurrency(discount)}</strong>
            </div>

            <div className="ark-invoice-summary-row ark-invoice-grand-total">
              <span>Grand Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </section>

          <section className="ark-invoice-payment">
            <div>
              <h3>Payment Information</h3>
              <p>
                Method:{" "}
                {order.payment_method ||
                  order.paymentMethod ||
                  "Not specified"}
                <br />
                Payment status: {order.payment_status || "Not specified"}
              </p>
            </div>

            <div>
              <h3>Order Reference</h3>
              <p>
                Order ID: {orderNumber}
                <br />
                Date: {orderDate}
              </p>
            </div>
          </section>

          <footer className="ark-invoice-footer">
            <h3>Thank You for Choosing ARK MARBLES</h3>
            <p>
              We appreciate your business and look forward to serving you.
            </p>
            <p>
              This invoice is generated from the order information provided
              by the application.
            </p>
          </footer>
        </article>

        <p className="ark-invoice-print-note">
          Use “Print Invoice” or “Download PDF” to open your browser's
          print dialog. Choose “Save as PDF” to save a PDF copy.
        </p>
      </div>
    </main>
  );
}