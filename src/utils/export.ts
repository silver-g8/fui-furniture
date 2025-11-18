/**
 * Export Utilities
 * Utilities สำหรับการส่งออกข้อมูล AR เป็น CSV/Excel
 */

/**
 * Convert data to CSV format
 */
export const convertToCsv = (data: unknown[][]): string => {
  return data
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? '';
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
          }
          // For objects, try JSON.stringify or fallback to empty string
          try {
            return JSON.stringify(value);
          } catch {
            return '';
          }
        })
        .join(','),
    )
    .join('\n');
};

/**
 * Download CSV file
 */
export const downloadCsv = (data: unknown[][], filename: string): void => {
  const csv = convertToCsv(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Invoices to CSV
 */
export const exportInvoicesToCsv = (
  invoices: Array<{
    invoice_no: string;
    invoice_date: string;
    due_date: string;
    customer: { name: string; code: string };
    grand_total: string;
    paid_total: string;
    open_amount: string;
    status: string;
  }>,
  filename?: string,
): void => {
  const headers = [
    'เลขที่ใบแจ้งหนี้',
    'วันที่ออกใบ',
    'วันครบกำหนด',
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    'ยอดรวมทั้งสิ้น',
    'ชำระแล้ว',
    'คงค้างชำระ',
    'สถานะ',
  ];

  const rows = invoices.map((invoice) => [
    invoice.invoice_no,
    invoice.invoice_date,
    invoice.due_date,
    invoice.customer.code,
    invoice.customer.name,
    invoice.grand_total,
    invoice.paid_total,
    invoice.open_amount,
    invoice.status,
  ]);

  downloadCsv([headers, ...rows], filename || `invoices_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export Receipts to CSV
 */
export const exportReceiptsToCsv = (
  receipts: Array<{
    receipt_no: string;
    receipt_date: string;
    customer: { name: string; code: string };
    amount?: string;
    total_amount?: string;
    payment_method: string;
    allocated_total?: string;
    unallocated_amount?: string;
    status: string;
  }>,
  filename?: string,
): void => {
  const headers = [
    'เลขที่ใบเสร็จ',
    'วันที่รับเงิน',
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    'จำนวนเงิน',
    'วิธีชำระเงิน',
    'จัดสรรแล้ว',
    'ยังไม่ได้จัดสรร',
    'สถานะ',
  ];

  const rows = receipts.map((receipt) => [
    receipt.receipt_no,
    receipt.receipt_date,
    receipt.customer.code,
    receipt.customer.name,
    receipt.total_amount || receipt.amount || '0',
    receipt.payment_method,
    receipt.allocated_total || '0',
    receipt.unallocated_amount || '0',
    receipt.status,
  ]);

  downloadCsv([headers, ...rows], filename || `receipts_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export Credit Notes to CSV
 */
export const exportCreditNotesToCsv = (
  creditNotes: Array<{
    credit_note_no: string;
    issue_date: string;
    customer: { name: string; code: string };
    amount: string;
    type: string;
    status: string;
  }>,
  filename?: string,
): void => {
  const headers = [
    'เลขที่ใบลดหนี้',
    'วันที่ออกใบ',
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    'จำนวนเงิน',
    'ประเภท',
    'สถานะ',
  ];

  const rows = creditNotes.map((creditNote) => [
    creditNote.credit_note_no,
    creditNote.issue_date,
    creditNote.customer.code,
    creditNote.customer.name,
    creditNote.amount,
    creditNote.type,
    creditNote.status,
  ]);

  downloadCsv([headers, ...rows], filename || `credit_notes_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export Deposits to CSV
 */
export const exportDepositsToCsv = (
  deposits: Array<{
    deposit_no: string;
    deposit_date: string;
    customer: { name: string; code: string };
    amount: string;
    balance: string;
    payment_method: string;
    status: string;
  }>,
  filename?: string,
): void => {
  const headers = [
    'เลขที่เงินมัดจำ',
    'วันที่รับเงินมัดจำ',
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    'จำนวนเงิน',
    'ยอดคงเหลือ',
    'วิธีชำระเงิน',
    'สถานะ',
  ];

  const rows = deposits.map((deposit) => [
    deposit.deposit_no,
    deposit.deposit_date,
    deposit.customer.code,
    deposit.customer.name,
    deposit.amount,
    deposit.balance,
    deposit.payment_method,
    deposit.status,
  ]);

  downloadCsv([headers, ...rows], filename || `deposits_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Export generic data to CSV
 */
export const exportToCsv = (
  data: unknown[][],
  filename: string,
  headers?: unknown[],
): void => {
  const rows = headers ? [headers, ...data] : data;
  downloadCsv(rows, filename);
};

