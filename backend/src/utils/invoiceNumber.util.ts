/**
 * Invoice and Credit Note Number Generator Utilities
 * Formats unique, sequential, financial-year based identifiers compliant with GST regulations.
 */

/**
 * Returns the current Indian Financial Year string (e.g. "2026-27")
 */
export function getFinancialYearString(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const fullYear = date.getFullYear();
  if (month >= 3) {
    const nextYearShort = String((fullYear + 1) % 100).padStart(2, '0');
    return `${fullYear}-${nextYearShort}`;
  } else {
    const curYearShort = String(fullYear % 100).padStart(2, '0');
    return `${fullYear - 1}-${curYearShort}`;
  }
}

/**
 * Formats a sequential integer into an authentic Indian GST Tax Invoice string with financial year.
 * e.g., formatInvoiceNumber("INV-", 1001) => "INV-2026-27/001001"
 */
export function formatInvoiceNumber(
  prefix: string = 'INV-',
  sequenceNumber: number,
  date: Date = new Date(),
  padLength: number = 6
): string {
  const fy = getFinancialYearString(date);
  const cleanPrefix = (prefix || 'INV-').trim();
  const paddedNumber = String(sequenceNumber).padStart(padLength, '0');

  // If prefix already has fy or specific format, respect it
  if (cleanPrefix.includes(fy)) {
    return `${cleanPrefix}${paddedNumber}`;
  }

  // Standard GST Invoice sequence format: INV-2026-27/001001
  const basePrefix = cleanPrefix.replace(/[-/]+$/, '');
  return `${basePrefix}-${fy}/${paddedNumber}`;
}

/**
 * Formats a sequential Credit Note string (under Section 34 of CGST Act, 2017)
 * e.g., formatCreditNoteNumber(101) => "CN-2026-27/000101"
 */
export function formatCreditNoteNumber(
  sequenceNumber: number,
  date: Date = new Date(),
  padLength: number = 6
): string {
  const fy = getFinancialYearString(date);
  const paddedNumber = String(sequenceNumber).padStart(padLength, '0');
  return `CN-${fy}/${paddedNumber}`;
}

/**
 * Formats an order tracking number with date and sequence.
 * e.g., formatOrderNumber(new Date(), 1001) => "ORD-20261028-1001"
 */
export function formatOrderNumber(date: Date = new Date(), sequenceNumber: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `ORD-${year}${month}${day}-${seq}`;
}
