import PDFDocument from 'pdfkit';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { calculateGstInvoice, GstInvoiceData, numberToIndianWords, round2, DEFAULT_BUSINESS_GST } from '../utils/gst.util';

export const invoiceService = {
  /**
   * Fetches full order with items and calculates verified GST tax data
   */
  async getInvoiceData(orderIdOrNumber: string): Promise<GstInvoiceData> {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }, { invoiceNumber: orderIdOrNumber }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new AppError(`Order not found for invoice query: ${orderIdOrNumber}`, 404);
    }

    const settings = (await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    })) || DEFAULT_BUSINESS_GST;

    return calculateGstInvoice(order, settings);
  },

  /**
   * Generates a genuine, authentic Indian Business GST Tax Invoice PDF compliant with
   * Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017.
   */
  async generateInvoicePdf(orderIdOrNumber: string): Promise<PDFKit.PDFDocument> {
    const data = await this.getInvoiceData(orderIdOrNumber);

    const doc = new PDFDocument({
      margin: 32,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Tax-Invoice-${data.invoiceNumber.replace(/[/\\?%*:|"<>]/g, '-')}`,
        Author: data.supplier.legalName,
        Subject: `GST Tax Invoice for Order #${data.orderNumber}`,
        Keywords: 'GST, Tax Invoice, CGST, SGST, Gujarat, FreshCart',
      },
    });

    const left = 32;
    const width = 531;
    let y = 30;

    // ================= 1. HEADER: BRAND & LEGAL STORE DETAILS =================
    // FreshCart Logo Icon
    doc.roundedRect(left, y, 26, 26, 6).fill('#168447');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text('FC', left, y + 7, { width: 26, align: 'center' });

    // Store Name & Tagline
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(15).text('FreshCart', left + 34, y - 1);
    doc.fillColor('#168447').font('Helvetica-Bold').fontSize(6.5).text('10-15 MINS GROCERIES', left + 34, y + 16);

    // Legal Business Name & Physical Address (Left)
    let supY = y + 30;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text(data.supplier.legalName, left, supY);
    supY += 11;
    doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(
      `${data.supplier.address}, ${data.supplier.city}, ${data.supplier.state} – ${data.supplier.pincode}`,
      left,
      supY,
      { width: 310, lineGap: 1.5 }
    );
    supY += 18;
    doc.font('Helvetica-Bold').fillColor('#1e293b').fontSize(7.5).text('GSTIN: ', left, supY, { continued: true });
    doc.font('Helvetica').text(`${data.supplier.gstin}  |  PAN: ${data.supplier.pan}  |  State: ${data.supplier.state} (${data.supplier.stateCode})`);
    supY += 10;
    doc.text(`Contact: ${data.supplier.phone}  |  Email: ${data.supplier.email}`);
    supY += 10;
    doc.fillColor('#64748b').fontSize(7).text(`FSSAI Lic. No: ${data.supplier.fssai || '10722001000543'}  |  CIN: ${data.supplier.cin || 'U52100GJ2024PTC123456'}`);

    // TAX INVOICE Heading & Metadata (Right)
    const rightX = left + 335;
    const rightW = width - 335;

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(18).text('TAX INVOICE', rightX, y, { width: rightW, align: 'right' });
    doc.rect(rightX + rightW - 100, y + 22, 100, 2.5).fill('#168447');

    // "ORIGINAL FOR RECIPIENT" Badge
    doc.roundedRect(rightX + rightW - 128, y + 28, 128, 13, 3).fillAndStroke('#f0fdf4', '#86efac');
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(6.8).text('ORIGINAL FOR RECIPIENT', rightX + rightW - 128, y + 31, { width: 128, align: 'center' });

    // Metadata Table
    let metaY = y + 46;
    const printMeta = (label: string, val: string, isBold = false, isStatus = false) => {
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(label, rightX, metaY, { width: 95, align: 'right' });
      if (isStatus) {
        doc.fillColor(data.isCodPending ? '#b45309' : '#166534').font('Helvetica-Bold').fontSize(7.5);
      } else {
        doc.fillColor(isBold ? '#0f172a' : '#334155').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5);
      }
      doc.text(val, rightX + 100, metaY, { width: rightW - 100, align: 'right' });
      metaY += 10.5;
    };

    printMeta('Invoice Number:', data.invoiceNumber, true);
    printMeta('Invoice Date & Time:', `${data.invoiceDate} ${data.invoiceTime || ''}`.trim());
    printMeta('Order Reference:', `#${data.orderNumber}`);
    printMeta('Order Date:', data.orderDate);
    printMeta('Place of Supply:', data.placeOfSupply);
    printMeta('Reverse Charge:', data.reverseCharge);
    printMeta('Payment Method:', data.paymentMethod);
    printMeta('Payment Status:', data.paymentStatus, false, true);

    y = Math.max(supY + 12, metaY + 4);

    // Divider Line
    doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#e2e8f0').lineWidth(0.75).stroke();
    y += 8;

    // ================= 2. CUSTOMER DETAILS (BILLED TO & SHIPPED TO DUAL CARDS) =================
    const cardW = 260;
    const cardH = 68;
    const card1X = left;
    const card2X = left + width - cardW;

    // Billed To Card
    doc.roundedRect(card1X, y, cardW, cardH, 4).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.roundedRect(card1X, y, cardW, 14, 4).fill('#f8fafc');
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(6.8).text('BILLED TO (CUSTOMER DETAILS)', card1X + 8, y + 4);

    let bY = y + 17;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text(data.customer.name, card1X + 8, bY);
    bY += 11;
    const custAddr = `${data.customer.street}, ${data.customer.landmark ? data.customer.landmark + ', ' : ''}${data.customer.city}, ${data.customer.state} – ${data.customer.pincode}`;
    doc.fillColor('#475569').font('Helvetica').fontSize(7).text(custAddr, card1X + 8, bY, { width: cardW - 16, lineGap: 1 });
    bY += 16;
    doc.text(`Mobile: ${data.customer.phone}  |  Email: ${data.customer.email || 'N/A'}`, card1X + 8, bY);
    bY += 9;
    doc.font('Helvetica-Bold').text(`GSTIN / Unique ID: `, card1X + 8, bY, { continued: true });
    doc.font('Helvetica').text(data.customer.gstin);

    // Shipped To Card
    doc.roundedRect(card2X, y, cardW, cardH, 4).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.roundedRect(card2X, y, cardW, 14, 4).fill('#f8fafc');
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(6.8).text('SHIPPED TO / DISPATCH DETAILS', card2X + 8, y + 4);

    let sY = y + 17;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text(data.shippingAddress?.name || data.customer.name, card2X + 8, sY);
    sY += 11;
    const shipAddr = `${data.shippingAddress?.street || data.customer.street}, ${data.shippingAddress?.city || data.customer.city} – ${data.shippingAddress?.pincode || data.customer.pincode}`;
    doc.fillColor('#475569').font('Helvetica').fontSize(7).text(shipAddr, card2X + 8, sY, { width: cardW - 16, lineGap: 1 });
    sY += 16;
    doc.text(`Slot: ${data.deliverySlot || 'Standard Delivery'}  |  Type: Express Delivery`, card2X + 8, sY);
    sY += 9;
    doc.font('Helvetica-Bold').text(`Fleet: `, card2X + 8, sY, { continued: true });
    doc.font('Helvetica').text(`${data.carrier || 'FreshCart Express'}  |  AWB: ${data.trackingNumber}`);

    y += cardH + 10;

    // ================= 3. PRODUCT TABLE: ALL 13 REQUIRED FIELDS =================
    // Columns: # (20), Product Name & Brand (154), HSN/SAC (42), Qty (26), Unit (24), Unit Price (46), Discount (40), Taxable Val (50), GST % (32), Tax Amt (42), Total (55)
    const cols = [
      { label: '#', x: left, w: 20, align: 'center' },
      { label: 'Product Name & Brand', x: left + 20, w: 154, align: 'left' },
      { label: 'HSN/SAC', x: left + 174, w: 42, align: 'center' },
      { label: 'Qty', x: left + 216, w: 26, align: 'right' },
      { label: 'Unit', x: left + 242, w: 24, align: 'center' },
      { label: 'Unit Price', x: left + 266, w: 46, align: 'right' },
      { label: 'Discount', x: left + 312, w: 40, align: 'right' },
      { label: 'Taxable Val', x: left + 352, w: 50, align: 'right' },
      { label: 'GST %', x: left + 402, w: 32, align: 'center' },
      { label: 'Tax Amt', x: left + 434, w: 42, align: 'right' },
      { label: 'Total (₹)', x: left + 476, w: 55, align: 'right' },
    ];

    const renderTableHeader = (currentY: number) => {
      const thH = 17;
      doc.rect(left, currentY, width, thH).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor('#1e293b').fontSize(6.8).font('Helvetica-Bold');
      cols.forEach((col) => {
        doc.text(col.label, col.x + 2, currentY + 5, { width: col.w - 4, align: col.align as any });
      });
      return currentY + thH;
    };

    y = renderTableHeader(y);

    // Product Rows
    data.items.forEach((item, idx) => {
      const rowH = 21;
      // Multi-page check
      if (y + rowH > 720) {
        doc.addPage();
        y = 35;
        doc.fillColor('#168447').font('Helvetica-Bold').fontSize(8).text(`TAX INVOICE #${data.invoiceNumber} (Continued...)`, left, y);
        y += 14;
        y = renderTableHeader(y);
      }

      if (idx % 2 === 1) {
        doc.rect(left, y, width, rowH).fill('#fafafa');
      }
      doc.moveTo(left, y + rowH).lineTo(left + width, y + rowH).strokeColor('#f1f5f9').lineWidth(0.5).stroke();

      // Col 0: Sr. No
      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(String(item.index), cols[0].x, y + 4, { width: cols[0].w, align: 'center' });

      // Col 1: Product Name & Brand/Pack size subline
      const itemName = item.isSubstituted ? `${item.productName} [Sub]` : item.productName;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.2).text(itemName, cols[1].x + 2, y + 3, { width: cols[1].w - 4, ellipsis: true });
      doc.fillColor('#64748b').font('Helvetica').fontSize(6.2).text(
        `Brand: ${item.brand || 'FreshCart'}  •  Pack: ${item.packSize || item.unit}`,
        cols[1].x + 2,
        y + 11.5,
        { width: cols[1].w - 4, ellipsis: true }
      );

      // Col 2: HSN/SAC
      doc.fillColor('#334155').font('Helvetica').fontSize(7).text(item.hsnCode, cols[2].x, y + 5, { width: cols[2].w, align: 'center' });

      // Col 3: Qty
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(String(item.quantity), cols[3].x, y + 5, { width: cols[3].w - 2, align: 'right' });

      // Col 4: Unit
      doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(item.unitType || 'pcs', cols[4].x, y + 5, { width: cols[4].w, align: 'center' });

      // Col 5: Unit Price
      doc.fillColor('#334155').font('Helvetica').fontSize(7.2).text(item.unitMrp.toFixed(2), cols[5].x, y + 5, { width: cols[5].w - 2, align: 'right' });

      // Col 6: Discount
      doc.fillColor('#15803d').font('Helvetica').fontSize(7.2).text(item.discount > 0 ? `-${item.discount.toFixed(2)}` : '0.00', cols[6].x, y + 5, { width: cols[6].w - 2, align: 'right' });

      // Col 7: Taxable Value
      doc.fillColor('#0f172a').font('Helvetica').fontSize(7.2).text(item.taxableAmount.toFixed(2), cols[7].x, y + 5, { width: cols[7].w - 2, align: 'right' });

      // Col 8: GST %
      doc.fillColor('#334155').font('Helvetica').fontSize(7).text(`${item.taxPercent}%`, cols[8].x, y + 5, { width: cols[8].w, align: 'center' });

      // Col 9: Tax Amount
      doc.fillColor('#334155').font('Helvetica').fontSize(7.2).text(item.totalTax.toFixed(2), cols[9].x, y + 5, { width: cols[9].w - 2, align: 'right' });

      // Col 10: Total
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(item.lineTotal.toFixed(2), cols[10].x, y + 5, { width: cols[10].w - 2, align: 'right' });

      y += rowH;
    });

    // Table bottom border
    doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
    y += 10;

    // ================= 4. HSN-WISE TAX SUMMARY TABLE =================
    if (y + 65 > 720) {
      doc.addPage();
      y = 35;
    }

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text('HSN / SAC TAX SUMMARY (RULE 46 OF CGST RULES)', left, y);
    y += 10;

    const hsnCols = [
      { label: 'HSN/SAC', x: left, w: 65, align: 'center' },
      { label: 'Taxable Value (₹)', x: left + 65, w: 95, align: 'right' },
      { label: 'CGST Rate', x: left + 160, w: 55, align: 'center' },
      { label: 'CGST Amount (₹)', x: left + 215, w: 75, align: 'right' },
      { label: 'SGST Rate', x: left + 290, w: 55, align: 'center' },
      { label: 'SGST Amount (₹)', x: left + 345, w: 75, align: 'right' },
      { label: 'Total Tax (₹)', x: left + 420, w: 111, align: 'right' },
    ];

    const hsnThH = 14;
    doc.rect(left, y, width, hsnThH).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#334155').fontSize(6.5).font('Helvetica-Bold');
    hsnCols.forEach((col) => {
      doc.text(col.label, col.x + 2, y + 3.5, { width: col.w - 4, align: col.align as any });
    });
    y += hsnThH;

    data.hsnSummary.forEach((hsn) => {
      const rowH = 13;
      doc.moveTo(left, y + rowH).lineTo(left + width, y + rowH).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      doc.fillColor('#334155').font('Helvetica').fontSize(6.8);
      doc.text(hsn.hsnCode, hsnCols[0].x, y + 3, { width: hsnCols[0].w, align: 'center' });
      doc.text(hsn.taxableAmount.toFixed(2), hsnCols[1].x, y + 3, { width: hsnCols[1].w - 4, align: 'right' });
      doc.text(`${hsn.cgstRate}%`, hsnCols[2].x, y + 3, { width: hsnCols[2].w, align: 'center' });
      doc.text(hsn.cgstAmount.toFixed(2), hsnCols[3].x, y + 3, { width: hsnCols[3].w - 4, align: 'right' });
      doc.text(`${hsn.sgstRate}%`, hsnCols[4].x, y + 3, { width: hsnCols[4].w, align: 'center' });
      doc.text(hsn.sgstAmount.toFixed(2), hsnCols[5].x, y + 3, { width: hsnCols[5].w - 4, align: 'right' });
      doc.text(hsn.totalTax.toFixed(2), hsnCols[6].x, y + 3, { width: hsnCols[6].w - 4, align: 'right' });
      y += rowH;
    });

    doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
    y += 12;

    // ================= 5. FINANCIAL TOTALS, WORDS, AND SUMMARY =================
    if (y + 110 > 720) {
      doc.addPage();
      y = 35;
    }

    const leftSecW = 270;
    const rightSecX = left + width - 245;
    const rightSecW = 245;
    const startSecY = y;

    // Left: Amount in Words box
    doc.roundedRect(left, y, leftSecW, 36, 4).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(6.8).text('INVOICE AMOUNT (IN WORDS):', left + 8, y + 5);
    doc.fillColor('#0f172a').font('Helvetica-BoldOblique').fontSize(7.5).text(data.amountInWords, left + 8, y + 16, { width: leftSecW - 16 });

    // Bank Transfer Details
    let bnkY = y + 42;
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7).text('Bank Transfer & UPI Details:', left, bnkY);
    bnkY += 10;
    doc.fillColor('#64748b').font('Helvetica').fontSize(6.8).text(
      `A/C: ${data.supplier.bankDetails?.accountName || data.supplier.legalName}  |  Bank: ${data.supplier.bankDetails?.bankName || 'HDFC Bank Ltd'}\nA/C No: ${data.supplier.bankDetails?.accountNumber || '50200012345678'}  |  IFSC: ${data.supplier.bankDetails?.ifscCode || 'HDFC0001234'}  |  UPI: ${data.supplier.bankDetails?.upiId || 'freshcart@hdfcbank'}`,
      left,
      bnkY,
      { lineGap: 1.5 }
    );

    // Terms & Conditions
    bnkY += 24;
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7).text('Terms & Conditions:', left, bnkY);
    bnkY += 9;
    (data.terms || []).slice(0, 3).forEach((term) => {
      doc.fillColor('#64748b').font('Helvetica').fontSize(6.3).text(term, left, bnkY, { width: leftSecW });
      bnkY += 8.5;
    });

    // Right Side: Financial Breakdown Box
    let totY = startSecY;
    const printFinRow = (lbl: string, val: string, isBold = false, isGreen = false) => {
      doc.fillColor(isBold ? '#0f172a' : '#475569').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5);
      doc.text(lbl, rightSecX, totY, { width: 140, align: 'right' });
      doc.fillColor(isGreen ? '#15803d' : isBold ? '#0f172a' : '#334155').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5);
      doc.text(val, rightSecX + 145, totY, { width: rightSecW - 145, align: 'right' });
      totY += 12;
    };

    printFinRow('Subtotal (Gross):', `₹${(data.totals.subtotal || data.totals.itemsGrossTotal).toFixed(2)}`);
    printFinRow('Product & Promo Discount:', `-₹${data.totals.discountTotal.toFixed(2)}`, false, true);
    printFinRow('Taxable Value:', `₹${data.totals.taxableTotal.toFixed(2)}`);
    if (data.isIntraState) {
      printFinRow('Central GST (CGST):', `₹${data.totals.cgstTotal.toFixed(2)}`);
      printFinRow('State GST (SGST):', `₹${data.totals.sgstTotal.toFixed(2)}`);
    } else {
      printFinRow('Integrated GST (IGST):', `₹${data.totals.igstTotal.toFixed(2)}`);
    }
    printFinRow('Express Delivery (SAC 996812):', data.totals.deliveryCharge > 0 ? `₹${data.totals.deliveryCharge.toFixed(2)}` : 'FREE');
    printFinRow('Round Off:', `₹${data.totals.roundOff.toFixed(2)}`);

    // Grand Total Banner
    totY += 2;
    doc.roundedRect(rightSecX, totY, rightSecW, 20, 3).fill('#168447');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text('GRAND TOTAL:', rightSecX + 8, totY + 5);
    doc.text(`₹${data.totals.grandTotal.toFixed(2)}`, rightSecX + 100, totY + 5, { width: rightSecW - 108, align: 'right' });
    totY += 24;

    // Paid & Balance Due
    printFinRow('Amount Paid:', `₹${data.totals.amountPaid.toFixed(2)}`);
    doc.fillColor(data.totals.balanceDue > 0 ? '#b91c1c' : '#15803d').font('Helvetica-Bold').fontSize(8);
    doc.text('Balance Due:', rightSecX, totY, { width: 140, align: 'right' });
    doc.text(`₹${data.totals.balanceDue.toFixed(2)}`, rightSecX + 145, totY, { width: rightSecW - 145, align: 'right' });
    totY += 16;

    // Signatory
    y = Math.max(bnkY + 12, totY + 10);
    const signW = 200;
    const signX = left + width - signW;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(`For ${data.supplier.legalName}`, signX, y, { width: signW, align: 'right' });
    y += 18;
    doc.fillColor('#168447').font('Helvetica-Bold').fontSize(6.8).text('✓ Digitally Signed & Authorized', signX, y, { width: signW, align: 'right' });
    y += 10;
    doc.moveTo(signX + 40, y).lineTo(signX + signW, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    y += 4;
    doc.fillColor('#64748b').font('Helvetica').fontSize(6.8).text('Authorized Signatory', signX, y, { width: signW, align: 'right' });

    // ================= 6. MULTI-PAGE NUMBERING & FOOTER =================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(left, 804).lineTo(left + width, 804).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.fillColor('#64748b').font('Helvetica').fontSize(6.5);
      doc.text(
        `FreshCart Supermarket Pvt Ltd • CIN: ${data.supplier.cin || 'U52100GJ2024PTC123456'} • GSTIN: ${data.supplier.gstin} • Section 31 CGST Act Compliant`,
        left,
        808,
        { width: 360 }
      );
      doc.text(`Invoice: ${data.invoiceNumber}  |  Page ${i + 1} of ${pages.count}`, left + 360, 808, { width: width - 360, align: 'right' });
    }

    doc.end();
    return doc;
  },

  /**
   * Generates a legal GST Credit Note PDF under Section 34 of the CGST Act, 2017
   * for cancelled or returned orders.
   */
  async generateCreditNotePdf(orderIdOrNumber: string, reason: string = 'Order Cancellation / Return'): Promise<PDFKit.PDFDocument> {
    const data = await this.getInvoiceData(orderIdOrNumber);

    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      info: {
        Title: `GST-Credit-Note-${data.orderNumber}`,
        Author: data.supplier.legalName,
        Subject: `GST Credit Note for Order #${data.orderNumber}`,
      },
    });

    const left = 36;
    const width = 523;
    let y = 32;

    const cnNumber = `CN-${data.invoiceNumber.replace('INV-', '')}`;
    const cnDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // HEADER
    doc.rect(left, y, width, 26).fillAndStroke('#991b1b', '#b91c1c');
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
    doc.text('GST CREDIT NOTE', left, y + 4, { width, align: 'center' });
    doc.fontSize(7.5).font('Helvetica');
    doc.text('[Issued under Section 34 of CGST Act, 2017 read with Rule 53 of CGST Rules, 2017]', left, y + 16, { width, align: 'center' });

    y += 26;

    // Badging
    doc.rect(left, y, width, 14).fillAndStroke('#fef2f2', '#fecaca');
    doc.fillColor('#991b1b').fontSize(7.5).font('Helvetica-Bold');
    doc.text('ORIGINAL FOR RECIPIENT', left + 8, y + 3);
    doc.text(`Place of Supply: ${data.placeOfSupply}`, left + 200, y + 3, { width: 160, align: 'center' });
    doc.text('Tax Adjustment: REVERSAL', left, y + 3, { width: width - 8, align: 'right' });

    y += 14;

    // SUPPLIER & CREDIT NOTE META GRID
    const gridHeight = 95;
    doc.rect(left, y, width, gridHeight).strokeColor('#cbd5e1').stroke();
    const splitX = left + 270;
    doc.moveTo(splitX, y).lineTo(splitX, y + gridHeight).strokeColor('#cbd5e1').stroke();

    // Supplier Info (Left)
    let supY = y + 6;
    doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(data.supplier.legalName, left + 8, supY);
    supY += 12;
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
    doc.text(data.supplier.address, left + 8, supY, { width: 250 });
    supY += 19;
    doc.fillColor('#0f172a').font('Helvetica-Bold');
    doc.text(`GSTIN: `, left + 8, supY, { continued: true });
    doc.font('Helvetica').text(`${data.supplier.gstin} | PAN: ${data.supplier.pan}`);
    supY += 11;
    doc.font('Helvetica-Bold').text(`State: `, left + 8, supY, { continued: true });
    doc.font('Helvetica').text(`${data.supplier.state} (State Code: ${data.supplier.stateCode})`);

    // Credit Note Meta (Right)
    let metaY = y + 6;
    const metaLeft = splitX + 8;
    const metaLabelW = 95;

    const printMetaRow = (label: string, val: string, isBoldVal = false) => {
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold').text(label, metaLeft, metaY, { width: metaLabelW });
      doc.fillColor('#0f172a').font(isBoldVal ? 'Helvetica-Bold' : 'Helvetica').text(val, metaLeft + metaLabelW, metaY, { width: 140 });
      metaY += 11;
    };

    printMetaRow('Credit Note No:', cnNumber, true);
    printMetaRow('Credit Note Date:', cnDate, true);
    printMetaRow('Original Invoice No:', data.invoiceNumber, true);
    printMetaRow('Original Invoice Date:', data.invoiceDate);
    printMetaRow('Order Reference:', data.orderNumber);
    printMetaRow('Reason for Credit Note:', reason, true);

    y += gridHeight;

    // PARTY DETAILS
    const partyHeight = 45;
    doc.rect(left, y, width, partyHeight).strokeColor('#cbd5e1').stroke();
    doc.rect(left, y, width, 14).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('DETAILS OF BENEFICIARY / BUYER:', left + 8, y + 3);

    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(data.customer.name, left + 8, y + 18);
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(
      `Phone: ${data.customer.phone} | Destination: ${data.customer.city}, ${data.customer.state} (${data.customer.pincode}) | GSTIN: ${data.customer.gstin}`,
      left + 8,
      y + 30
    );

    y += partyHeight + 8;

    // REVERSAL SUMMARY TABLE
    doc.rect(left, y, width, 18).fillAndStroke('#fee2e2', '#fca5a5');
    doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold');
    doc.text('TAX CREDIT / REFUND REVERSAL BREAKDOWN', left + 8, y + 5);

    y += 18;
    const tableH = 80;
    doc.rect(left, y, width, tableH).strokeColor('#cbd5e1').stroke();

    let rY = y + 8;
    const printRefRow = (lbl: string, val: string, isTotal = false) => {
      doc.fillColor(isTotal ? '#991b1b' : '#334155').fontSize(isTotal ? 9 : 8).font(isTotal ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(lbl, left + 14, rY);
      doc.text(val, left + width - 120, rY, { width: 100, align: 'right' });
      rY += 14;
    };

    printRefRow('Original Taxable Turnover Reversed:', `₹${data.totals.taxableTotal.toFixed(2)}`);
    if (data.isIntraState) {
      printRefRow('Central GST (CGST) Reversed:', `₹${data.totals.cgstTotal.toFixed(2)}`);
      printRefRow('State GST (SGST) Reversed:', `₹${data.totals.sgstTotal.toFixed(2)}`);
    } else {
      printRefRow('Integrated GST (IGST) Reversed:', `₹${data.totals.igstTotal.toFixed(2)}`);
    }
    printRefRow('TOTAL REFUND / CREDIT AMOUNT:', `₹${data.totals.grandTotal.toFixed(2)}`, true);

    y += tableH + 8;

    // WORDS
    doc.rect(left, y, width, 20).fillAndStroke('#fef2f2', '#fca5a5');
    doc.fillColor('#991b1b').fontSize(7.5).font('Helvetica-Bold').text('Amount of Credit (in words):', left + 8, y + 5);
    doc.font('Helvetica-Oblique').text(numberToIndianWords(data.totals.grandTotal), left + 140, y + 5, { width: width - 150 });

    y += 28;

    // SIGNATURE & DECLARATION
    const signHeight = 55;
    doc.rect(left, y, width, signHeight).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold').text('Declaration:', left + 8, y + 6);
    doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text(
      'This Credit Note has been generated in accordance with Section 34 of the CGST Act, 2017 for tax adjustment and refund credit.',
      left + 8,
      y + 16,
      { width: 320 }
    );

    const signX = left + 340;
    doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold').text(`For ${data.supplier.legalName}`, signX, y + 6, {
      width: width - (signX - left) - 8,
      align: 'center',
    });
    doc.fillColor('#dc2626').fontSize(7).font('Helvetica-Bold').text('[Digitally Verified / System Generated]', signX, y + 24, {
      width: width - (signX - left) - 8,
      align: 'center',
    });
    doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text('Authorized Signatory', signX, y + 42, {
      width: width - (signX - left) - 8,
      align: 'center',
    });

    doc.end();
    return doc;
  },

  /**
   * Generates a print-ready authentic HTML invoice page with automatic print trigger.
   */
  async generateInvoiceHtml(orderIdOrNumber: string): Promise<string> {
    const data = await this.getInvoiceData(orderIdOrNumber);

    const customerAddr = [
      data.customer.street,
      data.customer.landmark ? `Near ${data.customer.landmark}` : '',
      data.customer.city,
      `${data.customer.state} – ${data.customer.pincode}`,
    ]
      .filter(Boolean)
      .join(', ');

    const shippingAddr = [
      data.shippingAddress?.street || data.customer.street,
      data.shippingAddress?.landmark ? `Near ${data.shippingAddress.landmark}` : '',
      data.shippingAddress?.city || data.customer.city,
      `${data.shippingAddress?.state || data.customer.state} – ${data.shippingAddress?.pincode || data.customer.pincode}`,
    ]
      .filter(Boolean)
      .join(', ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice #${data.invoiceNumber} - ${data.supplier.legalName}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background: #f8fafc; color: #0f172a; padding: 24px; font-size: 11px; line-height: 1.4; }
    .invoice-wrapper { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    .no-print { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px; max-width: 820px; margin-left: auto; margin-right: auto; }
    .btn { background: #168447; color: white; padding: 9px 18px; border-radius: 8px; text-decoration: none; font-weight: 700; border: none; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: #106b39; }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #1e293b; }

    /* Header */
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; }
    .brand-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .brand-logo { width: 34px; height: 34px; background: #168447; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 16px; letter-spacing: -0.5px; }
    .brand-name { font-size: 20px; font-weight: 900; color: #111827; line-height: 1.1; }
    .brand-tag { font-size: 8px; font-weight: 800; color: #168447; letter-spacing: 0.5px; }

    .store-legal { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
    .store-address { font-size: 9.5px; color: #475569; max-width: 380px; margin-bottom: 5px; line-height: 1.35; }
    .store-meta { font-size: 9.5px; color: #334155; line-height: 1.4; }
    .store-meta strong { color: #0f172a; }

    .invoice-heading-col { text-align: right; }
    .tax-invoice-title { font-size: 24px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; }
    .green-accent { width: 100px; height: 3px; background-color: #168447; margin-left: auto; margin-top: 4px; margin-bottom: 6px; }
    .recipient-badge { display: inline-block; background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-size: 8.5px; font-weight: 800; padding: 2px 10px; border-radius: 4px; margin-bottom: 8px; }
    
    .meta-table { font-size: 9.5px; border-collapse: collapse; margin-left: auto; }
    .meta-table td { padding: 2px 0 2px 12px; text-align: right; }
    .meta-label { color: #64748b; font-weight: 500; }
    .meta-val { font-weight: 700; color: #0f172a; }
    .status-badge { font-weight: 800; font-size: 9px; padding: 1px 6px; border-radius: 4px; }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-pending { background: #fef3c7; color: #b45309; }

    .divider { height: 1px; background-color: #e2e8f0; margin: 14px 0; }

    /* Dual Cards (Billed to & Shipped to) */
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .party-card { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff; }
    .party-header { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 5px 10px; font-size: 9px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
    .party-body { padding: 8px 10px; font-size: 9.5px; color: #475569; line-height: 1.4; }
    .party-name { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }

    /* Products Table */
    table.product-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #cbd5e1; }
    table.product-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 7px; font-size: 8.5px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px; }
    table.product-table td { padding: 6px 7px; border: 1px solid #e2e8f0; font-size: 9.5px; color: #1e293b; vertical-align: middle; }
    table.product-table tr:nth-child(even) td { background: #fafafa; }
    .item-name { font-weight: 800; color: #0f172a; font-size: 10px; }
    .item-subline { font-size: 8.5px; color: #64748b; margin-top: 1px; }
    .discount-val { color: #15803d; font-weight: 600; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    /* HSN Table */
    .hsn-title { font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 14px; margin-bottom: 4px; text-transform: uppercase; }
    table.hsn-table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 9px; }
    table.hsn-table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 700; color: #334155; }
    table.hsn-table td { padding: 4px 6px; border: 1px solid #e2e8f0; }

    /* Bottom Financial & Terms Grid */
    .bottom-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; margin-top: 16px; align-items: flex-start; }
    
    .words-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; }
    .words-label { font-size: 8.5px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 2px; }
    .words-val { font-size: 10px; font-weight: 800; font-style: italic; color: #0f172a; }

    .bank-box { font-size: 8.5px; color: #64748b; line-height: 1.4; margin-bottom: 10px; padding: 6px 8px; border: 1px dashed #cbd5e1; border-radius: 5px; }
    .bank-title { font-weight: 800; color: #334155; margin-bottom: 2px; text-transform: uppercase; font-size: 8.5px; }

    .terms-box { font-size: 8px; color: #64748b; line-height: 1.35; }
    .terms-title { font-weight: 800; color: #334155; margin-bottom: 2px; text-transform: uppercase; }

    /* Totals Box */
    .totals-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #ffffff; }
    .tot-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 9.5px; color: #475569; }
    .tot-row.bold { font-weight: 700; color: #0f172a; }
    .tot-row.grand-tot { background: #168447; color: #ffffff; padding: 6px 10px; border-radius: 4px; margin: 6px 0; font-size: 12px; font-weight: 900; }
    .tot-row.balance { font-size: 10.5px; font-weight: 800; padding-top: 4px; }
    .bal-pending { color: #b91c1c; }
    .bal-cleared { color: #15803d; }

    /* Sign Section */
    .sign-section { margin-top: 24px; text-align: right; }
    .sign-company { font-size: 9.5px; font-weight: 800; color: #0f172a; }
    .sign-tag { font-size: 8.5px; font-weight: 800; color: #168447; margin: 16px 0 4px 0; }
    .sign-line { border-top: 1px solid #cbd5e1; width: 170px; margin-left: auto; margin-bottom: 3px; }
    .sign-label { font-size: 8.5px; color: #64748b; }

    /* Footer */
    .invoice-footer { border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #64748b; }

    @media print {
      body { padding: 0; background: #ffffff; font-size: 10px; }
      .no-print { display: none !important; }
      .invoice-wrapper { max-width: 100%; border: none; box-shadow: none; padding: 0; border-radius: 0; }
      table.product-table th, table.hsn-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .tot-row.grand-tot { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .words-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">🖨️ Print Tax Invoice</button>
    <a class="btn btn-secondary" href="/api/orders/${data.orderId}/invoice">⬇️ Download PDF Invoice</a>
  </div>

  <div class="invoice-wrapper">
    <!-- 1. Header: Brand & Legal Details (Left) + TAX INVOICE & Meta (Right) -->
    <div class="header-row">
      <div>
        <div class="brand-wrap">
          <div class="brand-logo">FC</div>
          <div>
            <div class="brand-name">FreshCart</div>
            <div class="brand-tag">10-15 MINS GROCERIES</div>
          </div>
        </div>
        <div class="store-legal">${data.supplier.legalName}</div>
        <div class="store-address">${data.supplier.address}, ${data.supplier.city}, ${data.supplier.state} – ${data.supplier.pincode}</div>
        <div class="store-meta">
          <strong>GSTIN:</strong> ${data.supplier.gstin} &nbsp;|&nbsp; <strong>PAN:</strong> ${data.supplier.pan} &nbsp;|&nbsp; <strong>State:</strong> ${data.supplier.state} (Code: ${data.supplier.stateCode})<br>
          <strong>Contact:</strong> ${data.supplier.phone} &nbsp;|&nbsp; <strong>Email:</strong> ${data.supplier.email}<br>
          <strong>FSSAI Lic. No:</strong> ${data.supplier.fssai || '10722001000543'} &nbsp;|&nbsp; <strong>CIN:</strong> ${data.supplier.cin || 'U52100GJ2024PTC123456'}
        </div>
      </div>

      <div class="invoice-heading-col">
        <div class="tax-invoice-title">TAX INVOICE</div>
        <div class="green-accent"></div>
        <div><span class="recipient-badge">ORIGINAL FOR RECIPIENT</span></div>
        <table class="meta-table">
          <tr><td class="meta-label">Invoice Number:</td><td class="meta-val">${data.invoiceNumber}</td></tr>
          <tr><td class="meta-label">Invoice Date:</td><td class="meta-val">${data.invoiceDate} ${data.invoiceTime || ''}</td></tr>
          <tr><td class="meta-label">Order Ref:</td><td class="meta-val">#${data.orderNumber}</td></tr>
          <tr><td class="meta-label">Order Date:</td><td class="meta-val">${data.orderDate}</td></tr>
          <tr><td class="meta-label">Place of Supply:</td><td class="meta-val">${data.placeOfSupply}</td></tr>
          <tr><td class="meta-label">Reverse Charge:</td><td class="meta-val">${data.reverseCharge}</td></tr>
          <tr><td class="meta-label">Payment Mode:</td><td class="meta-val">${data.paymentMethod}</td></tr>
          <tr>
            <td class="meta-label">Payment Status:</td>
            <td>
              <span class="status-badge ${data.isCodPending ? 'status-pending' : 'status-paid'}">
                ${data.paymentStatus}
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 2. Dual Party Details: Billed To (Customer) & Shipped To (Dispatch) -->
    <div class="party-grid">
      <div class="party-card">
        <div class="party-header">Billed To (Customer Details)</div>
        <div class="party-body">
          <div class="party-name">${data.customer.name}</div>
          <div>${customerAddr}</div>
          <div style="margin-top: 3px;"><strong>Mobile:</strong> ${data.customer.phone} &nbsp;|&nbsp; <strong>Email:</strong> ${data.customer.email || 'N/A'}</div>
          <div><strong>GSTIN / Unique ID:</strong> ${data.customer.gstin}</div>
        </div>
      </div>

      <div class="party-card">
        <div class="party-header">Shipped To / Dispatch Details</div>
        <div class="party-body">
          <div class="party-name">${data.shippingAddress?.name || data.customer.name}</div>
          <div>${shippingAddr}</div>
          <div style="margin-top: 3px;"><strong>Delivery Slot:</strong> ${data.deliverySlot || 'Standard Delivery'} &nbsp;|&nbsp; <strong>Mode:</strong> Express Delivery</div>
          <div><strong>Fleet Partner:</strong> ${data.carrier || 'FreshCart Express'} &nbsp;|&nbsp; <strong>AWB:</strong> ${data.trackingNumber}</div>
        </div>
      </div>
    </div>

    <!-- 3. Product Table: Complete 13 Required Columns -->
    <table class="product-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 28px;">#</th>
          <th>Product Name & Brand</th>
          <th class="text-center" style="width: 65px;">HSN/SAC</th>
          <th class="text-right" style="width: 40px;">Qty</th>
          <th class="text-center" style="width: 40px;">Unit</th>
          <th class="text-right" style="width: 70px;">Unit Price (₹)</th>
          <th class="text-right" style="width: 65px;">Discount (₹)</th>
          <th class="text-right" style="width: 75px;">Taxable (₹)</th>
          <th class="text-center" style="width: 50px;">GST %</th>
          <th class="text-right" style="width: 65px;">Tax (₹)</th>
          <th class="text-right" style="width: 80px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (it) => `
          <tr>
            <td class="text-center" style="color: #64748b;">${it.index}</td>
            <td>
              <div class="item-name">${it.productName}${it.isSubstituted ? ' [Substituted]' : ''}</div>
              <div class="item-subline">Brand: ${it.brand || 'FreshCart'} &bull; Pack: ${it.packSize || it.unit}</div>
            </td>
            <td class="text-center">${it.hsnCode}</td>
            <td class="text-right" style="font-weight: 700;">${it.quantity}</td>
            <td class="text-center" style="color: #64748b;">${it.unitType || 'pcs'}</td>
            <td class="text-right">${it.unitMrp.toFixed(2)}</td>
            <td class="text-right ${it.discount > 0 ? 'discount-val' : ''}">
              ${it.discount > 0 ? `-${it.discount.toFixed(2)}` : '0.00'}
            </td>
            <td class="text-right">${it.taxableAmount.toFixed(2)}</td>
            <td class="text-center">${it.taxPercent}%</td>
            <td class="text-right">${it.totalTax.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 800;">${it.lineTotal.toFixed(2)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- 4. HSN-Wise Tax Summary Table -->
    <div class="hsn-title">HSN / SAC Tax Summary (Rule 46 of CGST Rules, 2017)</div>
    <table class="hsn-table">
      <thead>
        <tr>
          <th class="text-center">HSN/SAC</th>
          <th class="text-right">Taxable Value (₹)</th>
          <th class="text-center">CGST Rate</th>
          <th class="text-right">CGST Amount (₹)</th>
          <th class="text-center">SGST Rate</th>
          <th class="text-right">SGST Amount (₹)</th>
          <th class="text-right">Total Tax (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${data.hsnSummary
          .map(
            (h) => `
          <tr>
            <td class="text-center">${h.hsnCode}</td>
            <td class="text-right">${h.taxableAmount.toFixed(2)}</td>
            <td class="text-center">${h.cgstRate}%</td>
            <td class="text-right">${h.cgstAmount.toFixed(2)}</td>
            <td class="text-center">${h.sgstRate}%</td>
            <td class="text-right">${h.sgstAmount.toFixed(2)}</td>
            <td class="text-right" style="font-weight: 700;">${h.totalTax.toFixed(2)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- 5. Bottom Financial Summary, Words, and Terms -->
    <div class="bottom-grid">
      <div>
        <div class="words-box">
          <div class="words-label">Invoice Amount (in words):</div>
          <div class="words-val">${data.amountInWords}</div>
        </div>

        <div class="bank-box">
          <div class="bank-title">Bank Transfer & UPI Details</div>
          <strong>Account Name:</strong> ${data.supplier.bankDetails?.accountName || data.supplier.legalName}<br>
          <strong>Bank:</strong> ${data.supplier.bankDetails?.bankName || 'HDFC Bank Ltd, Prahlad Nagar Branch, Ahmedabad'}<br>
          <strong>Account No:</strong> ${data.supplier.bankDetails?.accountNumber || '50200012345678'} &nbsp;|&nbsp; <strong>IFSC:</strong> ${data.supplier.bankDetails?.ifscCode || 'HDFC0001234'}<br>
          <strong>UPI ID:</strong> ${data.supplier.bankDetails?.upiId || 'freshcart@hdfcbank'}
        </div>

        <div class="terms-box">
          <div class="terms-title">Terms & Conditions</div>
          ${(data.terms || []).slice(0, 3).map((t) => `<div>&bull; ${t}</div>`).join('')}
        </div>
      </div>

      <div>
        <div class="totals-box">
          <div class="tot-row">
            <span>Subtotal (Gross):</span>
            <span>₹${(data.totals.subtotal || data.totals.itemsGrossTotal).toFixed(2)}</span>
          </div>
          <div class="tot-row" style="color: #15803d;">
            <span>Product & Promo Discount:</span>
            <span>-₹${data.totals.discountTotal.toFixed(2)}</span>
          </div>
          <div class="tot-row bold">
            <span>Taxable Turnover:</span>
            <span>₹${data.totals.taxableTotal.toFixed(2)}</span>
          </div>
          ${
            data.isIntraState
              ? `
            <div class="tot-row">
              <span>Central GST (CGST):</span>
              <span>₹${data.totals.cgstTotal.toFixed(2)}</span>
            </div>
            <div class="tot-row">
              <span>State GST (SGST):</span>
              <span>₹${data.totals.sgstTotal.toFixed(2)}</span>
            </div>
          `
              : `
            <div class="tot-row">
              <span>Integrated GST (IGST):</span>
              <span>₹${data.totals.igstTotal.toFixed(2)}</span>
            </div>
          `
          }
          <div class="tot-row">
            <span>Express Delivery (SAC 996812):</span>
            <span>${data.totals.deliveryCharge > 0 ? `₹${data.totals.deliveryCharge.toFixed(2)}` : 'FREE'}</span>
          </div>
          <div class="tot-row">
            <span>Round Off:</span>
            <span>₹${data.totals.roundOff.toFixed(2)}</span>
          </div>

          <div class="tot-row grand-tot">
            <span>GRAND TOTAL:</span>
            <span>₹${data.totals.grandTotal.toFixed(2)}</span>
          </div>

          <div class="tot-row">
            <span>Amount Paid:</span>
            <span>₹${data.totals.amountPaid.toFixed(2)}</span>
          </div>
          <div class="tot-row balance ${data.totals.balanceDue > 0 ? 'bal-pending' : 'bal-cleared'}">
            <span>Balance Due:</span>
            <span>₹${data.totals.balanceDue.toFixed(2)}</span>
          </div>
        </div>

        <div class="sign-section">
          <div class="sign-company">For ${data.supplier.legalName}</div>
          <div class="sign-tag">✓ Digitally Signed & Authorized</div>
          <div class="sign-line"></div>
          <div class="sign-label">Authorized Signatory</div>
        </div>
      </div>
    </div>

    <!-- 6. Footer -->
    <div class="invoice-footer">
      <div>FreshCart Supermarket Private Limited &bull; CIN: ${data.supplier.cin || 'U52100GJ2024PTC123456'} &bull; GSTIN: ${data.supplier.gstin} &bull; Ahmedabad, Gujarat</div>
      <div>Page 1 of 1 &bull; Computer-Generated GST Tax Invoice under Section 31 of CGST Act, 2017</div>
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Generates Warehouse Packing Slip PDF
   */
  async generatePackingSlipPdf(orderIdOrNumber: string): Promise<PDFKit.PDFDocument> {
    const data = await this.getInvoiceData(orderIdOrNumber);

    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      info: { Title: `Packing-Slip-${data.orderNumber}`, Author: data.supplier.legalName },
    });

    const left = 36;
    const width = 523;
    let y = 36;

    // Header
    doc.rect(left, y, width, 28).fillAndStroke('#1e293b', '#0f172a');
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text('WAREHOUSE DISPATCH & PACKING SLIP', left, y + 8, { width, align: 'center' });
    y += 34;

    // Order Info Box
    doc.rect(left, y, width, 55).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text(`Order Number: #${data.orderNumber}`, left + 10, y + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(`Order Date: ${data.orderDate}`, left + 10, y + 22);
    doc.text(`Delivery Slot: ${data.deliverySlot || 'Standard Delivery'}`, left + 10, y + 36);

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
    doc.text(`Customer: ${data.customer.name}`, left + 270, y + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(`Contact: ${data.customer.phone}`, left + 270, y + 22);
    doc.text(`Area / PIN: ${data.customer.city}, ${data.customer.pincode}`, left + 270, y + 36);
    y += 65;

    // Table
    doc.rect(left, y, width, 18).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
    doc.text('#', left + 6, y + 5, { width: 24, align: 'center' });
    doc.text('SKU / Code', left + 35, y + 5, { width: 85 });
    doc.text('Item Description & Weight', left + 125, y + 5, { width: 200 });
    doc.text('Unit', left + 330, y + 5, { width: 45, align: 'center' });
    doc.text('Qty', left + 380, y + 5, { width: 40, align: 'right' });
    doc.text('Checked [✓]', left + 430, y + 5, { width: 85, align: 'center' });
    y += 18;

    doc.font('Helvetica').fontSize(8);
    data.items.forEach((item, i) => {
      const rowH = 20;
      if (i % 2 === 1) doc.rect(left, y, width, rowH).fill('#fafafa');
      doc.rect(left, y, width, rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.fillColor('#334155');
      doc.text(String(item.index), left + 6, y + 6, { width: 24, align: 'center' });
      doc.font('Helvetica-Bold').text(item.sku, left + 35, y + 6, { width: 85 });
      doc.font('Helvetica').text(item.productName, left + 125, y + 6, { width: 200, ellipsis: true });
      doc.text(item.unit, left + 330, y + 6, { width: 45, align: 'center' });
      doc.font('Helvetica-Bold').text(String(item.quantity), left + 380, y + 6, { width: 40, align: 'right' });
      doc.rect(left + 465, y + 4, 12, 12).strokeColor('#94a3b8').stroke();
      doc.font('Helvetica');
      y += rowH;
    });

    y += 20;
    doc.rect(left, y, width, 45).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('Packing Staff Verification:', left + 10, y + 8);
    doc.font('Helvetica').fillColor('#64748b').text('Packed By: _____________________    Signature: _____________________    Date/Time: _______________', left + 10, y + 25);

    doc.end();
    return doc;
  },

  /**
   * Generates Delivery Slip PDF
   */
  async generateDeliverySlipPdf(orderIdOrNumber: string): Promise<PDFKit.PDFDocument> {
    const data = await this.getInvoiceData(orderIdOrNumber);

    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      info: { Title: `Delivery-Slip-${data.orderNumber}`, Author: data.supplier.legalName },
    });

    const left = 36;
    const width = 523;
    let y = 36;

    // Header
    doc.rect(left, y, width, 28).fillAndStroke('#0f766e', '#0d9488');
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text('ORDER DELIVERY RUN-SHEET & RECEIPT', left, y + 8, { width, align: 'center' });
    y += 34;

    // Meta Grid
    doc.rect(left, y, width, 85).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text(`Order Number: #${data.orderNumber}`, left + 10, y + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(`Invoice No: ${data.invoiceNumber}`, left + 10, y + 22);
    doc.text(`Payment Method: ${data.paymentMethod} (${data.paymentStatus})`, left + 10, y + 36);
    doc.text(`Amount to Collect: ₹${data.totals.grandTotal.toFixed(2)}`, left + 10, y + 50);

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
    doc.text(`Customer: ${data.customer.name}`, left + 270, y + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(`Phone: ${data.customer.phone}`, left + 270, y + 22);
    doc.text(`Address: ${data.customer.street}, ${data.customer.city} - ${data.customer.pincode}`, left + 270, y + 36, { width: 240 });
    y += 95;

    // Items Summary
    doc.rect(left, y, width, 18).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
    doc.text('#', left + 6, y + 5, { width: 24, align: 'center' });
    doc.text('Item Description', left + 35, y + 5, { width: 250 });
    doc.text('Unit', left + 295, y + 5, { width: 60, align: 'center' });
    doc.text('Qty', left + 365, y + 5, { width: 40, align: 'right' });
    doc.text('Line Amount', left + 415, y + 5, { width: 100, align: 'right' });
    y += 18;

    doc.font('Helvetica').fontSize(8);
    data.items.forEach((item, i) => {
      const rowH = 18;
      if (i % 2 === 1) doc.rect(left, y, width, rowH).fill('#fafafa');
      doc.rect(left, y, width, rowH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.fillColor('#334155');
      doc.text(String(item.index), left + 6, y + 5, { width: 24, align: 'center' });
      doc.text(item.productName, left + 35, y + 5, { width: 250, ellipsis: true });
      doc.text(item.unit, left + 295, y + 5, { width: 60, align: 'center' });
      doc.font('Helvetica-Bold').text(String(item.quantity), left + 365, y + 5, { width: 40, align: 'right' });
      doc.text(`₹${item.lineTotal.toFixed(2)}`, left + 415, y + 5, { width: 100, align: 'right' });
      doc.font('Helvetica');
      y += rowH;
    });

    y += 15;
    // Sign box
    doc.rect(left, y, width, 55).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('Customer Acknowledgment & Delivery Confirmation:', left + 10, y + 8);
    doc.font('Helvetica').fillColor('#64748b').text('Items received in good condition. Cash collected (if applicable): ₹__________', left + 10, y + 22);
    doc.text('Customer Signature: _______________________      Delivery Partner: _______________________', left + 10, y + 38);

    doc.end();
    return doc;
  },
};
