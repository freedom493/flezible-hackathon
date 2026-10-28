/**
 * Formats integer kobo as Naira (₦) with thousands separators.
 * @param {number|bigint} kobo - Amount in kobo
 * @returns {string} Formatted Naira string, e.g. ₦1,500
 */
export function formatNaira(kobo) {
  if (kobo === null || kobo === undefined || isNaN(Number(kobo))) {
    return '₦0'
  }
  const naira = Number(kobo) / 100
  return '₦' + naira.toLocaleString('en-NG', {
    minimumFractionDigits: naira % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
