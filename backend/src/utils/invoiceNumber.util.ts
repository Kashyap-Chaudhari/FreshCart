/**
 * Invoice and Order Number Generator Utilities
 */

/**
 * Formats a sequential integer into a padded invoice string with prefix.
 * e.g., formatInvoiceNumber("INV-", 1001) => "INV-001001"
 */
export function formatInvoiceNumber(prefix: string = 'INV-', sequenceNumber: number, padLength: number = 6): string {
  const cleanPrefix = prefix.trim();
  const paddedNumber = String(sequenceNumber).padStart(padLength, '0');
  return `${cleanPrefix}${paddedNumber}`;
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
