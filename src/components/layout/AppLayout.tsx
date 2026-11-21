import { Suspense, useEffect, useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Building,
  ClipboardList,
  Copy,
  FileText,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Repeat,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, Input } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays";
import { useStore } from "@/data/store";
import { cn, initials } from "@/lib/utils";

export function AppLayout() {
  const store = useStore();
  const { user, duplicates, recurring, requests } = store;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => setMobileOpen(false), [pathname]);

  if (!user) return <Navigate to="/login" replace state={{ from: pathname }} />;

  const pendingDupes = duplicates.filter((d) => d.status === "pending").length;
  const pendingClass = requests.filter((r) => r.ai?.reviewed === "pending").length;
  const critical = recurring.filter((r) => r.riskLevel !== "Moderate").length;

  const groups = [
    {
      label: "Operations",
      items: [
        { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/app/properties", label: "Properties", icon: Building },
        { to: "/app/requests", label: "Maintenance requests", icon: ClipboardList },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { to: "/app/classification", label: "AI classification", icon: Sparkles, badge: pendingClass },
        { to: "/app/duplicates", label: "Duplicate detection", icon: Copy, badge: pendingDupes },
        { to: "/app/recurring", label: "Recurring issues", icon: Repeat, badge: critical, badgeTone: "amber" },
        { to: "/app/briefs", label: "Contractor briefs", icon: FileText },
      ],
    },
    {
      label: "Manage",
      items: [
        { to: "/app/contractors", label: "Contractors", icon: HardHat },
        { to: "/app/reports", label: "Reports & analytics", icon: BarChart3 },
        { to: "/app/settings", label: "Settings & AWS", icon: Settings },
      ],
    },
  ];

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-navy-100">
      <div className="flex h-16 items-center px-5">
        <Link to="/app">
          <Logo light />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2 scrollbar-thin">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={"end" in it ? it.end : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-navy-200 transition hover:bg-white/5 hover:text-white",
                      isActive && "bg-white/10 text-white"
                    )
                  }
                >
                  <it.icon className="h-4 w-4" />
                  <span className="flex-1">{it.label}</span>
                  {"badge" in it && it.badge ? (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", "badgeTone" in it && it.badgeTone === "amber" ? "bg-amber-400 text-navy-950" : "bg-sage-500 text-white")}>
                      {it.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-navy-200">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Demo workspace
        </div>
        <p className="mt-1">AI features are simulated and clearly labelled. Data is fictional and stored in your browser.</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
          <button className="absolute right-4 top-4 text-white" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X />
          </button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <form
            className="relative hidden max-w-md flex-1 md:block"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/app/requests?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requests, units, references…" className="pl-9" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => navigate("/app/requests/new")}>
              <Plus /> <span className="hidden sm:inline">New request</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {pendingDupes + critical > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/duplicates")}>
                  <Copy className="text-violet-600" /> {pendingDupes} duplicate suggestions awaiting review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/recurring")}>
                  <Repeat className="text-amber-600" /> {critical} high-risk recurring issues
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/classification")}>
                  <Sparkles className="text-sage-600" /> {pendingClass} classifications to confirm
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-secondary">
                <Avatar>
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left text-xs leading-tight sm:block">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-muted-foreground">{user.organisation}</div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/settings")}>
                  <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <Building /> Public website
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    store.signOut();
                    navigate("/login");
                  }}
                >
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
