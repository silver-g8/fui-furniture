<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">ขายเงินสด</div>
          <div class="text-subtitle2 text-grey-7">
            สร้างคำสั่งขาย → ยืนยัน → จัดส่ง → ออกใบแจ้งหนี้ → ออกใบเสร็จรับเงิน
          </div>
        </div>
        <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
      </q-card-section>

      <q-separator />

      <!-- Success Result -->
      <q-card-section
        v-if="result"
        :class="result.is_pending_payment ? 'bg-warning text-dark' : 'bg-positive text-white'"
      >
        <div class="text-h6 q-mb-md">
          <template v-if="result.is_pending_payment">
            ⚠️ ขายสำเร็จ แต่รอการชำระเงิน
          </template>
          <template v-else>
            ✅ ขายเงินสดสำเร็จ!
          </template>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Sales Order -->
          <div class="col-12 col-md-4">
            <div class="text-caption">Sales Order</div>
            <div class="text-h6">{{ result.sales_order.sales_order_no }}</div>
            <q-btn
              flat
              :color="result.is_pending_payment ? 'dark' : 'white'"
              size="sm"
              label="ดูรายละเอียด"
              @click="viewSalesOrder(result.sales_order.id)"
            />
          </div>

          <!-- Invoice -->
          <div class="col-12 col-md-4">
            <div class="text-caption">Invoice</div>
            <div class="text-h6">{{ result.invoice.invoice_no }}</div>
            <q-badge
              v-if="result.is_pending_payment"
              color="warning"
              class="q-mt-sm"
            >
              รอการชำระเงิน
            </q-badge>
            <q-btn
              flat
              :color="result.is_pending_payment ? 'dark' : 'white'"
              size="sm"
              label="ดูรายละเอียด"
              @click="viewInvoice(result.invoice.id)"
            />
          </div>

          <!-- Receipt (แสดงเฉพาะเมื่อมี) -->
          <div v-if="result.receipt" class="col-12 col-md-4">
            <div class="text-caption">Receipt</div>
            <div class="text-h6">{{ result.receipt.receipt_no }}</div>
            <q-btn
              flat
              color="white"
              size="sm"
              label="ดูรายละเอียด"
              @click="viewReceipt(result.receipt.id)"
            />
          </div>
        </div>

        <!-- แสดงคำเตือนเมื่อรอการชำระเงิน -->
        <q-banner v-if="result.is_pending_payment" class="q-mt-md bg-warning-1">
          <template #avatar>
            <q-icon name="info" color="warning" />
          </template>
          <div class="text-body2">
            การขายนี้จะถูกเก็บไว้ใน AR จนกว่าจะมีการชำระเงินเข้ามา
            <br />
            เมื่อมีการชำระเงินแล้ว ระบบจะลบข้อมูลออกอัตโนมัติ
          </div>
        </q-banner>

        <div class="q-mt-md">
          <q-btn
            :color="result.is_pending_payment ? 'dark' : 'white'"
            :text-color="result.is_pending_payment ? 'warning' : 'positive'"
            label="ขายใหม่"
            @click="resetForm"
          />
        </div>
      </q-card-section>

      <!-- Form -->
      <q-card-section v-else>
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <!-- Customer Selection (Cash Only) -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.customer_id"
                label="ลูกค้า (เงินสดเท่านั้น) *"
                outlined
                dense
                use-input
                input-debounce="400"
                :options="cashCustomerOptions"
                option-label="name"
                option-value="id"
                emit-value
                map-options
                clearable
                :loading="customersLoading"
                :rules="[(val) => !!val || 'กรุณาเลือกลูกค้า', validateCashCustomer]"
                @filter="filterCashCustomers"
                @update:model-value="handleCustomerChange"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ customerSearch ? 'ไม่พบลูกค้าเงินสด' : 'พิมพ์เพื่อค้นหาลูกค้าเงินสด' }}
                    </q-item-section>
                  </q-item>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.code }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="positive">เงินสด</q-badge>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <div v-if="selectedCustomer" class="q-mt-sm">
                <div class="text-body2">{{ selectedCustomer.name }}</div>
                <div class="text-caption text-grey-7">{{ selectedCustomer.code }}</div>
                <q-badge color="positive" class="q-mt-xs">เงินสด</q-badge>
              </div>
              <q-banner
                v-if="selectedCustomer && selectedCustomer.payment_type !== 'cash'"
                class="q-mt-sm bg-negative text-white"
              >
                ⚠️ ลูกค้านี้เป็นลูกค้าเครดิต ไม่สามารถใช้ขายเงินสดได้
              </q-banner>
            </div>

            <div class="col-12 col-md-3">
              <q-input
                v-model="deliveryDateDisplay"
                label="วันที่จัดส่ง"
                outlined
                dense
                mask="##/##/####"
                placeholder="dd/mm/yyyy"
                @update:model-value="handleDeliveryDateChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy transition-show="scale" transition-hide="scale" :offset="[0, 10]">
                      <q-date
                        v-model="form.delivery_date"
                        mask="YYYY-MM-DD"
                        @update:model-value="updateDeliveryDateDisplay"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="ปิด" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-3">
              <q-select
                v-model="form.payment_method"
                label="วิธีการชำระเงิน *"
                outlined
                dense
                :options="paymentMethodOptions"
                emit-value
                map-options
                hint="เลือกวิธีชำระเงิน"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.reference"
                label="อ้างอิง"
                outlined
                dense
                hint="หมายเลขอ้างอิงหรือเอกสารอื่นๆ"
              />
            </div>
          </div>

          <q-separator />

          <!-- Items -->
          <div class="row justify-between items-center">
            <div class="text-h6">รายการสินค้า</div>
            <q-btn
              color="primary"
              icon="add"
              label="เพิ่มสินค้า"
              @click="showProductModal = true"
            />
          </div>

          <sales-order-item-table
            :items="formItems"
            :editable="true"
            :show-stock-status="false"
            :warehouse-options="warehouseOptions"
            @remove="removeItem"
            @update="updateItem"
            @update:warehouse="handleWarehouseChange"
          />

          <q-separator />

          <div class="row justify-end q-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.discount_amount"
                label="ส่วนลด"
                outlined
                dense
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.tax_amount"
                label="ภาษี"
                outlined
                dense
                type="number"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div class="row justify-end">
            <div class="col-12 col-md-4">
              <div class="text-h6 text-right">
                ยอดรวม: {{ formatCurrency(calculatedTotal) }}
              </div>
            </div>
          </div>

          <q-input
            v-model="form.notes"
            label="หมายเหตุ"
            outlined
            dense
            type="textarea"
            rows="3"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="ยกเลิก" @click="goBack" />
            <q-btn
              type="submit"
              color="positive"
              icon="attach_money"
              label="ขายเงินสด"
              :loading="processing"
              :disable="!canProcessCashSale"
            >
              <q-tooltip v-if="!canProcessCashSale">
                กรุณาเลือกลูกค้าเงินสดและเพิ่มสินค้าอย่างน้อย 1 รายการ
              </q-tooltip>
            </q-btn>
          </div>
        </q-form>
      </q-card-section>

      <!-- Processing Indicator -->
      <q-card-section v-if="processing" class="text-center">
        <q-spinner color="primary" size="3em" />
        <div class="q-mt-md text-body1">กำลังประมวลผลขายเงินสด...</div>
        <div class="text-caption text-grey-7">
          สร้างคำสั่งขาย → ยืนยัน → จัดส่ง → ออกใบแจ้งหนี้ → ออกใบเสร็จรับเงิน
        </div>
      </q-card-section>
    </q-card>

    <product-select-modal
      v-model="showProductModal"
      :customer="selectedCustomer"
      @selected="handleProductSelected"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SalesOrderItem } from '@/types/sales';
