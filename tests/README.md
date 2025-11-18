# Frontend Testing Guide

## Overview

Tests สำหรับระบบ Cash Sale และ AR Pending Payment Management

## Test Structure

```
tests/
├── integration/
│   └── pages/
│       ├── cash-sale-flow.spec.ts      # E2E tests สำหรับ Cash Sale flow
│       └── pending-payment-page.spec.ts # E2E tests สำหรับ Pending Payment page
└── unit/
    └── ...                              # Unit tests
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
# Cash Sale Flow tests
npm test -- tests/integration/pages/cash-sale-flow.spec.ts

# Pending Payment Page tests
npm test -- tests/integration/pages/pending-payment-page.spec.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

## Test Cases

### Cash Sale Flow Tests (`cash-sale-flow.spec.ts`)

1. **should display success message and receipt when cash payment is successful**
   - ทดสอบว่าเมื่อชำระเงินสดสำเร็จ จะแสดง success message และ receipt section

2. **should display pending payment warning when payment method is not cash**
   - ทดสอบว่าเมื่อชำระเงินไม่ใช่เงินสด จะแสดง warning และ `is_pending_payment: true`

3. **should hide receipt section when receipt is null**
   - ทดสอบว่าเมื่อ `receipt` เป็น `null` จะซ่อน receipt section

4. **should show pending payment banner when is_pending_payment is true**
   - ทดสอบว่าเมื่อ `is_pending_payment` เป็น `true` จะแสดง warning banner

### Pending Payment Page Tests (`pending-payment-page.spec.ts`)

1. **should load and display pending payment invoices**
   - ทดสอบการโหลดและแสดงรายการ Invoice ที่รอการชำระเงิน

2. **should filter invoices by customer**
   - ทดสอบการกรอง Invoice ตามลูกค้า

3. **should display empty state when no invoices found**
   - ทดสอบการแสดง empty state เมื่อไม่มี Invoice

4. **should call cleanup API when cleanup button is clicked**
   - ทดสอบการเรียก cleanup API เมื่อคลิกปุ่ม cleanup

5. **should navigate to invoice detail when view button is clicked**
   - ทดสอบการ navigate ไปยังหน้า Invoice detail

6. **should handle cleanup errors gracefully**
   - ทดสอบการจัดการ errors เมื่อ cleanup ล้มเหลว

## Mocking

Tests ใช้ Vitest mocking สำหรับ:

- `@/services/sales/cashSale.service` - Mock `processCashSale`
- `@/services/ar/pendingPayment.service` - Mock `getPendingPayments`, `cleanupPaidInvoices`
- `@/services/sales/api` - Mock `listCustomers`, `listWarehouses`
- `@/services/catalog/product.service` - Mock `getProductStockSummary`
- `quasar` - Mock `Dialog`, `Notify`, `Loading`

## Test Utilities

### Router Setup

```typescript
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
```

### Pinia Setup

```typescript
const pinia = createPinia();
setActivePinia(pinia);
```

### Component Mounting

```typescript
const wrapper = mount(Component, {
  global: {
    plugins: [pinia, router],
  },
});
```

## Best Practices

1. **Reset Mocks**: ใช้ `beforeEach` เพื่อ reset mocks ก่อนแต่ละ test
2. **Flush Promises**: ใช้ `flushPromises()` หลังจาก async operations
3. **Wait for Router**: ใช้ `router.isReady()` ก่อน mount component
4. **Test User Interactions**: ทดสอบ user interactions เช่น button clicks, form submissions
5. **Test Error Handling**: ทดสอบ error scenarios และ edge cases

## Troubleshooting

### Tests Fail with "Cannot find module"

ตรวจสอบว่า:

- Path aliases ถูกต้องใน `vitest.config.ts`
- Mock paths ถูกต้อง
- Import paths ใช้ alias (`@/`) แทน relative paths

### Tests Fail with "Component not found"

ตรวจสอบว่า:

- Component path ถูกต้อง
- Component export เป็น default export
- Quasar components ถูก stub ใน `vitest.setup.ts`

### Tests Timeout

เพิ่ม timeout ใน test:

```typescript
it(
  'test name',
  async () => {
    // test code
  },
  { timeout: 10000 },
);
```

## Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: > 70% coverage
- **E2E Tests**: Cover all critical user flows

## Continuous Integration

Tests จะรันอัตโนมัติใน CI/CD pipeline:

```yaml
# Example CI configuration
- name: Run tests
  run: npm test
```

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Vue Components](https://vuejs.org/guide/scaling-up/testing.html)
