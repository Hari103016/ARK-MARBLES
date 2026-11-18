import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Layers,
  Plus,
  FileText,
  Receipt,
  RefreshCw,
  Download,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Truck,
  HardHat,
  Building2,
  Gem,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Dashboard.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const normalise = (value) => String(value || "").trim().toLowerCase();

const orderDate = (order) =>
  order.created_at || order.order_date || order.date || null;

const orderAmount = (order) => {
  const total = order.total_amount ?? order.grand_total;
  if (total !== null && total !== undefined) return Number(total) || 0;

  return Math.max(
    0,
    (Number(order.subtotal) || 0) +
      (Number(order.tax_amount) || 0) +
      (Number(order.shipping_amount) || 0) -
      (Number(order.discount_amount) || 0)
  );
};

const dateText = (value, options = { day: "2-digit", month: "short" }) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", options);
};

const isPaid = (order) =>
  ["paid", "completed", "success", "succeeded"].includes(
    normalise(order.payment_status)
  );

const isCancelled = (order) =>
  ["cancelled", "canceled", "refunded"].includes(normalise(order.status));

const getStock = (product) => {
  const value = product.stock_quantity ?? product.stock ?? product.quantity;
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const stockUnit = (product) =>
  product.stock_unit || product.unit || product.measurement_unit || "Units";

const isActive = (product) => {
  if (typeof product.is_available === "boolean") return product.is_available;
  return !["inactive", "unavailable", "archived", "disabled"].includes(
    normalise(product.status)
  );
};

const productType = (product) => {
  const text = [
    product.category,
    product.category_name,
    product.product_type,
    product.type,
    product.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/tile|tiles|flooring|wall tile/.test(text)) return "tiles";
  if (
    /cement|steel|brick|sand|pipe|plumbing|electrical|hardware|paint|adhesive|pvc|construction|wood|plywood/.test(
      text
    )
  ) return "construction";
  if (/marble|granite|quartz|onyx|travertine|limestone|stone|slab/.test(text)) {
    return "marble";
  }
  return "other";
};

const customerName = (order, profiles) => {
  const direct =
    order.customer_name ||
    order.customer?.full_name ||
    order.customer?.name;
  if (direct) return direct;

  const customerId = order.customer_id || order.user_id;
  const profile = profiles.find((item) => item.id === customerId);
  return profile?.full_name || profile?.name || "Customer";
};

const firstOrderItem = (order) =>
  (Array.isArray(order.items) && order.items[0]) ||
  (Array.isArray(order.order_items) && order.order_items[0]) ||
  (Array.isArray(order.products) && order.products[0]) ||
  {};

const orderProductName = (order) => {
  const item = firstOrderItem(order);
  return (
    order.product_name ||
    order.item_name ||
    order.product?.name ||
    item.product_name ||
    item.name ||
    item.product?.name ||
    item.marble_name ||
    "Order items"
  );
};

const orderProductImage = (order) => {
  const item = firstOrderItem(order);
  return (
    order.product_image ||
    order.image_url ||
    order.product?.image_url ||
    item.image_url ||
    item.product?.image_url ||
    item.product_image ||
    ""
  );
};

const orderQuantity = (order) => {
  const item = firstOrderItem(order);
  return order.quantity ?? item.quantity ?? item.qty ?? "—";
};

const orderType = (order) => {
  const text = `${orderProductName(order)} ${order.category || ""}`.toLowerCase();
  if (/tile/.test(text)) return "Tiles";
  if (/cement|steel|brick|sand|pipe|paint|construction/.test(text)) return "Materials";
  if (/marble|granite|quartz|onyx|stone/.test(text)) return "Marble";
  return order.order_type || order.type || "Product";
};

const deliveryStatus = (order) =>
  String(
    order.delivery_status ||
      order.shipping_status ||
      order.delivery?.status ||
      order.status ||
      "Scheduled"
  ).trim();

const deliveryStatusClass = (value) => {
  const status = normalise(value);
  if (/deliver/.test(status) && !/out/.test(status)) return "delivered";
  if (/transit|shipped|processing|packed/.test(status)) return "in-transit";
  if (/out for delivery/.test(status)) return "out-for-delivery";
  if (/schedule|pending|confirm/.test(status)) return "scheduled";
  if (/cancel|refund/.test(status)) return "cancelled";
  return "scheduled";
};

const statusClass = (value) => {
  const status = normalise(value);
  if (/complete|deliver|paid/.test(status)) return "success";
  if (/process|transit|ship|confirm/.test(status)) return "processing";
  if (/cancel|refund|fail/.test(status)) return "danger";
  return "pending";
};

const exportCSV = (orders, profiles, period) => {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["ARK MARBLES - DASHBOARD REPORT"],
    ["Generated", new Date().toLocaleString("en-IN")],
    ["Period", `Last ${period} days`],
    [],
    ["Order ID", "Customer", "Date", "Type", "Amount", "Payment", "Status"],
    ...orders.map((order) => [
      order.order_number || order.id,
      customerName(order, profiles),
      dateText(orderDate(order), { day: "2-digit", month: "short", year: "numeric" }),
      orderType(order),
      orderAmount(order),
      order.payment_status || "Unknown",
      order.status || "Unknown",
    ]),
  ];

  const csv = rows.map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ark-marbles-dashboard.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState({
    orders: [],
    profiles: [],
    products: [],
    quotations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [ordersResult, profilesResult, productsResult, quotationsResult] =
        await Promise.all([
          supabase.from("orders").select("*"),
          supabase.from("profiles").select("*"),
          supabase.from("marbles").select("*"),
          supabase.from("quotations").select("*"),
        ]);

      const failures = [
        ordersResult.error,
        profilesResult.error,
        productsResult.error,
        quotationsResult.error,
      ].filter(Boolean);

      setData({
        orders: ordersResult.data || [],
        profiles: profilesResult.data || [],
        products: productsResult.data || [],
        quotations: quotationsResult.data || [],
      });

      if (failures.length) {
        setError(failures.map((item) => item.message).join(" | "));
      }
    } catch (err) {
      setError(err?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { orders, profiles, products, quotations } = data;

  const customers = useMemo(
    () => profiles.filter((profile) => normalise(profile.role) === "customer"),
    [profiles]
  );

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));

    return orders.filter((order) => {
      const value = orderDate(order);
      if (!value) return false;
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= cutoff && date <= now;
    });
  }, [orders, period]);

  const revenue = filteredOrders
    .filter((order) => isPaid(order) && !isCancelled(order))
    .reduce((sum, order) => sum + orderAmount(order), 0);

  const pendingOrders = orders.filter((order) =>
    ["pending", "confirmed", "processing"].includes(normalise(order.status))
  ).length;

  const processingOrders = orders.filter((order) =>
    ["confirmed", "processing", "packed", "ready"].includes(
      normalise(order.status)
    )
  ).length;

  const activeProducts = products.filter(isActive).length;

  const lowStockProducts = useMemo(
    () =>
      products
        .map((product) => ({ ...product, dashboardStock: getStock(product) }))
        .filter(
          (product) =>
            product.dashboardStock !== null &&
            product.dashboardStock <=
              Number(product.low_stock_threshold ?? 10)
        )
        .sort((a, b) => a.dashboardStock - b.dashboardStock),
    [products]
  );

  const salesMonths = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const amount = orders
        .filter((order) => {
          if (!isPaid(order) || isCancelled(order)) return false;
          const value = orderDate(order);
          if (!value) return false;
          const created = new Date(value);
          return (
            created.getFullYear() === date.getFullYear() &&
            created.getMonth() === date.getMonth()
          );
        })
        .reduce((sum, order) => sum + orderAmount(order), 0);

      months.push({
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        amount,
      });
    }
    return months;
  }, [orders]);

  const maxSales = Math.max(1, ...salesMonths.map((month) => month.amount));
  const hasSales = salesMonths.some((month) => month.amount > 0);

  const chartPoints = salesMonths
    .map((month, index) => {
      const x = 28 + index * 64;
      const y = 130 - (month.amount / maxSales) * 105;
      return `${x},${y}`;
    })
    .join(" ");

  const chartAreaPoints = `28,140 ${chartPoints} 348,140`;

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(orderDate(b) || 0).getTime() -
            new Date(orderDate(a) || 0).getTime()
        )
        .slice(0, 5),
    [orders]
  );

  const deliveryOrders = useMemo(
    () =>
      [...orders]
        .filter((order) => {
          const status = normalise(deliveryStatus(order));
          return !["cancelled", "canceled", "refunded"].includes(status);
        })
        .sort(
          (a, b) =>
            new Date(orderDate(b) || 0).getTime() -
            new Date(orderDate(a) || 0).getTime()
        )
        .slice(0, 4),
    [orders]
  );

  const activeDeliveryCount = deliveryOrders.length;

  const categoryData = useMemo(() => {
    const definitions = [
      { name: "Marbles", key: "marble", color: "#f3c64e" },
      { name: "Construction Materials", key: "construction", color: "#b88a50" },
      { name: "Tiles & Stones", key: "tiles", color: "#58d4e8" },
      { name: "Others", key: "other", color: "#75df48" },
    ];
    return definitions.map((item) => ({
      ...item,
      count: products.filter((product) => productType(product) === item.key).length,
    }));
  }, [products]);

  const totalCategoryProducts = Math.max(products.length, 1);
  const categoryGradient = (() => {
    let current = 0;
    return categoryData
      .map((item) => {
        const start = current;
        current += (item.count / totalCategoryProducts) * 100;
        return `${item.color} ${start}% ${current}%`;
      })
      .join(", ");
  })();

  const inventoryValue = products.reduce((sum, product) => {
    const stock = getStock(product) ?? 0;
    const price = Number(
      product.selling_price ?? product.price ?? product.unit_price ?? 0
    );
    return sum + stock * price;
  }, 0);

  const metricCards = [
    {
      label: "Total Revenue",
      value: money(revenue),
      note: `${filteredOrders.length} orders in selected period`,
      icon: IndianRupee,
    },
    {
      label: "Total Orders",
      value: orders.length.toLocaleString("en-IN"),
      note: `${pendingOrders} pending / processing`,
      icon: ShoppingCart,
    },
    {
      label: "Total Customers",
      value: customers.length.toLocaleString("en-IN"),
      note: "Registered customer profiles",
      icon: Users,
    },
    {
      label: "Total Inventory",
      value: products.length.toLocaleString("en-IN"),
      note: `${activeProducts} active products`,
      icon: Package,
    },
    {
      label: "Inventory Value",
      value: money(inventoryValue),
      note: "Based on available stock and price",
      icon: Layers,
    },
    {
      label: "Low Stock Items",
      value: lowStockProducts.length.toLocaleString("en-IN"),
      note: "Items requiring attention",
      icon: AlertTriangle,
      danger: lowStockProducts.length > 0,
    },
  ];

  const quickActions = [
    { label: "Add Product", icon: Plus, path: "/admin/inventory/add" },
    { label: "Create Quotation", icon: FileText, path: "/admin/quotations" },
    { label: "New Order", icon: ShoppingCart, path: "/admin/orders" },
    { label: "Add Project", icon: HardHat, path: "/admin/projects" },
    { label: "Update Inventory", icon: Boxes, path: "/admin/inventory-movements" },
    { label: "Create Invoice", icon: Receipt, path: "/admin/receipts" },
    { label: "Schedule Delivery", icon: Truck, path: "/admin/orders" },
    { label: "Add Customer", icon: Users, path: "/admin/customers" },
  ];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const inventoryPreview = [...products]
    .sort((a, b) => (getStock(a) ?? Infinity) - (getStock(b) ?? Infinity))
    .slice(0, 4);

  return (
    <div className="ark-dashboard">
      <div className="ark-dashboard-container">
        <div className="ark-dashboard-toolbar">
          <div className="ark-dashboard-title-group">
            <span className="ark-eyebrow">ARK MARBLES &amp; CONSTRUCTION</span>
            <h2>Business Dashboard</h2>
            <p>Complete Control of Marbles, Construction &amp; Operations</p>
          </div>
          <div className="ark-dashboard-controls">
            <label className="ark-period-select">
              <CalendarDays size={16} />
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
              </select>
            </label>
            <button className="ark-button ark-button-outline" onClick={refresh} disabled={loading} type="button">
              <RefreshCw size={15} className={loading ? "ark-spin" : ""} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button className="ark-button ark-button-gold" onClick={() => exportCSV(orders, profiles, period)} type="button">
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        {error && (
          <div className="ark-dashboard-error" role="alert">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        <section className="ark-stats-grid" aria-label="Business metrics">
          {metricCards.map((item) => {
            const Icon = item.icon;
            return (
              <article className={`ark-stat-card${item.danger ? " is-danger" : ""}`} key={item.label}>
                <div className="ark-stat-icon"><Icon size={27} /></div>
                <div className="ark-stat-content">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </div>
              </article>
            );
          })}
        </section>

        <section className="ark-dashboard-main-grid ark-dashboard-main-grid-two">
          <article className="ark-panel ark-sales-panel">
            <div className="ark-panel-heading">
              <div>
                <h3><TrendingUp size={19} /> Sales &amp; Revenue Analytics</h3>
                <p>Monthly revenue from paid orders</p>
              </div>
              <span className="ark-panel-tag">LAST 6 MONTHS</span>
            </div>
            <div className="ark-sales-summary">
              <strong>{money(revenue)}</strong>
              <span>{filteredOrders.filter((order) => isPaid(order) && !isCancelled(order)).length ? "Paid revenue in selected period" : "No paid orders in selected period"}</span>
            </div>
            <div className={`ark-sales-chart${hasSales ? "" : " is-empty"}`}>
              <div className="ark-chart-y-labels">
                <span>₹{money(maxSales).replace("₹", "")}</span>
                <span>₹{money(maxSales * 0.66).replace("₹", "")}</span>
                <span>₹{money(maxSales * 0.33).replace("₹", "")}</span>
                <span>₹0</span>
              </div>
              <div className="ark-chart-plot">
                <div className="ark-chart-grid">
                  {[0, 1, 2, 3].map((line) => <span key={line} />)}
                </div>
                {hasSales ? (
                  <svg className="ark-sales-svg" viewBox="0 0 380 160" preserveAspectRatio="none" role="img" aria-label="Monthly paid revenue line chart">
                    <defs>
                      <linearGradient id="arkSalesFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f5bd4c" stopOpacity=".72" />
                        <stop offset="100%" stopColor="#f5bd4c" stopOpacity=".04" />
                      </linearGradient>
                    </defs>
                    <polygon points={chartAreaPoints} fill="url(#arkSalesFill)" />
                    <polyline points={chartPoints} fill="none" stroke="#ffd477" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {salesMonths.map((month, index) => {
                      const x = 28 + index * 64;
                      const y = 130 - (month.amount / maxSales) * 105;
                      return <circle key={month.label} cx={x} cy={y} r="4" fill="#fff2c7" stroke="#e8a632" strokeWidth="2" />;
                    })}
                  </svg>
                ) : (
                  <div className="ark-chart-empty">
                    <TrendingUp size={25} />
                    <strong>No sales data available yet</strong>
                    <span>Paid order revenue will appear here when completed payments are recorded.</span>
                  </div>
                )}
                <div className="ark-chart-months">
                  {salesMonths.map((month) => <span key={month.label}>{month.label}</span>)}
                </div>
              </div>
            </div>
          </article>

          <article className="ark-panel ark-distribution-panel">
            <div className="ark-panel-heading">
              <div>
                <h3><Layers size={19} /> Category Wise Products</h3>
                <p>Current product catalogue</p>
              </div>
            </div>
            <div className="ark-distribution-content">
              <div className="ark-donut" style={{ background: `conic-gradient(${categoryGradient})` }}>
                <div className="ark-donut-center">
                  <strong>{products.length}</strong>
                  <span>Total Items</span>
                </div>
              </div>
              <div className="ark-category-legend">
                {categoryData.map((item) => (
                  <div key={item.name}>
                    <span className="ark-legend-dot" style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <strong>{Math.round((item.count / totalCategoryProducts) * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="ark-dashboard-secondary-grid">
          <article className="ark-panel ark-quick-panel">
            <div className="ark-panel-heading">
              <div>
                <h3><Plus size={19} /> Quick Actions</h3>
                <p>Frequently used business operations</p>
              </div>
            </div>
            <div className="ark-quick-grid">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button type="button" className="ark-quick-action" key={action.label} onClick={() => navigate(action.path)}>
                    <Icon size={25} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="ark-panel ark-delivery-panel">
            <div className="ark-panel-heading">
              <div>
                <h3><Truck size={19} /> Delivery Updates</h3>
                <p>Latest order dispatch and delivery statuses</p>
              </div>
              <Link to="/admin/orders" className="ark-view-link">View All <ArrowRight size={14} /></Link>
            </div>
            {deliveryOrders.length ? (
              <div className="ark-delivery-list">
                {deliveryOrders.map((order, index) => {
                  const image = orderProductImage(order);
                  const status = deliveryStatus(order);
                  return (
                    <div className="ark-delivery-row" key={order.id || index}>
                      <div className="ark-delivery-thumb">
                        {image ? <img src={image} alt={orderProductName(order)} /> : <Package size={19} />}
                      </div>
                      <strong className="ark-delivery-id">{order.order_number || order.id || "—"}</strong>
                      <span className="ark-delivery-product">{orderProductName(order)}</span>
                      <span className="ark-delivery-quantity">{orderQuantity(order)}</span>
                      <span className={`ark-delivery-status delivery-${deliveryStatusClass(status)}`}>{status}</span>
                      <span className="ark-delivery-date">{dateText(order.expected_delivery_date || order.delivery_date || orderDate(order))}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ark-empty-state ark-delivery-empty">
                <Truck size={25} />
                <strong>No delivery updates yet</strong>
                <span>Delivery information will appear when customer orders are available.</span>
              </div>
            )}
          </article>
        </section>

        <section className="ark-dashboard-bottom">
          <article className="ark-panel ark-recent-panel">
            <div className="ark-panel-heading">
              <div><h3><ShoppingCart size={19} /> Recent Orders</h3><p>Latest customer orders</p></div>
              <Link to="/admin/orders" className="ark-view-link">View All <ArrowRight size={14} /></Link>
            </div>
            {recentOrders.length ? (
              <div className="ark-table-scroll">
                <table className="ark-orders-table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Type</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, index) => (
                      <tr key={order.id || index}>
                        <td>{order.order_number || order.id || "—"}</td>
                        <td>{customerName(order, profiles)}</td>
                        <td>{orderType(order)}</td>
                        <td>{money(orderAmount(order))}</td>
                        <td><span className={`ark-order-status status-${statusClass(order.status)}`}>{order.status || "Pending"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ark-empty-state ark-orders-empty">
                <ShoppingCart size={25} />
                <strong>No orders found</strong>
                <span>Customer orders will appear here after they are placed.</span>
                <Link to="/admin/orders" className="ark-empty-action">Open Orders <ArrowRight size={13} /></Link>
              </div>
            )}
          </article>

          <article className="ark-panel ark-projects-panel">
            <div className="ark-panel-heading">
              <div><h3><HardHat size={19} /> Ongoing Construction Projects</h3><p>Project progress and execution</p></div>
              <Link to="/admin/projects" className="ark-view-link">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="ark-empty-state ark-projects-empty">
              <Building2 size={27} />
              <strong>Project tracking is not connected yet</strong>
              <span>This panel is ready for project records. Connect a projects table to show live progress and completion percentages.</span>
              <Link to="/admin/projects" className="ark-empty-action">Open Projects <ArrowRight size={13} /></Link>
            </div>
          </article>

          <article className="ark-panel ark-inventory-panel">
            <div className="ark-panel-heading">
              <div><h3><Boxes size={19} /> Inventory Status</h3><p>Current stock overview</p></div>
              <Link to="/admin/inventory" className="ark-view-link">View All <ArrowRight size={14} /></Link>
            </div>
            {inventoryPreview.length ? (
              <div className="ark-inventory-list">
                {inventoryPreview.map((product) => {
                  const stock = getStock(product);
                  const low = stock !== null && stock <= Number(product.low_stock_threshold ?? 10);
                  return (
                    <div className="ark-inventory-row" key={product.id}>
                      <div className="ark-inventory-thumb">
                        {product.image_url ? <img src={product.image_url} alt={product.name || "Product"} /> : <Gem size={19} />}
                      </div>
                      <span className="ark-inventory-name">{product.name || "Unnamed product"}</span>
                      <span className="ark-inventory-stock">{stock === null ? "—" : `${stock} ${stockUnit(product)}`}</span>
                      <span className={`ark-stock-badge ${low ? "low" : stock === null ? "unknown" : "in-stock"}`}>
                        {stock === null ? "Not Set" : low ? "Low Stock" : "In Stock"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ark-empty-state">
                <Package size={25} />
                <strong>No products available</strong>
                <span>Add products to view inventory status.</span>
              </div>
            )}
          </article>
        </section>

        <footer className="ark-dashboard-footer">
          <strong>ARK MARBLES &amp; CONSTRUCTION</strong>
          <span>{today}</span>
          <span>{loading ? "Updating dashboard..." : "Live business data"}</span>
        </footer>
      </div>
    </div>
  );
}

