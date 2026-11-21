import { Suspense, useEffect, useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "@/data/store";

const NAV = [
  { to: "/features", label: "Features" },
  { to: "/solutions", label: "Solutions" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useStore();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-warm-100">
      <header className="sticky top-0 z-40 border-b border-warm-300/70 bg-warm-100/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" aria-label="DwellMender home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => cn("rounded-md px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-warm-200", isActive && "bg-warm-200 text-navy-900")}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Button asChild>
                <Link to="/app">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Start free trial</Link>
                </Button>
              </>
            )}
          </div>
          <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t bg-warm-100 lg:hidden">
            <div className="container flex flex-col gap-1 py-3">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-warm-200">
                  {n.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link to="/register">Start free trial</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Suspense fallback={<div className="container py-16"><PageSkeleton /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const cols = [
    { title: "Product", links: [["Features", "/features"], ["How it works", "/how-it-works"], ["Pricing", "/pricing"], ["Live demo", "/login"]] },
    { title: "Solutions", links: [["Residential lettings", "/solutions#residential"], ["Student accommodation", "/solutions#student"], ["Commercial facilities", "/solutions#commercial"], ["Supported living", "/solutions#supported"]] },
    { title: "Company", links: [["About", "/about"], ["Contact", "/contact"], ["Security & AWS", "/features#security"]] },
  ];
  return (
    <footer className="bg-navy-950 text-navy-100">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-navy-200">Find recurring property problems sooner. Maintenance intelligence for property managers, accommodation operators and facilities teams.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-sans text-sm font-semibold text-white">{c.title}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-navy-200 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-5 text-xs text-navy-300 sm:flex-row sm:justify-between">
          <span>© 2026 DwellMender. Founded by Ifeoma Eze & Babatunde Salami.</span>
          <span>Product demo — all properties, tenants and contractors shown are fictional.</span>
        </div>
      </div>
    </footer>
  );
}
