import { useMemo, useState } from "react";
import type { Project, Task } from "../types";

export function useSearchFilter<T extends Project | Task>(items: T[], searchKeys: (keyof T)[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        searchKeys.some((k) => String(item[k] ?? "").toLowerCase().includes(q));
      const matchesStatus =
        status === "all" || (item as { status?: string }).status === status;
      const matchesPriority =
        priority === "all" ||
        (item as { priority?: string }).priority === priority ||
        !("priority" in item);
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [items, query, status, priority, searchKeys]);

  return { query, setQuery, status, setStatus, priority, setPriority, filtered };
}
