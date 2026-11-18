import { Outlet } from "react-router-dom";
import Navbar from "../components/common/store/Navbar";
import Footer from "../components/common/store/Footer";

export default function StoreLayout() {
  return (
    <div className="store-layout">
      <Navbar />
      <main className="store-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}