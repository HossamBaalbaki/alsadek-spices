"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Open sidebar by default on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    if (!token || !user) { router.push("/admin/login"); return; }
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
    { href: "/admin/dashboard",         icon: "📊", label: "Dashboard" },
    { href: "/admin/orders",            icon: "📦", label: "Orders" },
    { href: "/admin/stock",             icon: "🧂", label: "Stock" },
    { href: "/admin/products",          icon: "🌶️", label: "Products" },
    { href: "/admin/delivery-settings", icon: "🚚", label: "Delivery" },
    { href: "/admin/settings",          icon: "⚙️", label: "Settings" },
    { href: "/admin/categories",        icon: "🏷️", label: "Categories" },
    { href: "/admin/customers",         icon: "👥", label: "Customers" },
    { href: "/admin/promo-codes",       icon: "🎟️", label: "Promo Codes" },
    { href: "/admin/reports",           icon: "📈", label: "Reports" },
  ];

  const showLabel = sidebarOpen && !desktopCollapsed;

  return (
    <div className="min-h-screen bg-stone-100 flex">

      {/* ─── MOBILE BACKDROP ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-stone-900 flex flex-col transition-all duration-300
        lg:static lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${desktopCollapsed ? "lg:w-16" : "lg:w-64"}
        w-64
      `}>

        {/* Logo */}
        <div className="p-4 border-b border-stone-700 flex items-center gap-3 flex-shrink-0">
          <span className="text-2xl flex-shrink-0">🌶️</span>
          {!desktopCollapsed && (
            <div className="lg:block hidden">
              <p className="text-white font-black text-sm">Al Sadek</p>
              <p className="text-stone-400 text-xs">Admin Panel</p>
            </div>
          )}
          {/* Always show on mobile */}
          <div className="lg:hidden">
            <p className="text-white font-black text-sm">Al Sadek</p>
            <p className="text-stone-400 text-xs">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-amber-700 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {/* Label: always on mobile, only when not collapsed on desktop */}
              <span className={`font-semibold text-sm ${desktopCollapsed ? "lg:hidden" : ""}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-stone-700 flex-shrink-0">
          {!desktopCollapsed && (
            <div className="lg:flex hidden items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {admin.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
                <p className="text-stone-400 text-xs truncate">{admin.email}</p>
              </div>
            </div>
          )}
          {/* Always show on mobile */}
          <div className="lg:hidden flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {admin.name?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
              <p className="text-stone-400 text-xs truncate">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-all w-full"
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            <span className={`font-semibold text-sm ${desktopCollapsed ? "lg:hidden" : ""}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="bg-white border-b border-stone-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile: hamburger to open overlay sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Desktop: collapse/expand sidebar */}
            <button
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors hidden lg:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-black text-stone-800 text-base sm:text-lg truncate">
              {navItems.find((i) => pathname.startsWith(i.href))?.label || "Admin"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" target="_blank" className="btn btn-outline btn-sm flex items-center gap-1">
              <span className="hidden sm:inline">View Store →</span>
              <svg className="sm:hidden h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {admin.name?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