import { listCustomers, listWarehouses, type Customer, type Warehouse } from '@/services/sales/api';
import type { Product } from '@/types/catalog';
import { getProductStockSummary } from '@/services/catalog/product.service';
import ProductSelectModal from '@/components/sales/ProductSelectModal.vue';
import SalesOrderItemTable from '@/components/sales/SalesOrderItemTable.vue';
import { formatCurrency, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/ar/common';
import { useNotifier } from '@/composables/useNotifier';
import { processCashSale, type CashSalePayload, type CashSaleResponse } from '@/services/sales/cashSale.service';
import { getQuotation } from '@/services/sales/quotation.service';
import type { Quotation } from '@/types/sales';

const route = useRoute();
const router = useRouter();
const { success: notifySuccess, error: notifyError } = useNotifier();

const showProductModal = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const customerOptions = ref<Customer[]>([]);
const cashCustomerOptions = ref<Customer[]>([]);
const customersLoading = ref(false);
const customerSearch = ref('');
const warehouseOptions = ref<Warehouse[]>([]);
const warehousesLoading = ref(false);
const deliveryDateDisplay = ref('');
const processing = ref(false);
const result = ref<CashSaleResponse | null>(null);
const quotation = ref<Quotation | null>(null);

const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  label,
  value: value as PaymentMethod,
}));

