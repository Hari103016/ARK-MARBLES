
import { Navigate, Route, Routes } from "react-router-dom";

// STORE PAGES
import Home from "../pages/store/Home.jsx";
import Marbles from "../pages/store/Marbles.jsx";
import MarbleDetails from "../pages/store/MarbleDetails.jsx";
import Construction from "../pages/store/Construction.jsx";
import ConstructionDetails from "../pages/store/ConstructionDetails.jsx";
import Projects from "../pages/store/Projects.jsx";
import Brands from "../pages/store/Brands.jsx";
import Contact from "../pages/store/Contact.jsx";

// AUTHENTICATION
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import Logout from "../pages/auth/Logout.jsx";

// CART AND CHECKOUT
import Cart from "../pages/store/StoreCart.jsx";
import Checkout from "../pages/checkout/Checkout.jsx";
import Payment from "../pages/checkout/Payment.jsx";
import OrderConfirmation from "../pages/checkout/OrderConfirmation.jsx";

// CUSTOMER ACCOUNT
import CustomerDashboard from "../pages/customer/CustomerDashboard.jsx";
import Profile from "../pages/customer/CustomerProfile.jsx";
import Addresses from "../pages/customer/CustomerAddresses.jsx";
import Wishlist from "../pages/customer/Wishlist.jsx";
import MyOrders from "../pages/customer/MyOrders.jsx";
import CustomerOrderDetails from "../pages/customer/OrderDetails.jsx";
import MyEnquiries from "../pages/customer/MyEnquiries.jsx";

// ADMIN PAGES
import Dashboard from "../pages/admin/Dashboard.jsx";
import Inventory from "../pages/admin/Inventory.jsx";
import AddMarble from "../pages/admin/AddMarble.jsx";
import EditMarble from "../pages/admin/EditMarble.jsx";
import AdminCategories from "../pages/admin/Categories.jsx";
import Customers from "../pages/admin/Customers.jsx";
import CustomerDetails from "../pages/admin/CustomerDetails.jsx";
import Orders from "../pages/admin/Orders.jsx";
import AdminOrderDetails from "../pages/admin/OrderDetails.jsx";
import Enquiries from "../pages/admin/Enquiries.jsx";
import Payments from "../pages/admin/Payments.jsx";
import Receipts from "../pages/admin/Receipts.jsx";
import Quotations from "../pages/admin/Quotations.jsx";
import Reports from "../pages/admin/Reports.jsx";
import Staff from "../pages/admin/Staff.jsx";
import Settings from "../pages/admin/Settings.jsx";
import ActivityLogs from "../pages/admin/ActivityLogs.jsx";
import InventoryMovements from "../pages/admin/InventoryMovements.jsx";
import RecycleBin from "../pages/admin/RecycleBin.jsx";

// LAYOUTS
import StoreLayout from "../layouts/StoreLayout.jsx";
import AccountLayout from "../layouts/AccountLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

// ROUTE GUARDS
import ProtectedRoute from "../guards/ProtectedRoute.jsx";
import RoleRoute from "../guards/RoleRoute.jsx";

export default function AppRoutes() {
  return (
    <Routes>

      {/* AUTHENTICATION */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/logout" element={<Logout />} />

      {/* PUBLIC STORE */}
      <Route element={<StoreLayout />}>

        <Route index element={<Home />} />

        {/* MARBLE PRODUCTS */}
        <Route path="marbles" element={<Marbles />} />
        <Route path="products" element={<Marbles />} />
        <Route path="marbles/:id" element={<MarbleDetails />} />
        <Route path="products/:id" element={<MarbleDetails />} />

        {/* CONSTRUCTION MATERIALS */}
        <Route path="construction" element={<Construction />} />
        <Route
          path="construction/:id"
          element={<ConstructionDetails />}
        />

        {/* CATEGORY REDIRECT */}
        <Route
          path="categories"
          element={<Navigate to="/construction" replace />}
        />

        {/* PROJECTS */}
        <Route path="gallery" element={<Projects />} />

        {/* BRANDS */}
        <Route path="brands" element={<Brands />} />

        {/* CONTACT */}
        <Route path="contact" element={<Contact />} />

        {/* CART */}
        <Route path="cart" element={<Cart />} />

        {/* CHECKOUT */}
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="order-confirmation"
          element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />

      </Route>

      {/* CUSTOMER ACCOUNT */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="orders" element={<MyOrders />} />

        <Route
          path="orders/:id"
          element={<CustomerOrderDetails />}
        />

        <Route path="enquiries" element={<MyEnquiries />} />
      </Route>

      {/* ADMIN PANEL */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* INVENTORY */}
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/add" element={<AddMarble />} />
        <Route path="inventory/edit/:id" element={<EditMarble />} />

        <Route
          path="inventory-movements"
          element={<InventoryMovements />}
        />

        {/* CATEGORIES */}
        <Route path="categories" element={<AdminCategories />} />

        {/* CUSTOMERS */}
        <Route path="customers" element={<Customers />} />

        <Route
          path="customers/:id"
          element={<CustomerDetails />}
        />

        {/* ORDERS */}
        <Route path="orders" element={<Orders />} />

        <Route
          path="orders/:id"
          element={<AdminOrderDetails />}
        />

        {/* BUSINESS MANAGEMENT */}
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="payments" element={<Payments />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="quotations" element={<Quotations />} />

        {/* ADMINISTRATION */}
        <Route path="reports" element={<Reports />} />
        <Route path="staff" element={<Staff />} />
        <Route path="settings" element={<Settings />} />
        <Route path="activity-logs" element={<ActivityLogs />} />

        {/* RECYCLE BIN */}
        <Route path="recycle-bin" element={<RecycleBin />} />

      </Route>

      {/* UNKNOWN ADMIN URLS */}
      <Route
        path="/admin/*"
        element={<Navigate to="/admin" replace />}
      />

      {/* UNKNOWN URLS */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
