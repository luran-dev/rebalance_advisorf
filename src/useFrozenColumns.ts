import { useLayoutEffect, useState, type RefObject } from "react";

export function useFrozenColumns(containerRef: RefObject<HTMLDivElement | null>, requestedCount: number) {
  const [offsets, setOffsets] = useState<readonly number[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const headers = Array.from(container.querySelectorAll<HTMLTableCellElement>("thead th"));
    const measure = () => {
      const managementWidth = headers.at(-1)?.getBoundingClientRect().width ?? 0;
      const available = Math.max(0, container.clientWidth - managementWidth - 160);
      const next: number[] = [];
      let left = 0;
      for (const header of headers.slice(0, requestedCount)) {
        const width = header.getBoundingClientRect().width;
        if (left + width > available) break;
        next.push(left);
        left += width;
      }
      container.style.setProperty("--frozen-width", `${left}px`);
      setOffsets((previous) => previous.length === next.length && previous.every((value, index) => value === next[index]) ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    headers.forEach((header) => observer.observe(header));
    return () => observer.disconnect();
  }, [containerRef, requestedCount]);

  return offsets;
}