const form = ref<CashSalePayload>({
  customer_id: null,
  quotation_id: null,
  warehouse_id: null,
  delivery_date: null,
  reference: null,
  payment_term: null,
  notes: null,
  items: [],
  payment_method: 'cash',
  receipt_date: new Date().toISOString().split('T')[0] as string,
  invoice_date: new Date().toISOString().split('T')[0] as string,
  due_date: new Date().toISOString().split('T')[0] as string,
  discount_amount: 0,
  tax_amount: 0,
});

const formItems = computed(() => {
  return form.value.items.map((item) => ({
    ...item,
    total: (item.price * item.qty) - (item.discount || 0),
  }));
});

const calculatedTotal = computed(() => {
  const subtotal = form.value.items.reduce((sum, item) => {
    const itemTotal = (item.price * item.qty) - (item.discount || 0);
    return sum + itemTotal;
  }, 0);
  const discount = Number(form.value.discount_amount) || 0;
  const tax = Number(form.value.tax_amount) || 0;
  return subtotal - discount + tax;
});

const canProcessCashSale = computed(() => {
  return (
    form.value.customer_id &&
    selectedCustomer.value?.payment_type === 'cash' &&
    form.value.items.length > 0
  );
});

const validateCashCustomer = (val: number | null): boolean | string => {
  if (!val) return true;
  const customer = customerOptions.value.find((c) => c.id === val);
  if (customer && customer.payment_type !== 'cash') {
    return 'กรุณาเลือกลูกค้าเงินสดเท่านั้น';
  }
  return true;
};

const filterCashCustomers = async (val: string, update: (callback: () => void) => void) => {
  customerSearch.value = val;

  if (!val || val.length < 1) {
    update(() => {
      cashCustomerOptions.value = [];
    });
    return;
  }

  customersLoading.value = true;
  try {
    const response = await listCustomers({
      search: val,
      payment_type: 'cash',
      per_page: 20,
    });

    update(() => {
      cashCustomerOptions.value = response.data || [];
      customerOptions.value = response.data || [];
    });
  } catch (error) {
    console.error('Failed to load customers:', error);
    update(() => {
      cashCustomerOptions.value = [];
      customerOptions.value = [];
    });
  } finally {
    customersLoading.value = false;
  }
};

const handleCustomerChange = async (customerId: number | null) => {
  if (!customerId) {
    selectedCustomer.value = null;
    return;
  }

  const customer = cashCustomerOptions.value.find((c) => c.id === customerId);
  if (customer) {
    selectedCustomer.value = customer;
  } else {
    try {
      const { getCustomer } = await import('@/services/sales/api');
      const fetchedCustomer = await getCustomer(customerId);
      selectedCustomer.value = fetchedCustomer;
      if (fetchedCustomer.payment_type === 'cash') {
        cashCustomerOptions.value = [fetchedCustomer];
        customerOptions.value = [fetchedCustomer];
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
      selectedCustomer.value = null;
    }
  }
};

const loadWarehouses = async () => {
  warehousesLoading.value = true;
  try {
    warehouseOptions.value = await listWarehouses();
  } catch (error) {
    console.error('Failed to load warehouses:', error);
    warehouseOptions.value = [];
  } finally {
    warehousesLoading.value = false;
  }
};

const updateDeliveryDateDisplay = () => {
  if (form.value.delivery_date) {
    const date = new Date(form.value.delivery_date);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      deliveryDateDisplay.value = `${day}/${month}/${year}`;
    }
  } else {
    deliveryDateDisplay.value = '';
  }
};

