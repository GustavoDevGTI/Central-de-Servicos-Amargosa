import type ExcelJS from "exceljs";

// Theme indices follow SpreadsheetML, not the order of nodes in clrScheme.
const themeSlots = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
const indexedReds: Record<number, string> = { 2: "FF0000", 10: "FF0000", 16: "800000", 29: "FF8080" };

/** Read the workbook's actual theme: accent2 is not red in every Excel theme. */
export function redExclusionMarker(workbook: ExcelJS.Workbook) {
  const themes = workbook.model.themes as unknown as Record<string, string> | undefined;
  const xml = Object.values(themes || {}).find((text) => text.includes("clrScheme")) || "";
  const colors = themeSlots.map((name) => {
    const block = xml.match(new RegExp(`<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}>`))?.[1];
    return block?.match(/(?:lastClr|val)=["']([0-9a-f]{6})["']/i)?.[1];
  });

  return (cell: ExcelJS.Cell): boolean => {
    const fill = cell.fill;
    if (fill?.type !== "pattern" || fill.pattern !== "solid") return false;
    const color = fill.fgColor as (Partial<ExcelJS.Color> & { tint?: number; indexed?: number }) | undefined;
    const rgb = color?.argb?.slice(-6) || (color?.theme !== undefined ? colors[color.theme] :
      color?.indexed !== undefined ? indexedReds[color.indexed] : undefined);
    if (!rgb || !/^[0-9a-f]{6}$/i.test(rgb)) return false;
    const tint = Math.max(-1, Math.min(1, color?.tint || 0));
    const [r, g, b] = [0, 2, 4].map((offset) => {
      const channel = parseInt(rgb.slice(offset, offset + 2), 16);
      return tint < 0 ? channel * (1 + tint) : channel + (255 - channel) * tint;
    });
    // Accept red shades, including the pink fill in the official legend;
    // exclude orange, purple, white and the green used for active records.
    return r >= 100 && r - g >= 20 && r - b >= 20 && Math.abs(g - b) <= (r - Math.min(g, b)) * .3;
  };
}
