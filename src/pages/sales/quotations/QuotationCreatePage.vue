<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ isEditMode ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่' }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ isEditMode ? 'แก้ไขข้อมูลใบเสนอราคา' : 'กรอกข้อมูลใบเสนอราคาเพื่อสร้างรายการใหม่' }}
          </div>
        </div>
        <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                :model-value="selectedCustomer ? selectedCustomer.name : ''"
                label="ลูกค้า *"
                outlined
                dense
                readonly
                :rules="[(val) => !!form.customer_id || 'กรุณาเลือกลูกค้า']"
              >
                <template #append>
                  <q-btn
                    flat
                    dense
                    icon="search"
                    @click="showCustomerModal = true"
                  />
                </template>
              </q-input>
              <div v-if="selectedCustomer" class="q-mt-xs">
                <div class="text-caption text-grey-7">{{ selectedCustomer.code }}</div>
              </div>
            </div>

            <div class="col-12 col-md-3">
              <q-input
                v-model="quotationDateDisplay"
                label="วันที่ *"
                outlined
                dense
                mask="##/##/####"
                placeholder="dd/mm/yyyy"
                :rules="[(val) => !!form.quotation_date || 'กรุณาเลือกวันที่']"
                @update:model-value="handleQuotationDateChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      transition-show="scale"
                      transition-hide="scale"
                      :offset="[0, 10]"
                    >
                      <q-date
                        v-model="form.quotation_date"
                        mask="YYYY-MM-DD"
                        @update:model-value="updateQuotationDateDisplay"
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
              <q-input
                v-model="expiryDateDisplay"
                label="วันหมดอายุ"
                outlined
                dense
                mask="##/##/####"
                placeholder="dd/mm/yyyy"
                @update:model-value="handleExpiryDateChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      transition-show="scale"
                      transition-hide="scale"
                      :offset="[0, 10]"
                    >
                      <q-date
                        v-model="form.expiry_date"
                        mask="YYYY-MM-DD"
                        @update:model-value="updateExpiryDateDisplay"
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
          </div>

          <q-separator />

          <div class="row justify-between items-center">
            <div class="text-h6">รายการสินค้า</div>
            <q-btn
              color="primary"
              icon="add"
              label="เพิ่มสินค้า"
              @click="showProductModal = true"
            />
          </div>

          <quotation-item-table
            :items="form.items"
            :editable="true"
            :warehouse-options="warehouseOptions"
            @remove="removeItem"
            @update:warehouse="handleWarehouseChange"
          />

          <q-separator />

          <div class="row justify-end q-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.discount"
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
                v-model.number="form.tax"
                label="ภาษี"
                outlined
                dense
                type="number"
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
              color="primary"
              :label="isEditMode ? 'อัปเดต' : 'บันทึก'"
              :loading="store.saving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <customer-select-modal
      v-model="showCustomerModal"
      @selected="handleCustomerSelected"
    />

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
import { useQuotationStore } from '@/stores/sales/useQuotationStore';
import type { QuotationPayload, QuotationItem, Quotation } from '@/types/sales';
import { listWarehouses, type Customer, type Warehouse } from '@/services/sales/api';
import type { Product } from '@/types/catalog';
import { getProductStockSummary } from '@/services/catalog/product.service';
import CustomerSelectModal from '@/components/sales/CustomerSelectModal.vue';
import ProductSelectModal from '@/components/sales/ProductSelectModal.vue';
import QuotationItemTable from '@/components/sales/QuotationItemTable.vue';
import { formatCurrency } from '@/types/ar/common';
import { useNotifier } from '@/composables/useNotifier';

const route = useRoute();
const router = useRouter();
const store = useQuotationStore();
const { success: notifySuccess, error: notifyError } = useNotifier();

const quotationId = computed(() => {
  const id = route.params.id;
  return id ? Number(id) : null;
});

const isEditMode = computed(() => !!quotationId.value);

const showCustomerModal = ref(false);
const showProductModal = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const warehouseOptions = ref<Warehouse[]>([]);
const warehousesLoading = ref(false);

const form = ref<QuotationPayload>({
  customer_id: 0,
  quotation_date: new Date().toISOString().split('T')[0] as string,
  expiry_date: null,
  discount: 0,
  tax: 0,
  notes: null,
  items: [],
});

// Date display for dd/mm/yyyy format
const quotationDateDisplay = ref('');
const expiryDateDisplay = ref('');

// Convert YYYY-MM-DD to DD/MM/YYYY
const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Convert DD/MM/YYYY to YYYY-MM-DD
const parseDateFromDisplay = (displayValue: string): string | null => {
  if (!displayValue || !displayValue.includes('/')) return null;
  const parts = displayValue.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
};

// Update display when form date changes
const updateQuotationDateDisplay = () => {
  quotationDateDisplay.value = formatDateForDisplay(form.value.quotation_date);
};

const updateExpiryDateDisplay = () => {
  expiryDateDisplay.value = formatDateForDisplay(form.value.expiry_date);
};

// Handle manual input change
const handleQuotationDateChange = (value: string | number | null) => {
  const strValue = value ? String(value) : '';
  const parsed = parseDateFromDisplay(strValue);
  if (parsed) {
    form.value.quotation_date = parsed;
  } else if (!strValue) {
    form.value.quotation_date = '';
  }
};

const handleExpiryDateChange = (value: string | number | null) => {
  const strValue = value ? String(value) : '';
  const parsed = parseDateFromDisplay(strValue);
  if (parsed) {
    form.value.expiry_date = parsed;
  } else if (!strValue) {
    form.value.expiry_date = null;
  }
};

