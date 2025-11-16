/**
 * AR Status Composable
 * จัดการ status labels และ colors สำหรับ AR entities
 */

import { computed, type ComputedRef } from 'vue';
import type {
  InvoiceStatus,
  ReceiptStatus,
  CreditNoteStatus,
  DepositStatus,
} from '@/types/ar/common';
import {
  INVOICE_STATUS_COLORS,
  RECEIPT_STATUS_COLORS,
  CREDIT_NOTE_STATUS_COLORS,
  DEPOSIT_STATUS_COLORS,
} from '@/types/ar/common';

// Status Labels (Thai)
const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'ร่าง',
  issued: 'ออกใบแล้ว',
  partially_paid: 'ชำระบางส่วน',
  paid: 'ชำระแล้ว',
  overdue: 'เกินกำหนด',
  cancelled: 'ยกเลิก',
};

const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  draft: 'ร่าง',
  posted: 'บันทึกแล้ว',
  cancelled: 'ยกเลิก',
};

const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  draft: 'ร่าง',
  issued: 'ออกใบแล้ว',
  cancelled: 'ยกเลิก',
};

const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  active: 'ใช้งาน',
  allocated: 'จัดสรรแล้ว',
  refunded: 'คืนเงินแล้ว',
};

/**
 * Composable สำหรับจัดการ invoice status
 */
export function useInvoiceStatus(status: InvoiceStatus | ComputedRef<InvoiceStatus>) {
  const statusValue = computed(() => (typeof status === 'string' ? status : status.value));

  const label = computed(() => INVOICE_STATUS_LABELS[statusValue.value]);
  const color = computed(() => INVOICE_STATUS_COLORS[statusValue.value]);

  const isDraft = computed(() => statusValue.value === 'draft');
  const isIssued = computed(() => statusValue.value === 'issued');
  const isPaid = computed(() => statusValue.value === 'paid');
  const isOverdue = computed(() => statusValue.value === 'overdue');
  const isCancelled = computed(() => statusValue.value === 'cancelled');

  return {
    status: statusValue,
    label,
    color,
    isDraft,
    isIssued,
    isPaid,
    isOverdue,
    isCancelled,
  };
}

/**
 * Composable สำหรับจัดการ receipt status
 */
export function useReceiptStatus(status: ReceiptStatus | ComputedRef<ReceiptStatus>) {
  const statusValue = computed(() => (typeof status === 'string' ? status : status.value));

  const label = computed(() => RECEIPT_STATUS_LABELS[statusValue.value]);
  const color = computed(() => RECEIPT_STATUS_COLORS[statusValue.value]);

  const isDraft = computed(() => statusValue.value === 'draft');
  const isPosted = computed(() => statusValue.value === 'posted');
  const isCancelled = computed(() => statusValue.value === 'cancelled');

  return {
    status: statusValue,
    label,
    color,
    isDraft,
    isPosted,
    isCancelled,
  };
}

/**
 * Composable สำหรับจัดการ credit note status
 */
export function useCreditNoteStatus(status: CreditNoteStatus | ComputedRef<CreditNoteStatus>) {
  const statusValue = computed(() => (typeof status === 'string' ? status : status.value));

  const label = computed(() => CREDIT_NOTE_STATUS_LABELS[statusValue.value]);
  const color = computed(() => CREDIT_NOTE_STATUS_COLORS[statusValue.value]);

  const isDraft = computed(() => statusValue.value === 'draft');
  const isIssued = computed(() => statusValue.value === 'issued');
  const isCancelled = computed(() => statusValue.value === 'cancelled');

  return {
    status: statusValue,
    label,
    color,
    isDraft,
    isIssued,
    isCancelled,
  };
}

/**
 * Composable สำหรับจัดการ deposit status
 */
export function useDepositStatus(status: DepositStatus | ComputedRef<DepositStatus>) {
  const statusValue = computed(() => (typeof status === 'string' ? status : status.value));

  const label = computed(() => DEPOSIT_STATUS_LABELS[statusValue.value]);
  const color = computed(() => DEPOSIT_STATUS_COLORS[statusValue.value]);

  const isActive = computed(() => statusValue.value === 'active');
  const isAllocated = computed(() => statusValue.value === 'allocated');
  const isRefunded = computed(() => statusValue.value === 'refunded');

  return {
    status: statusValue,
    label,
    color,
    isActive,
    isAllocated,
    isRefunded,
  };
}

/**
 * Helper function to get status label
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_LABELS[status];
}

export function getReceiptStatusLabel(status: ReceiptStatus): string {
  return RECEIPT_STATUS_LABELS[status];
}

export function getCreditNoteStatusLabel(status: CreditNoteStatus): string {
  return CREDIT_NOTE_STATUS_LABELS[status];
}

export function getDepositStatusLabel(status: DepositStatus): string {
  return DEPOSIT_STATUS_LABELS[status];
}
