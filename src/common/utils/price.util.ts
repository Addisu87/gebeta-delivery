export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return roundToTwo(total / values.length);
}

export function calculateDiscountedAmount(
  amount: number,
  discountPercents: number[],
): number {
  const totalDiscount = Math.min(
    100,
    discountPercents.reduce((sum, percent) => sum + Math.max(0, percent), 0),
  );
  const discounted = amount * (1 - totalDiscount / 100);
  return roundToTwo(Math.max(0, discounted));
}

  