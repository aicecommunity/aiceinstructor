// app/lib/format.ts
// Shared number/currency formatting helpers for the instructor app.

// Formats a raw price string as the user types it, inserting thousands
// separators ("25000" -> "25,000") while keeping any decimal part intact.
export function formatNaira(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [intPart, decPart] = cleaned.split(".");
  const commaGrouped = (intPart || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${commaGrouped}.${decPart}` : commaGrouped;
}

// Strips separators from a display string back to a plain number string
// ("25,000" -> "25000") — what goes to the backend.
export function nairaToNumber(display: string): string {
  return display.replace(/,/g, "");
}

// Formats a stored price for display ("25000" -> "₦25,000",
// "25000.50" -> "₦25,000.50"; non-NGN currencies keep "USD 25,000").
export function formatPrice(value: string | number, currency = "NGN"): string {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const [int, dec] = n.toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = dec === "00" ? grouped : `${grouped}.${dec}`;
  return currency === "NGN" ? `₦${out}` : `${currency} ${out}`;
}