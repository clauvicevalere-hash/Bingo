"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/recherche", label: "Recherche", icon: "search" },
  { href: "/panier", label: "Panier", icon: "cart" },
  { href: "/suivi", label: "Commandes", icon: "order" },
];

export function BottomNav() {
  const pathname = usePathname() || "/";
  return (
    <nav className="bottom-nav" aria-label="Navigation mobile">
      {items.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`bn${active ? " active" : ""}`}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Icon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (name === "home")
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
      </svg>
    );
  if (name === "search")
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  if (name === "cart")
    return (
      <svg {...common}>
        <path d="M6 7h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M8 6h11v14H8z" />
      <path d="M8 10h11M11 3h8a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