const calculatedTotal = computed(() => {
  const subtotal = form.value.items.reduce((sum, item) => {
    const itemTotal = (item.price * item.qty) - (item.discount || 0);
    return sum + itemTotal;
  }, 0);
  return subtotal - (form.value.discount || 0) + (form.value.tax || 0);
});

const handleCustomerSelected = (customer: Customer) => {
  selectedCustomer.value = customer;
  form.value.customer_id = customer.id;
};

const handleProductSelected = async (product: Product) => {
  // Load warehouse stocks for this product
  let warehouseStocks = product.warehouseStocks;
  if (!warehouseStocks || warehouseStocks.length === 0) {
    try {
      warehouseStocks = await getProductStockSummary(product.id);
    } catch (error) {
      console.error('Failed to load warehouse stocks:', error);
      warehouseStocks = [];
    }
  }

  const item: QuotationItem = {
    product_id: product.id,
    qty: 1,
    price: product.priceTagged || 0,
    discount: 0,
    warehouse_id: null,
    product: {
      ...product,
      warehouseStocks,
    },
    warehouse: null,
  };
  item.total = (item.price * item.qty) - (item.discount || 0);
  form.value.items.push(item);
};

const handleWarehouseChange = (index: number, warehouseId: number | null) => {
  const item = form.value.items[index];
  if (item) {
    item.warehouse_id = warehouseId;
    const warehouse = warehouseId
      ? warehouseOptions.value.find((w) => w.id === warehouseId) || null
      : null;
    item.warehouse = warehouse
      ? {
          id: warehouse.id,
          code: warehouse.code,
          name: warehouse.name,
        }
      : null;
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

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const goBack = () => {
  router.back();
};

const formatDateForInput = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Otherwise, parse and format
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const formatted = date.toISOString().split('T')[0];
  return formatted || null;
};

const loadQuotation = async (id: number) => {
  try {
    await store.loadById(id);
    const quotation: Quotation | null = store.current;
    if (quotation) {
      form.value.customer_id = quotation.customer_id;
      const formattedDate = formatDateForInput(quotation.quotation_date);
      const defaultDate = new Date().toISOString().split('T')[0];
      form.value.quotation_date = (formattedDate ?? defaultDate) as string;
      form.value.expiry_date = formatDateForInput(quotation.expiry_date);
      form.value.discount = quotation.discount || 0;
      form.value.tax = quotation.tax || 0;
      form.value.notes = quotation.notes || null;

      // Update date displays
      updateQuotationDateDisplay();
      updateExpiryDateDisplay();

      if (quotation.customer) {
        selectedCustomer.value = quotation.customer;
      }

      if (quotation.items && quotation.items.length > 0) {
        // Load warehouse stocks for each product if not already loaded
        const itemsWithStocks = await Promise.all(
          quotation.items.map(async (item: QuotationItem) => {
            let warehouseStocks = item.product?.warehouseStocks;
            if (!warehouseStocks || warehouseStocks.length === 0) {
              try {
                warehouseStocks = await getProductStockSummary(item.product_id);
              } catch (error) {
                console.error('Failed to load warehouse stocks:', error);
                warehouseStocks = [];
              }
            }
            return {
              product_id: item.product_id,
              qty: item.qty,
              price: item.price,
              discount: item.discount || 0,
              warehouse_id: item.warehouse_id || null,
              product: item.product
                ? {
                    ...item.product,
                    warehouseStocks,
                  }
                : undefined,
              warehouse: item.warehouse || null,
              total: item.total || (item.price * item.qty - (item.discount || 0)),
            };
          }),
        );
        form.value.items = itemsWithStocks;
      }
    }
  } catch (error) {
    console.error('Failed to load quotation:', error);
    notifyError({ message: 'ไม่สามารถโหลดข้อมูลใบเสนอราคาได้' });
  }
};

const handleSubmit = async () => {
  if (form.value.items.length === 0) {
    notifyError({ message: 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ' });
    return;
  }

  try {
    const subtotal = form.value.items.reduce((sum, item) => {
      return sum + ((item.price * item.qty) - (item.discount || 0));
    }, 0);
    const discount = Number(form.value.discount) || 0;
    const tax = Number(form.value.tax) || 0;
    const grandTotal = subtotal - discount + tax;

    const payload: QuotationPayload = {
      customer_id: form.value.customer_id,
      quotation_date: form.value.quotation_date,
      expiry_date: form.value.expiry_date ?? null,
      discount: discount,
      tax: tax,
      notes: form.value.notes ?? null,
      subtotal: subtotal,
      grand_total: grandTotal,
      items: form.value.items.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        discount: item.discount || 0,
        warehouse_id: item.warehouse_id || null,
        notes: item.notes || null,
      })),
    };

    if (isEditMode.value && quotationId.value) {
      const quotation = await store.update(quotationId.value, payload);
      notifySuccess({ message: 'แก้ไขใบเสนอราคาเรียบร้อยแล้ว' });
      await router.push({ name: 'sales-quotations-detail', params: { id: quotation.id } });
    } else {
      const quotation = await store.create(payload);
      notifySuccess({ message: 'สร้างใบเสนอราคาเรียบร้อยแล้ว' });
      await router.push({ name: 'sales-quotations-detail', params: { id: quotation.id } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (isEditMode.value ? 'ไม่สามารถแก้ไขใบเสนอราคาได้' : 'ไม่สามารถสร้างใบเสนอราคาได้');
    notifyError({ message });
  }
};

onMounted(async () => {
  // Initialize date displays
  updateQuotationDateDisplay();
  updateExpiryDateDisplay();
  
  // Load warehouses
  await loadWarehouses();
  
  if (isEditMode.value && quotationId.value) {
    await loadQuotation(quotationId.value);
  }
});
</script>

