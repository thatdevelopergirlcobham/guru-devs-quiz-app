import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { LucideIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  className?: string;
}

export function Sidebar({ items, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={cn(
        collapsed ? "w-20" : "w-64",
        "min-h-screen bg-sidebar border-r border-sidebar-border p-6 transition-all duration-200",
        className
      )}
    >
      <div className={cn("flex items-center justify-between mb-8", collapsed && "justify-center") }>
        {!collapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Guru Devs
          </h1>
        )}
        <button
          aria-label="Toggle sidebar"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center"
            )}
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
