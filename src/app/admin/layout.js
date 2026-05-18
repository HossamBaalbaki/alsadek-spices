"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

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
    { href: "/admin/delivery-settings", icon: "🚚", label: "Delivery" },
    { href: "/admin/settings",          icon: "⚙️", label: "Settings" },
    { href: "/admin/categories",        icon: "🏷️", label: "Categories" },
    { href: "/admin/customers",         icon: "👥", label: "Customers" },
    { href: "/admin/promo-codes",       icon: "🎟️", label: "Promo Codes" },
    { href: "/admin/reports",           icon: "📈", label: "Reports" },
    { href: "/admin/credentials",       icon: "🔐", label: "Credentials" },
  ];

  return (
    <div className="min-h-screen bg-stone-100">

      {/* ─── BACKDROP (shown when sidebar open) ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR — fixed, never in document flow ─────────────────────────── */}
      {/*
        Width transitions between w-16 (icon-only) and w-64 (full).
        Because it is position:fixed, this width change has ZERO effect on
        the main content layout — no reflow, no flicker.
      */}
      <aside className={`
        fixed left-0 top-0 h-screen z-50 bg-stone-900 flex flex-col
        overflow-hidden transition-[width] duration-300 ease-in-out
        ${sidebarOpen ? "w-64" : "w-0 lg:w-16"}
      `}>

        {/* Logo */}
        <div className="p-4 border-b border-stone-700 flex items-center gap-3 flex-shrink-0 min-w-[16rem]">
          <span className="text-2xl flex-shrink-0">🌶️</span>
          <div className="overflow-hidden">
            <p className="text-white font-black text-sm whitespace-nowrap">Al Sadeq</p>
            <p className="text-stone-400 text-xs whitespace-nowrap">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden min-w-[16rem]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                pathname.startsWith(item.href)
                  ? "bg-amber-700 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User + Logout — always pinned to bottom */}
        <div className="p-3 border-t border-stone-700 flex-shrink-0 min-w-[16rem]">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {admin.name?.charAt(0) || "A"}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-white text-xs font-semibold truncate whitespace-nowrap">{admin.name}</p>
              <p className="text-stone-400 text-xs truncate whitespace-nowrap">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-all w-full whitespace-nowrap"
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────── */}
      {/*
        ml-0 on mobile (sidebar is fully hidden when closed).
        lg:ml-16 on desktop (always offset by icon-rail width — NEVER CHANGES).
        No transition here = no reflow = no flicker when sidebar toggles.
      */}
      <div className="ml-0 lg:ml-16 flex flex-col min-h-screen">

        {/* Top Bar */}
        <header className="bg-white border-b border-stone-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Toggle sidebar"
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
        <main className="flex-1 p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
