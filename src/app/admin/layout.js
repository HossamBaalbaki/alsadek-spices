"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    if (!token || !user) {
      router.push("/admin/login");
      return;
    }
    setAdmin(JSON.parse(user));
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!admin) return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center">
      <div className="text-6xl animate-bounce">🌶️</div>
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };

  const navItems = [
    { href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/admin/orders", icon: "📦", label: "Orders" },
    { href: "/admin/stock", icon: "🧂", label: "Stock" },
    { href: "/admin/products", icon: "🌶️", label: "Products" },
    { href: "/admin/delivery-settings", icon: "🚚", label: "Delivery Settings" },
    { href: "/admin/settings", icon: "⚙️", label: "Settings" },
    { href: "/admin/categories", icon: "🏷️", label: "Categories" },
    { href: "/admin/customers", icon: "👥", label: "Customers" },
    { href: "/admin/promo-codes", icon: "🎟️", label: "Promo Codes" },
    { href: "/admin/reports", icon: "📈", label: "Reports" },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex">

      {/* ─── SIDEBAR ─────────────────────────── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-stone-900 min-h-screen flex flex-col transition-all duration-300 flex-shrink-0`}>

        {/* Logo */}
        <div className="p-4 border-b border-stone-700 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">🌶️</span>
          {sidebarOpen && (
            <div>
              <p className="text-white font-black text-sm">Al Sadek</p>
              <p className="text-stone-400 text-xs">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                pathname === item.href
                  ? "bg-amber-700 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="font-semibold text-sm">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-stone-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {admin.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
                <p className="text-stone-400 text-xs truncate">{admin.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-all w-full"
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {sidebarOpen && <span className="font-semibold text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-black text-stone-800 text-lg">
              {navItems.find((i) => i.href === pathname)?.label || "Admin"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="btn btn-outline btn-sm"
            >
              View Store →
            </Link>
            <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm">
              {admin.name?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}