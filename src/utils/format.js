export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name = "") {
  return name.split(/\s+/).map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function formatCurrency(inLakhs) {
  if (inLakhs >= 100) return `₹${(inLakhs / 100).toFixed(2)} Cr`;
  return `₹${inLakhs.toFixed(1)} L`;
}
