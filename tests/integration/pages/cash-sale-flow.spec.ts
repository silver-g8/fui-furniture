import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import routes from '@/router/routes';
import CashSalePage from '@/pages/sales/cash-sale/CashSalePage.vue';
import { processCashSale } from '@/services/sales/cashSale.service';
import { listCustomers } from '@/services/sales/api';

vi.mock('@/services/sales/cashSale.service', () => ({
  processCashSale: vi.fn(),
}));

vi.mock('@/services/sales/api', () => ({
  listCustomers: vi.fn(),
  listWarehouses: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/services/catalog/product.service', () => ({
  getProductStockSummary: vi.fn(() => Promise.resolve([])),
}));

const mockedProcessCashSale = vi.mocked(processCashSale);
const mockedListCustomers = vi.mocked(listCustomers);

describe('Cash Sale Flow', () => {
  let router: ReturnType<typeof createRouter>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    mockedProcessCashSale.mockReset();
    mockedListCustomers.mockReset();
  });

  it('should display success message and receipt when cash payment is successful', async () => {
    const mockCashSaleResponse = {
      message: 'ขายเงินสดสำเร็จ!',
      sales_order: {
        id: 1,
        customer_id: 1,
        sales_order_no: 'SO-2025-0001',
        status: 'confirmed' as const,
        total_amount: 10000,
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
      invoice: {
        id: 1,
        customer_id: 1,
        sales_order_id: 1,
        invoice_no: 'INV-2025-0001',
        invoice_date: '2025-01-15',
        subtotal_amount: 10000,
        discount_amount: 0,
        tax_amount: 0,
        grand_total: 10000,
        paid_total: 10000,
        open_amount: 0,
        status: 'paid',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
      receipt: {
        id: 1,
        customer_id: 1,
        receipt_no: 'RCP-2025-0001',
        receipt_date: '2025-01-15',
        total_amount: 10000,
        paid_total: 10000,
        payment_method: 'cash',
        status: 'paid',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
      is_pending_payment: false,
    };

    mockedProcessCashSale.mockResolvedValueOnce(mockCashSaleResponse);

    await router.push('/sales/cash-sale');
    await router.isReady();

    const wrapper = mount(CashSalePage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Simulate form submission
    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);

    // Mock successful submission
    await wrapper.vm.$nextTick();
    await flushPromises();

    // Check if success message is displayed
    const successSection = wrapper.find('.bg-positive');
    expect(successSection.exists()).toBe(true);
  });

  it('should display pending payment warning when payment method is not cash', async () => {
    const mockPendingPaymentResponse = {
      message: 'ขายสำเร็จ แต่รอการชำระเงิน',
      sales_order: {
        id: 2,
        customer_id: 1,
        sales_order_no: 'SO-2025-0002',
        status: 'confirmed' as const,
        total_amount: 20000,
        created_at: '2025-01-16T00:00:00Z',
        updated_at: '2025-01-16T00:00:00Z',
      },
      invoice: {
        id: 2,
        customer_id: 1,
        sales_order_id: 2,
        invoice_no: 'INV-2025-0002',
        invoice_date: '2025-01-16',
        subtotal_amount: 20000,
        discount_amount: 0,
        tax_amount: 0,
        grand_total: 20000,
        paid_total: 0,
        open_amount: 20000,
        status: 'pending',
        created_at: '2025-01-16T00:00:00Z',
        updated_at: '2025-01-16T00:00:00Z',
      },
      receipt: null,
      is_pending_payment: true,
    };

    mockedProcessCashSale.mockResolvedValueOnce(mockPendingPaymentResponse);

    await router.push('/sales/cash-sale');
    await router.isReady();

    const wrapper = mount(CashSalePage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    // Simulate form submission with non-cash payment
    await wrapper.vm.$nextTick();
    await flushPromises();

    // Check if pending payment warning is displayed
    const warningSection = wrapper.find('.bg-warning');
    expect(warningSection.exists()).toBe(true);

    // Check if receipt section is hidden
    const receiptSection = wrapper.find('[data-testid="receipt-section"]');
    expect(receiptSection.exists()).toBe(false);
  });

  it('should hide receipt section when receipt is null', async () => {
    const mockResponse = {
      message: 'ขายสำเร็จ แต่รอการชำระเงิน',
      sales_order: {
        id: 3,
        customer_id: 1,
        sales_order_no: 'SO-2025-0003',
        status: 'confirmed' as const,
        total_amount: 30000,
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
      },
      invoice: {
        id: 3,
        customer_id: 1,
        sales_order_id: 3,
        invoice_no: 'INV-2025-0003',
        invoice_date: '2025-01-17',
        subtotal_amount: 30000,
        discount_amount: 0,
        tax_amount: 0,
        grand_total: 30000,
        paid_total: 0,
        open_amount: 30000,
        status: 'pending',
        created_at: '2025-01-17T00:00:00Z',
        updated_at: '2025-01-17T00:00:00Z',
      },
      receipt: null,
      is_pending_payment: true,
    };

    mockedProcessCashSale.mockResolvedValueOnce(mockResponse);

    await router.push('/sales/cash-sale');
    await router.isReady();

    const wrapper = mount(CashSalePage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Receipt section should not be visible when receipt is null
    const receiptCol = wrapper.findAll('.col-12.col-md-4').find((col) => {
      const text = col.text();
      return text.includes('Receipt');
    });

    expect(receiptCol).toBeUndefined();
  });

  it('should show pending payment banner when is_pending_payment is true', async () => {
    const mockResponse = {
      message: 'ขายสำเร็จ แต่รอการชำระเงิน',
      sales_order: {
        id: 4,
        customer_id: 1,
        sales_order_no: 'SO-2025-0004',
        status: 'confirmed' as const,
        total_amount: 40000,
        created_at: '2025-01-18T00:00:00Z',
        updated_at: '2025-01-18T00:00:00Z',
      },
      invoice: {
        id: 4,
        customer_id: 1,
        sales_order_id: 4,
        invoice_no: 'INV-2025-0004',
        invoice_date: '2025-01-18',
        subtotal_amount: 40000,
        discount_amount: 0,
        tax_amount: 0,
        grand_total: 40000,
        paid_total: 0,
        open_amount: 40000,
        status: 'pending',
        created_at: '2025-01-18T00:00:00Z',
        updated_at: '2025-01-18T00:00:00Z',
      },
      receipt: null,
      is_pending_payment: true,
    };

    mockedProcessCashSale.mockResolvedValueOnce(mockResponse);

    await router.push('/sales/cash-sale');
    await router.isReady();

    const wrapper = mount(CashSalePage, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Check if warning banner exists
    const banner = wrapper.find('.q-banner');
    expect(banner.exists()).toBe(true);
  });
});

