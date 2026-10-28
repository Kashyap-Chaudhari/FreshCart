import PDFDocument from 'pdfkit';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export const invoiceService = {
  /**
   * Generates a tax invoice PDF for an order using PDFKit and pipes to a writable stream or returns buffer.
   */
  async generateInvoicePdf(orderId: string): Promise<PDFKit.PDFDocument> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found for invoice generation', 404);
    }

    const settings = (await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    })) || {
      storeName: 'FreshCart Supermarket',
      tagLine: 'Your Daily Fresh Grocery Partner',
      address: '123 Market Road, Koramangala, Bengaluru, Karnataka 560034',
      phone: '+91 98765 43210',
      email: 'support@freshcart.com',
      gstin: '29AAAAA0000A1Z5',
      fssai: '11223344556677',
      invoiceFooterText: 'Thank you for shopping with FreshCart! Items once sold can be returned within 24 hours if perishable.',
    };

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // HEADER - STORE INFO
    doc.fillColor('#15803d').fontSize(22).font('Helvetica-Bold').text(settings.storeName, 40, 40);
    doc.fillColor('#4b5563').fontSize(9).font('Helvetica').text(settings.tagLine || '', 40, 65);
    doc.text(`${settings.address} | Phone: ${settings.phone} | Email: ${settings.email}`, 40, 78);
    doc.text(`GSTIN: ${settings.gstin} | FSSAI Lic. No: ${settings.fssai || 'N/A'}`, 40, 91);

    // DIVIDER
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, 108).lineTo(555, 108).stroke();

    // INVOICE & ORDER META
    doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 40, 118);

    doc.fontSize(9).font('Helvetica-Bold').text('Invoice No:', 40, 138);
    doc.font('Helvetica').text(order.invoiceNumber, 110, 138);

    doc.font('Helvetica-Bold').text('Order No:', 40, 152);
    doc.font('Helvetica').text(order.orderNumber, 110, 152);

    doc.font('Helvetica-Bold').text('Order Date:', 40, 166);
    doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }), 110, 166);

    doc.font('Helvetica-Bold').text('Delivery Type:', 40, 180);
    doc.font('Helvetica').text(`${order.deliveryType} ${order.deliverySlot ? `(${order.deliverySlot})` : ''}`, 110, 180);

    // CUSTOMER / BILL TO BOX
    const address = order.shippingAddressSnapshot as any;
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('BILLED TO / DELIVER TO:', 330, 118);
    doc.fontSize(9).font('Helvetica-Bold').text(order.customerName, 330, 134);
    doc.font('Helvetica').text(`Phone: ${order.customerPhone}`, 330, 148);
    if (order.customerEmail) {
      doc.text(`Email: ${order.customerEmail}`, 330, 162);
    }
    const fullAddr = `${address?.street || ''}, ${address?.landmark ? address.landmark + ', ' : ''}${address?.city || ''}, ${address?.state || ''} - ${address?.pincode || ''}`;
    doc.text(fullAddr, 330, order.customerEmail ? 176 : 162, { width: 220 });

    // ITEMS TABLE HEADER
    const tableTop = 220;
    doc.rect(40, tableTop, 515, 22).fill('#f3f4f6');
    doc.fillColor('#1f2937').fontSize(8.5).font('Helvetica-Bold');
    doc.text('#', 45, tableTop + 6, { width: 20 });
    doc.text('Item Description', 70, tableTop + 6, { width: 170 });
    doc.text('SKU', 245, tableTop + 6, { width: 55 });
    doc.text('Unit', 305, tableTop + 6, { width: 40 });
    doc.text('Rate (₹)', 350, tableTop + 6, { width: 45, align: 'right' });
    doc.text('Qty', 400, tableTop + 6, { width: 25, align: 'right' });
    doc.text('Tax %', 430, tableTop + 6, { width: 35, align: 'right' });
    doc.text('Total (₹)', 470, tableTop + 6, { width: 80, align: 'right' });

    let currentY = tableTop + 24;
    order.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.rect(40, currentY, 515, 20).fill('#fafafa');
      }

      doc.fillColor('#374151').fontSize(8).font('Helvetica');
      doc.text(String(index + 1), 45, currentY + 5, { width: 20 });
      doc.text(item.productName + (item.isSubstituted ? ' [Substituted]' : ''), 70, currentY + 5, { width: 170 });
      doc.text(item.productSku, 245, currentY + 5, { width: 55 });
      doc.text(item.unit, 305, currentY + 5, { width: 40 });
      doc.text(Number(item.unitPrice).toFixed(2), 350, currentY + 5, { width: 45, align: 'right' });
      doc.text(String(item.quantity), 400, currentY + 5, { width: 25, align: 'right' });
      doc.text(`${Number(item.taxPercent)}%`, 430, currentY + 5, { width: 35, align: 'right' });
      doc.text(Number(item.lineTotal).toFixed(2), 470, currentY + 5, { width: 80, align: 'right' });

      currentY += 20;
    });

    // TOTALS SECTION
    currentY += 10;
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 10;

    const summaryLeft = 350;
    doc.fontSize(9).font('Helvetica');
    doc.text('Items Subtotal:', summaryLeft, currentY);
    doc.text(`₹${Number(order.subtotal).toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
    currentY += 16;

    if (Number(order.discountTotal) > 0) {
      doc.fillColor('#16a34a').text(`Coupon Discount (${order.couponCodeSnapshot || 'PROMO'}):`, summaryLeft, currentY);
      doc.text(`- ₹${Number(order.discountTotal).toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
      currentY += 16;
    }

    doc.fillColor('#374151').text('Delivery Charges:', summaryLeft, currentY);
    doc.text(
      Number(order.deliveryCharge) === 0 ? 'FREE' : `₹${Number(order.deliveryCharge).toFixed(2)}`,
      470,
      currentY,
      { width: 80, align: 'right' }
    );
    currentY += 16;

    doc.fillColor('#6b7280').fontSize(8).text('(Includes Total GST:', summaryLeft, currentY);
    doc.text(`₹${Number(order.taxTotal).toFixed(2)})`, 470, currentY, { width: 80, align: 'right' });
    currentY += 18;

    // GRAND TOTAL / COD HIGHLIGHT
    doc.rect(340, currentY, 215, 45).fill('#ecfdf5');
    doc.strokeColor('#10b981').lineWidth(1).rect(340, currentY, 215, 45).stroke();

    doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold');
    doc.text('GRAND TOTAL:', 350, currentY + 8);
    doc.text(`₹${Number(order.grandTotal).toFixed(2)}`, 470, currentY + 8, { width: 80, align: 'right' });

    doc.fillColor('#047857').fontSize(9).font('Helvetica-Bold');
    doc.text('Amount payable on delivery (COD)', 350, currentY + 26);

    // FOOTER TERMS
    const footerY = 740;
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();
    doc.fillColor('#6b7280').fontSize(7.5).font('Helvetica').text(
      settings.invoiceFooterText || 'Thank you for choosing FreshCart!',
      40,
      footerY + 10,
      { width: 515, align: 'center' }
    );
    doc.text(
      'This is a computer-generated tax invoice and does not require a physical signature.',
      40,
      footerY + 24,
      { width: 515, align: 'center' }
    );

    doc.end();
    return doc;
  },

  /**
   * Generates a warehouse Packing Slip PDF
   */
  async generatePackingSlipPdf(orderId: string): Promise<PDFKit.PDFDocument> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new AppError('Order not found', 404);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.fillColor('#1f2937').fontSize(20).font('Helvetica-Bold').text('PACKING SLIP / PICK LIST', 40, 40);
    doc.fontSize(10).font('Helvetica').text(`Order #: ${order.orderNumber} | Date: ${new Date(order.createdAt).toLocaleDateString()}`, 40, 68);
    doc.text(`Delivery Slot: ${order.deliverySlot || 'Standard'} | Type: ${order.deliveryType}`, 40, 84);

    const address = order.shippingAddressSnapshot as any;
    doc.fontSize(10).font('Helvetica-Bold').text(`Customer: ${order.customerName} (${order.customerPhone})`, 330, 68);
    doc.font('Helvetica').text(`Area Pincode: ${order.pincode}`, 330, 84);

    doc.strokeColor('#d1d5db').lineWidth(1).moveTo(40, 110).lineTo(555, 110).stroke();

    const top = 125;
    doc.rect(40, top, 515, 20).fill('#e5e7eb');
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
    doc.text('Check [ ]', 45, top + 5, { width: 50 });
    doc.text('Item Name', 105, top + 5, { width: 250 });
    doc.text('SKU', 360, top + 5, { width: 70 });
    doc.text('Unit', 435, top + 5, { width: 50 });
    doc.text('Qty', 490, top + 5, { width: 60, align: 'right' });

    let y = top + 24;
    order.items.forEach((item, index) => {
      doc.rect(40, y, 515, 22).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica');
      doc.text('[   ]', 50, y + 6);
      doc.text(item.productName, 105, y + 6, { width: 250 });
      doc.text(item.productSku, 360, y + 6, { width: 70 });
      doc.text(item.unit, 435, y + 6, { width: 50 });
      doc.font('Helvetica-Bold').text(String(item.quantity), 490, y + 6, { width: 60, align: 'right' });
      y += 24;
    });

    doc.end();
    return doc;
  },

  /**
   * Generates a Delivery Dispatch Slip
   */
  async generateDeliverySlipPdf(orderId: string): Promise<PDFKit.PDFDocument> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new AppError('Order not found', 404);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.fillColor('#1e40af').fontSize(22).font('Helvetica-Bold').text('DELIVERY DISPATCH RUN-SHEET', 40, 40);
    doc.fillColor('#374151').fontSize(10).font('Helvetica').text(`Order Reference: ${order.orderNumber}`, 40, 68);

    const address = order.shippingAddressSnapshot as any;
    doc.rect(40, 95, 515, 120).fill('#eff6ff');
    doc.strokeColor('#93c5fd').rect(40, 95, 515, 120).stroke();

    doc.fillColor('#1e3a8a').fontSize(12).font('Helvetica-Bold').text('DELIVERY DETAILS & COD COLLECTION', 55, 105);
    doc.fontSize(10).font('Helvetica-Bold').text('Customer Name:', 55, 128);
    doc.font('Helvetica').text(order.customerName, 160, 128);

    doc.font('Helvetica-Bold').text('Contact Phone:', 55, 144);
    doc.font('Helvetica').text(order.customerPhone, 160, 144);

    doc.font('Helvetica-Bold').text('Delivery Address:', 55, 160);
    doc.font('Helvetica').text(
      `${address?.street || ''}, ${address?.landmark ? address.landmark + ', ' : ''}${address?.city || ''} - ${address?.pincode || ''}`,
      160,
      160,
      { width: 380 }
    );

    doc.fillColor('#dc2626').fontSize(12).font('Helvetica-Bold');
    doc.text(`CASH TO COLLECT (COD): ₹${Number(order.grandTotal).toFixed(2)}`, 55, 192);

    doc.end();
    return doc;
  },
};
