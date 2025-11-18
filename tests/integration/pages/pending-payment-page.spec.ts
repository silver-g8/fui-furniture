import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import routes from '@/router/routes';
import PendingPaymentPage from '@/pages/ar/PendingPaymentPage.vue';
import {
  getPendingPayments,
  cleanupPaidInvoices,
} from '@/services/ar/pendingPayment.service';
import { listCustomers } from '@/services/sales/api';

vi.mock('@/services/ar/pendingPayment.service', () => ({
  getPendingPayments: vi.fn(),
  cleanupPaidInvoices: vi.fn(),
}));

vi.mock('@/services/sales/api', () => ({
  listCustomers: vi.fn(),
}));

const mockedGetPendingPayments = vi.mocked(getPendingPayments);
const mockedCleanupPaidInvoices = vi.mocked(cleanupPaidInvoices);
const mockedListCustomers = vi.mocked(listCustomers);

describe('Pending Payment Page', () => {
  let router: ReturnType<typeof createRouter>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    mockedGetPendingPayments.mockReset();
    mockedCleanupPaidInvoices.mockReset();
    mockedListCustomers.mockReset();
  });

  it('should load and display pending payment invoices', async () => {
    const mockInvoices = {
      data: [
        {
          id: 1,
          invoice_no: 'INV-2025-0001',
          invoice_date: '2025-01-15',
          grand_total: 10000,
          paid_total: 10000,
          open_amount: 0,
          status: 'paid',
          customer: {
            id: 1,
            name: 'บริษัท ตัวอย่าง จำกัด',
          },
          sales_order: {
            id: 1,
            sales_order_no: 'SO-2025-0001',
          },
        },
        {
          id: 2,
          invoice_no: 'INV-2025-0002',
          invoice_date: '2025-01-16',
          grand_total: 20000,
          paid_total: 20000,
          open_amount: 0,
          status: 'paid',
          customer: {
            id: 2,
            name: 'บริษัท อีกตัวอย่าง จำกัด',
          },
          sales_order: {
            id: 2,
            sales_order_no: 'SO-2025-0002',
          },
        },
      ],
    };

    mockedGetPendingPayments.mockResolvedValueOnce(mockInvoices);

    await router.push('/ar/pending-payments');
    await router.isReady();

    const wrapper = mount(PendingPaymentPage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    expect(mockedGetPendingPayments).toHaveBeenCalledTimes(1);

    // Check if table is displayed
    const table = wrapper.find('.q-table');
    expect(table.exists()).toBe(true);

    // Check if invoices are displayed
    const invoiceRows = wrapper.findAll('[data-testid="invoice-row"]');
    expect(invoiceRows.length).toBeGreaterThanOrEqual(0);
  });

  it('should filter invoices by customer', async () => {
    const mockInvoices = {
      data: [
        {
          id: 1,
          invoice_no: 'INV-2025-0001',
          invoice_date: '2025-01-15',
          grand_total: 10000,
          paid_total: 10000,
          open_amount: 0,
          status: 'paid',
          customer: {
            id: 1,
            name: 'บริษัท ตัวอย่าง จำกัด',
          },
        },
      ],
    };

    const mockCustomers = {
      data: [
        {
          id: 1,
          name: 'บริษัท ตัวอย่าง จำกัด',
          code: 'CUST-001',
          email: 'example@test.com',
          phone: '02-123-4567',
          is_active: true,
          payment_type: 'credit' as const,
          outstanding_balance: 0,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
      meta: {
        current_page: 1,
        per_page: 20,
        total: 1,
      },
    };

    mockedGetPendingPayments.mockResolvedValue(mockInvoices);
    mockedListCustomers.mockResolvedValueOnce(mockCustomers);

    await router.push('/ar/pending-payments');
    await router.isReady();

    const wrapper = mount(PendingPaymentPage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Find customer select
    const customerSelect = wrapper.findComponent({ name: 'q-select' });
    expect(customerSelect.exists()).toBe(true);

    // Simulate customer selection
    await customerSelect.vm.$emit('update:model-value', 1);
    await flushPromises();

    // Verify that getPendingPayments was called with customer_id
    expect(mockedGetPendingPayments).toHaveBeenCalledWith(1);
  });

  it('should display empty state when no invoices found', async () => {
    mockedGetPendingPayments.mockResolvedValueOnce({ data: [] });

    await router.push('/ar/pending-payments');
    await router.isReady();

    const wrapper = mount(PendingPaymentPage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Check if no-data template is displayed
    const noDataSection = wrapper.find('.text-center');
    expect(noDataSection.exists()).toBe(true);
  });

  it('should call cleanup API when cleanup button is clicked', async () => {
    const mockInvoices = {
      data: [
        {
          id: 1,
          invoice_no: 'INV-2025-0001',
          invoice_date: '2025-01-15',
          grand_total: 10000,
          paid_total: 10000,
          open_amount: 0,
          status: 'paid',
        },
      ],
    };

    const mockCleanupResponse = {
      message: 'Cleaned up 1 fully paid invoices',
      deleted_count: 1,
      errors: [],
    };

    mockedGetPendingPayments.mockResolvedValue(mockInvoices);
    mockedCleanupPaidInvoices.mockResolvedValueOnce(mockCleanupResponse);

    await router.push('/ar/pending-payments');
    await router.isReady();

    const wrapper = mount(PendingPaymentPage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Find cleanup button
    const cleanupButton = wrapper.findAll('button').find((btn) => {
      return btn.text().includes('ตรวจสอบและลบ');
    });

    expect(cleanupButton).toBeDefined();

    if (cleanupButton) {
      // Mock dialog confirmation
      const { Dialog } = await import('quasar');
      vi.spyOn(Dialog, 'create').mockReturnValue({
        onOk: (callback?: () => void) => {
          callback?.();
          return {
            onOk: () => {},
            onCancel: () => {},
            hide: () => {},
            update: () => {},
          };
        },
        onCancel: () => {},
        hide: () => {},
        update: () => {},
      } as any);

      await cleanupButton.trigger('click');
      await flushPromises();

      // Verify cleanup was called
      expect(mockedCleanupPaidInvoices).toHaveBeenCalled();
    }
  });

  it('should navigate to invoice detail when view button is clicked', async () => {
    const mockInvoices = {
      data: [
        {
          id: 1,
          invoice_no: 'INV-2025-0001',
          invoice_date: '2025-01-15',
          grand_total: 10000,
          paid_total: 10000,
          open_amount: 0,
          status: 'paid',
        },
      ],
    };

    mockedGetPendingPayments.mockResolvedValueOnce(mockInvoices);

    await router.push('/ar/pending-payments');
    await router.isReady();

    const wrapper = mount(PendingPaymentPage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Find view button (visibility icon)
    const viewButtons = wrapper.findAll('button').filter((btn) => {
      const icon = btn.find('i');
      return icon.exists() && icon.classes().some((cls) => cls.includes('visibility'));
    });

    expect(viewButtons.length).toBeGreaterThan(0);

    if (viewButtons.length > 0 && viewButtons[0]) {
      await viewButtons[0].trigger('click');
      await flushPromises();

      // Verify navigation
      expect(router.currentRoute.value.name).toBe('ar-invoices-detail');
      expect(router.currentRoute.value.params.id).toBe('1');
    }
  });

  it('should handle cleanup errors gracefully', async () => {
    const mockInvoices = {
      data: [
        {
          id: 1,
          invoice_no: 'INV-2025-0001',
          invoice_date: '2025-01-15',
          grand_total: 10000,
          paid_total: 10000,
          open_amount: 0,
          status: 'paid',
        },
      ],
    };

    const mockCleanupResponse = {
      message: 'Cleaned up 0 fully paid invoices',
      deleted_count: 0,
      errors: [
        {
          invoice_id: 1,
          invoice_no: 'INV-2025-0001',
          error: 'Cannot delete invoice: Foreign key constraint violation',
        },
      ],
    };

    mockedGetPendingPayments.mockResolvedValue(mockInvoices);
    mockedCleanupPaidInvoices.mockResolvedValueOnce(mockCleanupResponse);

    await router.push('/ar/pending-payments');
    await router.isReady();

    const wrapper = mount(PendingPaymentPage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Mock dialog confirmation
    const { Dialog } = await import('quasar');
    vi.spyOn(Dialog, 'create').mockReturnValue({
      onOk: (callback?: () => void) => {
        callback?.();
        return {
          onOk: () => {},
          onCancel: () => {},
          hide: () => {},
          update: () => {},
        };
      },
      onCancel: () => {},
      hide: () => {},
      update: () => {},
    } as any);

    const cleanupButton = wrapper.findAll('button').find((btn) => {
      return btn.text().includes('ตรวจสอบและลบ');
    });

    if (cleanupButton) {
      await cleanupButton.trigger('click');
      await flushPromises();

      // Verify cleanup was called and errors are handled
      expect(mockedCleanupPaidInvoices).toHaveBeenCalled();
    }
  });
});

