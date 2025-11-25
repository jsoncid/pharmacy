export function formatPeso(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const num = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(num)) {
    return "-";
  }

  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `₱${formatted}`;
}