const handleDeliveryDateChange = (value: string | number | null) => {
  const strValue = value ? String(value) : '';
  if (strValue && strValue.includes('/')) {
    const parts = strValue.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
        form.value.delivery_date = `${year}-${month}-${day}`;
      }
    }
  } else if (!strValue) {
    form.value.delivery_date = null;
  }
};

const handleProductSelected = async (product: Product) => {
  const warehouseId = null;

  const existingItemIndex = form.value.items.findIndex(
    (item) => item.product_id === product.id && item.warehouse_id === warehouseId
  );

  if (existingItemIndex >= 0) {
    const existingItem = form.value.items[existingItemIndex];
    if (existingItem) {
      existingItem.qty = (existingItem.qty || 1) + 1;
    }
  } else {
    // Load warehouse stocks for the product
    let warehouseStocks = product.warehouseStocks;
    if (!warehouseStocks) {
      try {
        warehouseStocks = await getProductStockSummary(product.id);
      } catch (error) {
        console.error('Failed to load product stock summary:', error);
        warehouseStocks = [];
      }
    }

    const item: Omit<SalesOrderItem, 'id' | 'sales_order_id'> = {
      product_id: product.id,
      qty: 1,
      price: product.priceTagged || 0,
      discount: 0,
      warehouse_id: null,
      product: {
        ...product,
        warehouseStocks: warehouseStocks,
      },
      warehouse: null,
    };
    form.value.items.push(item);
  }
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const updateItem = (index: number, updates: { qty?: number; price?: number; discount?: number }) => {
  const item = form.value.items[index];
  if (item) {
    if (updates.qty !== undefined) {
      item.qty = updates.qty;
    }
    if (updates.price !== undefined) {
      item.price = updates.price;
    }
    if (updates.discount !== undefined) {
      item.discount = updates.discount;
    }
  }
};

const handleWarehouseChange = (index: number, warehouseId: number | null) => {
  const item = form.value.items[index];
  if (item) {
    item.warehouse_id = warehouseId;
    const warehouse = warehouseId
      ? warehouseOptions.value.find((w) => w.id === warehouseId) || null
      : null;
    (item as SalesOrderItem).warehouse = warehouse
      ? {
          id: warehouse.id,
          code: warehouse.code,
          name: warehouse.name,
        }
      : null;
  }
};

const goBack = () => {
  router.back();
};

const resetForm = () => {
  result.value = null;
  form.value = {
    customer_id: null,
    quotation_id: null,
    warehouse_id: null,
    delivery_date: null,
    reference: null,
    payment_term: null,
    notes: null,
    items: [],
    payment_method: 'cash',
    receipt_date: new Date().toISOString().split('T')[0] as string,
    invoice_date: new Date().toISOString().split('T')[0] as string,
    due_date: new Date().toISOString().split('T')[0] as string,
  };
  selectedCustomer.value = null;
  cashCustomerOptions.value = [];
  customerOptions.value = [];
  deliveryDateDisplay.value = '';
};

const viewSalesOrder = (id: number) => {
  void router.push({ name: 'sales-orders-detail', params: { id } });
};

const viewInvoice = (id: number) => {
  void router.push({ name: 'ar-invoices-detail', params: { id } });
};

const viewReceipt = (id: number) => {
  void router.push({ name: 'ar-receipts-detail', params: { id } });
};


const loadQuotation = async (id: number) => {
  try {
    quotation.value = await getQuotation(id);
    
    // Pre-fill form from quotation
    if (quotation.value) {
      form.value.quotation_id = quotation.value.id;
      
      // Load customer info (only if cash customer)
      if (quotation.value.customer) {
        if (quotation.value.customer.payment_type === 'cash') {
          form.value.customer_id = quotation.value.customer.id;
          selectedCustomer.value = quotation.value.customer;
          // Add customer to options for q-select
          cashCustomerOptions.value = [quotation.value.customer];
          customerOptions.value = [quotation.value.customer];
        } else {
          notifyError({ 
            message: 'ลูกค้านี้เป็นลูกค้าเครดิต ไม่สามารถใช้ขายเงินสดได้ กรุณาใช้ "สร้าง Sales Order" แทน' 
          });
        }
      }
      
      // Load items from quotation
      if (quotation.value.items && quotation.value.items.length > 0) {
        // Load warehouse stocks for each product if not already loaded
        const itemsWithStocks = await Promise.all(
          quotation.value.items.map(async (item) => {
            let warehouseStocks = item.product?.warehouseStocks;
            if (!warehouseStocks || warehouseStocks.length === 0) {
              try {
                warehouseStocks = await getProductStockSummary(item.product_id);
              } catch (error) {
                console.error('Failed to load warehouse stocks:', error);
                warehouseStocks = [];
              }
            }
            
            // Use warehouse_id from quotation item if available
            const itemWarehouseId = item.warehouse_id || null;
            const itemWarehouse = itemWarehouseId
              ? (item.warehouse || warehouseOptions.value.find((w) => w.id === itemWarehouseId) || null)
              : null;
            
            return {
              product_id: item.product_id,
              qty: item.qty,
              price: item.price,
              discount: item.discount || 0,
              warehouse_id: itemWarehouseId,
              product: item.product
                ? {
                    ...item.product,
                    warehouseStocks,
                  }
                : undefined,
              warehouse: itemWarehouse
                ? {
                    id: itemWarehouse.id,
                    code: itemWarehouse.code,
                    name: itemWarehouse.name,
                  }
                : null,
            };
          }),
        );
        form.value.items = itemsWithStocks;
      }
      
      // Copy discount and tax if available
      if (quotation.value.discount !== undefined) {
        form.value.discount_amount = quotation.value.discount || 0;
      }
      if (quotation.value.tax !== undefined) {
        form.value.tax_amount = quotation.value.tax || 0;
      }
      
      // Copy notes if available
      if (quotation.value.notes) {
        form.value.notes = quotation.value.notes;
      }
    }
  } catch (error) {
    console.error('Failed to load quotation:', error);
    notifyError({ message: 'ไม่สามารถโหลดข้อมูลใบเสนอราคาได้' });
  }
};

onMounted(async () => {
  await loadWarehouses();
  
  // Load quotation if quotation_id is in query
  const quotationIdParam = route.query.quotation_id as string | undefined;
  if (quotationIdParam) {
    await loadQuotation(Number(quotationIdParam));
  }
});

const handleSubmit = async () => {
  if (form.value.items.length === 0) {
    notifyError({ message: 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ' });
    return;
  }

  if (!form.value.customer_id) {
    notifyError({ message: 'กรุณาเลือกลูกค้า' });
    return;
  }

  if (selectedCustomer.value?.payment_type !== 'cash') {
    notifyError({ message: 'กรุณาเลือกลูกค้าเงินสดเท่านั้น' });
    return;
  }

  processing.value = true;

  try {
    const itemsForPayload = form.value.items.map((item) => {
      const itemWithRelations = item as SalesOrderItem;
      const { product, warehouse, ...itemWithoutRelations } = itemWithRelations;
      void product;
      void warehouse;
      return {
        ...itemWithoutRelations,
        discount: itemWithoutRelations.discount ?? 0,
      };
    });

    const payload: CashSalePayload = {
      customer_id: form.value.customer_id,
      quotation_id: form.value.quotation_id ?? null,
      warehouse_id: null,
      delivery_date: form.value.delivery_date ?? null,
      reference: form.value.reference ?? null,
      notes: form.value.notes ?? null,
      items: itemsForPayload,
      total_amount: calculatedTotal.value,
      status: 'draft',
      payment_method: form.value.payment_method || 'cash',
      receipt_date: (form.value.receipt_date || new Date().toISOString().split('T')[0]) as string,
      invoice_date: (form.value.invoice_date || new Date().toISOString().split('T')[0]) as string,
      due_date: (form.value.due_date || new Date().toISOString().split('T')[0]) as string,
      reference_no: form.value.reference_no ?? null,
      receipt_note: form.value.notes ?? null,
      discount_amount: form.value.discount_amount ?? 0,
      tax_amount: form.value.tax_amount ?? 0,
    };

    result.value = await processCashSale(payload);
    if (result.value.is_pending_payment) {
      notifySuccess({ message: 'ขายสำเร็จ แต่รอการชำระเงิน' });
    } else {
      notifySuccess({ message: 'ขายเงินสดสำเร็จ!' });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ไม่สามารถขายเงินสดได้';
    notifyError({ message });
  } finally {
    processing.value = false;
  }
};
</script>

