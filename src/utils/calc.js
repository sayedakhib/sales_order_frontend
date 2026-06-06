//grand total calculations
export const round = (v, d = 3) => {
  const f = 10 ** d;
  return Math.round((Number(v) + Number.EPSILON) * f) / f;
};

export const calcFoc = (qty, buyQty, freeQty) =>
  buyQty > 0 && freeQty > 0 ? Math.floor(qty / buyQty) * freeQty : 0;

export function computeLine(item) {
  const gross = round(item.rate * item.quantity);
  const discountAmount = round(gross * ((item.discountPercentage || 0) / 100));
  const lineTotal = round(gross - discountAmount);
  return { grossAmount: gross, discountAmount, lineTotal };
}

export function computeTotals(lines, vatPercent) {
  const subtotal = round(lines.reduce((s, l) => s + l.rate * l.quantity, 0));
  const totalDiscount = round(
    lines.reduce((s, l) => s + l.rate * l.quantity * ((l.discountPercentage || 0) / 100), 0)
  );
  const totalFoc = lines.reduce((s, l) => s + (l.focQuantity || 0), 0);
  const netAmount = round(subtotal - totalDiscount);
  const vatAmount = round(netAmount * ((vatPercent || 0) / 100));
  const grandTotal = round(netAmount + vatAmount);
  return { subtotal, totalDiscount, totalFoc, netAmount, vatAmount, grandTotal };
}
