/**
 * Print Utilities
 * Utilities สำหรับการพิมพ์เอกสาร AR
 */

/**
 * Print HTML content
 */
export const printHtml = (html: string, title?: string): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Print'}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              font-family: 'Sarabun', 'Helvetica', 'Arial', sans-serif;
              font-size: 12pt;
              line-height: 1.5;
            }
            .no-print {
              display: none;
            }
          }
          body {
            font-family: 'Sarabun', 'Helvetica', 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .text-bold {
            font-weight: bold;
          }
          .mb-1 { margin-bottom: 0.5rem; }
          .mb-2 { margin-bottom: 1rem; }
          .mb-3 { margin-bottom: 1.5rem; }
          .mt-1 { margin-top: 0.5rem; }
          .mt-2 { margin-top: 1rem; }
          .mt-3 { margin-top: 1.5rem; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print();
    // Close window after printing (optional)
    // printWindow.close();
  }, 250);
};

/**
 * Print current page (simple print)
 */
export const printPage = (): void => {
  window.print();
};

/**
 * Generate Invoice HTML for printing
 */
export const generateInvoiceHtml = (invoice: {
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  customer: { name: string; code: string };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
  }>;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  paid_total: string;
  open_amount: string;
  note?: string | null;
}): string => {
  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1>ใบแจ้งหนี้</h1>
      <h2>INVOICE</h2>
    </div>

    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>เลขที่ใบแจ้งหนี้:</strong> ${invoice.invoice_no}<br>
            <strong>วันที่ออกใบ:</strong> ${formatDate(invoice.invoice_date)}<br>
            <strong>วันครบกำหนด:</strong> ${formatDate(invoice.due_date)}
          </td>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>ลูกค้า:</strong> ${invoice.customer.name}<br>
            <strong>รหัสลูกค้า:</strong> ${invoice.customer.code}
          </td>
        </tr>
      </table>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;">ลำดับ</th>
          <th style="width: 45%;">รายละเอียด</th>
          <th style="width: 10%;" class="text-right">จำนวน</th>
          <th style="width: 15%;" class="text-right">ราคาต่อหน่วย</th>
          <th style="width: 15%;" class="text-right">ส่วนลด</th>
          <th style="width: 10%;" class="text-right">รวม</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unit_price)}</td>
            <td class="text-right">${formatCurrency(item.discount_amount)}</td>
            <td class="text-right">${formatCurrency(item.line_total)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <div style="margin-top: 20px; text-align: right;">
      <table style="width: 40%; margin-left: auto; border: none;">
        <tr>
          <td style="border: none; text-align: right;">ยอดรวมก่อนภาษี:</td>
          <td style="border: none; text-align: right;">${formatCurrency(invoice.subtotal_amount)}</td>
        </tr>
        <tr>
          <td style="border: none; text-align: right;">ส่วนลด:</td>
          <td style="border: none; text-align: right;">-${formatCurrency(invoice.discount_amount)}</td>
        </tr>
        <tr>
          <td style="border: none; text-align: right;">ภาษี:</td>
          <td style="border: none; text-align: right;">${formatCurrency(invoice.tax_amount)}</td>
        </tr>
        <tr style="border-top: 2px solid #000;">
          <td style="border: none; text-align: right; font-weight: bold;">ยอดรวมทั้งสิ้น:</td>
          <td style="border: none; text-align: right; font-weight: bold;">${formatCurrency(invoice.grand_total)}</td>
        </tr>
        <tr>
          <td style="border: none; text-align: right;">ชำระแล้ว:</td>
          <td style="border: none; text-align: right;">${formatCurrency(invoice.paid_total)}</td>
        </tr>
        <tr>
          <td style="border: none; text-align: right; font-weight: bold;">คงค้างชำระ:</td>
          <td style="border: none; text-align: right; font-weight: bold;">${formatCurrency(invoice.open_amount)}</td>
        </tr>
      </table>
    </div>

    ${invoice.note ? `<div style="margin-top: 20px;"><strong>หมายเหตุ:</strong> ${invoice.note}</div>` : ''}
  `;
};

/**
 * Generate Receipt HTML for printing
 */
export const generateReceiptHtml = (receipt: {
  receipt_no: string;
  receipt_date: string;
  customer: { name: string; code: string };
  amount?: string;
  total_amount?: string;
  payment_method: string;
  bank_account?: string | null;
  cheque_no?: string | null;
  cheque_date?: string | null;
  reference_no?: string | null;
  allocations?: Array<{
    invoice: { invoice_no: string };
    allocated_amount: number;
  }>;
  note?: string | null;
}): string => {
  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'เงินสด',
    bank_transfer: 'โอนเงิน',
    cheque: 'เช็ค',
    credit_card: 'บัตรเครดิต',
    promissory_note: 'ตั๋วเงิน',
  };

  return `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1>ใบเสร็จรับเงิน</h1>
      <h2>RECEIPT</h2>
    </div>

    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>เลขที่ใบเสร็จ:</strong> ${receipt.receipt_no}<br>
            <strong>วันที่รับเงิน:</strong> ${formatDate(receipt.receipt_date)}<br>
            <strong>วิธีชำระเงิน:</strong> ${paymentMethodLabels[receipt.payment_method] || receipt.payment_method}
            ${receipt.bank_account ? `<br><strong>บัญชีธนาคาร:</strong> ${receipt.bank_account}` : ''}
            ${receipt.cheque_no ? `<br><strong>เลขที่เช็ค:</strong> ${receipt.cheque_no}` : ''}
            ${receipt.cheque_date ? `<br><strong>วันที่เช็ค:</strong> ${formatDate(receipt.cheque_date)}` : ''}
            ${receipt.reference_no ? `<br><strong>เลขที่อ้างอิง:</strong> ${receipt.reference_no}` : ''}
          </td>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>ลูกค้า:</strong> ${receipt.customer.name}<br>
            <strong>รหัสลูกค้า:</strong> ${receipt.customer.code}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3>จำนวนเงินที่รับ: ${formatCurrency(receipt.total_amount || receipt.amount || '0')} บาท</h3>
    </div>

    ${receipt.allocations && receipt.allocations.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">ลำดับ</th>
            <th style="width: 60%;">เลขที่ใบแจ้งหนี้</th>
            <th style="width: 35%;" class="text-right">จำนวนเงินที่จัดสรร</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.allocations
            .map(
              (alloc, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${alloc.invoice.invoice_no}</td>
              <td class="text-right">${formatCurrency(alloc.allocated_amount)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    ` : ''}

    ${receipt.note ? `<div style="margin-top: 20px;"><strong>หมายเหตุ:</strong> ${receipt.note}</div>` : ''}
  `;
};

/**
 * Generate Credit Note HTML for printing
 */
export const generateCreditNoteHtml = (creditNote: {
  credit_note_no: string;
  issue_date: string;
  customer: { name: string; code: string };
  invoice?: { invoice_no: string } | null;
  amount: string;
  type: string;
  reason?: string | null;
  note?: string | null;
}): string => {
  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const typeLabels: Record<string, string> = {
    return: 'คืนสินค้า',
    discount: 'ส่วนลด',
    adjustment: 'ปรับปรุงยอด',
  };

  return `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1>ใบลดหนี้</h1>
      <h2>CREDIT NOTE</h2>
    </div>

    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>เลขที่ใบลดหนี้:</strong> ${creditNote.credit_note_no}<br>
            <strong>วันที่ออกใบ:</strong> ${formatDate(creditNote.issue_date)}<br>
            <strong>ประเภท:</strong> ${typeLabels[creditNote.type] || creditNote.type}
            ${creditNote.invoice ? `<br><strong>ใบแจ้งหนี้:</strong> ${creditNote.invoice.invoice_no}` : ''}
          </td>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>ลูกค้า:</strong> ${creditNote.customer.name}<br>
            <strong>รหัสลูกค้า:</strong> ${creditNote.customer.code}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3>จำนวนเงิน: ${formatCurrency(creditNote.amount)} บาท</h3>
    </div>

    ${creditNote.reason ? `<div style="margin-bottom: 20px;"><strong>เหตุผล:</strong> ${creditNote.reason}</div>` : ''}
    ${creditNote.note ? `<div style="margin-top: 20px;"><strong>หมายเหตุ:</strong> ${creditNote.note}</div>` : ''}
  `;
};

/**
 * Generate Deposit HTML for printing
 */
export const generateDepositHtml = (deposit: {
  deposit_no: string;
  deposit_date: string;
  customer: { name: string; code: string };
  amount: string;
  balance: string;
  payment_method: string;
  payment_ref?: string | null;
  note?: string | null;
}): string => {
  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'เงินสด',
    bank_transfer: 'โอนเงิน',
    cheque: 'เช็ค',
    credit_card: 'บัตรเครดิต',
    promissory_note: 'ตั๋วเงิน',
  };

  return `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1>เงินมัดจำลูกค้า</h1>
      <h2>CUSTOMER DEPOSIT</h2>
    </div>

    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>เลขที่เงินมัดจำ:</strong> ${deposit.deposit_no}<br>
            <strong>วันที่รับเงินมัดจำ:</strong> ${formatDate(deposit.deposit_date)}<br>
            <strong>วิธีชำระเงิน:</strong> ${paymentMethodLabels[deposit.payment_method] || deposit.payment_method}
            ${deposit.payment_ref ? `<br><strong>เลขที่อ้างอิง:</strong> ${deposit.payment_ref}` : ''}
          </td>
          <td style="width: 50%; border: none; vertical-align: top;">
            <strong>ลูกค้า:</strong> ${deposit.customer.name}<br>
            <strong>รหัสลูกค้า:</strong> ${deposit.customer.code}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <table style="width: 50%; margin-left: auto; border: none;">
        <tr>
          <td style="border: none; text-align: right;">จำนวนเงิน:</td>
          <td style="border: none; text-align: right; font-weight: bold;">${formatCurrency(deposit.amount)}</td>
        </tr>
        <tr>
          <td style="border: none; text-align: right;">ยอดคงเหลือ:</td>
          <td style="border: none; text-align: right; font-weight: bold;">${formatCurrency(deposit.balance)}</td>
        </tr>
      </table>
    </div>

    ${deposit.note ? `<div style="margin-top: 20px;"><strong>หมายเหตุ:</strong> ${deposit.note}</div>` : ''}
  `;
};

