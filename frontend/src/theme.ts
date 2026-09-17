export type AccentKey = "slate" | "indigo" | "emerald" | "rose" | "amber" | "blue";
export type Density = "comfortable" | "compact";

export const accents: Record<AccentKey, { label: string; swatch: string; btn: string; btnSoft: string; solid: string }> = {
  slate: { label: "Graphite", swatch: "#111827", btn: "bg-slate-900 hover:bg-slate-700", btnSoft: "bg-slate-900", solid: "#111827" },
  indigo: { label: "Indigo", swatch: "#4f46e5", btn: "bg-indigo-600 hover:bg-indigo-500", btnSoft: "bg-indigo-600", solid: "#4f46e5" },
  emerald: { label: "Emerald", swatch: "#059669", btn: "bg-emerald-600 hover:bg-emerald-500", btnSoft: "bg-emerald-600", solid: "#059669" },
  rose: { label: "Rose", swatch: "#e11d48", btn: "bg-rose-600 hover:bg-rose-500", btnSoft: "bg-rose-600", solid: "#e11d48" },
  amber: { label: "Amber", swatch: "#b45309", btn: "bg-amber-600 hover:bg-amber-500", btnSoft: "bg-amber-600", solid: "#b45309" },
  blue: { label: "Ocean", swatch: "#2563eb", btn: "bg-blue-600 hover:bg-blue-500", btnSoft: "bg-blue-600", solid: "#2563eb" },
};

export function load<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
