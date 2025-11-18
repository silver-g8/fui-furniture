<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">
            {{ isEditMode ? 'แก้ไขคำสั่งขาย' : 'สร้างคำสั่งขายใหม่' }}
          </div>
          <div class="text-subtitle2 text-grey-7">
            {{ isEditMode ? 'แก้ไขข้อมูลคำสั่งขาย' : 'กรอกข้อมูลคำสั่งขายเพื่อสร้างรายการใหม่' }}
            <span v-if="quotationId" class="text-primary">
              (จากใบเสนอราคา #{{ quotationId }})
            </span>
          </div>
        </div>
        <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.customer_id"
                label="ลูกค้า *"
                outlined
                dense
                use-input
                input-debounce="400"
                :options="customerOptions"
                option-label="name"
                option-value="id"
                emit-value
                map-options
                clearable
                :loading="customersLoading"
                :rules="[(val) => !!val || 'กรุณาเลือกลูกค้า']"
                :disable="isEditMode"
                @filter="filterCustomers"
                @update:model-value="handleCustomerChange"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ customerSearch ? 'ไม่พบลูกค้า' : 'พิมพ์เพื่อค้นหาลูกค้า' }}
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
                      <q-badge
                        :color="scope.opt.payment_type === 'credit' ? 'primary' : 'positive'"
                      >
                        {{ scope.opt.payment_type === 'credit' ? 'เครดิต' : 'เงินสด' }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <div v-if="selectedCustomer" class="q-mt-sm">
                <div class="text-body2">{{ selectedCustomer.name }}</div>
                <div class="text-caption text-grey-7">{{ selectedCustomer.code }}</div>
                <q-badge
                  :color="selectedCustomer.payment_type === 'credit' ? 'primary' : 'positive'"
                  class="q-mt-xs"
                >
                  {{ selectedCustomer.payment_type === 'credit' ? 'เครดิต' : 'เงินสด' }}
                </q-badge>
              </div>
            </div>

            <div class="col-12 col-md-3">
              <q-select
                v-model="form.warehouse_id"
                label="คลังสินค้า"
                outlined
                dense
                :options="warehouseOptions"
                option-label="name"
                option-value="id"
                emit-value
                map-options
                clearable
                :loading="warehousesLoading"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      ไม่พบคลังสินค้า
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
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
                    <q-popup-proxy
                      transition-show="scale"
                      transition-hide="scale"
                      :offset="[0, 10]"
                    >
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

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.payment_term"
                label="เงื่อนไขการชำระเงิน"
                outlined
                dense
                hint="เช่น COD, Net 30, Net 60"
              />
            </div>
          </div>

          <q-separator />

          <div class="row justify-between items-center">
            <div class="text-h6">รายการสินค้า</div>
            <q-btn
              color="primary"
              icon="add"
              label="เพิ่มสินค้า"
              :disable="isEditMode"
              @click="showProductModal = true"
            />
          </div>

          <sales-order-item-table
            :items="formItems"
            :editable="!isEditMode"
            :show-stock-status="false"
            @remove="removeItem"
            @update="updateItem"
          />

          <q-separator />

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
              :label="isEditMode ? 'บันทึกการแก้ไข' : 'บันทึก'"
              :loading="store.saving"
            />
          </div>
        </q-form>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSalesOrderStore } from '@/stores/sales/useSalesOrderStore';
import type { SalesOrderPayload, SalesOrderItem } from '@/types/sales';
import { listCustomers, listWarehouses, type Customer, type Warehouse } from '@/services/sales/api';
import type { Product } from '@/types/catalog';
import ProductSelectModal from '@/components/sales/ProductSelectModal.vue';
import SalesOrderItemTable from '@/components/sales/SalesOrderItemTable.vue';
import { formatCurrency } from '@/types/ar/common';
import { useNotifier } from '@/composables/useNotifier';
import { getQuotation } from '@/services/sales/quotation.service';
import type { Quotation } from '@/types/sales';

const router = useRouter();
const route = useRoute();
const store = useSalesOrderStore();
const { success: notifySuccess, error: notifyError } = useNotifier();

const showProductModal = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const quotationId = ref<number | null>(null);
const quotation = ref<Quotation | null>(null);
const customerOptions = ref<Customer[]>([]);
const customersLoading = ref(false);
const customerSearch = ref('');
const warehouseOptions = ref<Warehouse[]>([]);
const warehousesLoading = ref(false);
const deliveryDateDisplay = ref('');

const isEditMode = computed(() => !!route.params.id && route.name === 'sales-orders-edit');

const form = ref<SalesOrderPayload>({
  customer_id: null,
  quotation_id: null,
  warehouse_id: null,
  delivery_date: null,
  reference: null,
  payment_term: null,
  notes: null,
  items: [],
});

const formItems = computed(() => {
  return form.value.items.map((item) => ({
    ...item,
    total: (item.price * item.qty) - (item.discount || 0),
  }));
});

const calculatedTotal = computed(() => {
  return form.value.items.reduce((sum, item) => {
    const itemTotal = (item.price * item.qty) - (item.discount || 0);
    return sum + itemTotal;
  }, 0);
});

const filterCustomers = async (val: string, update: (callback: () => void) => void) => {
  customerSearch.value = val;
  
  if (!val || val.length < 1) {
    update(() => {
      customerOptions.value = [];
    });
    return;
  }

  customersLoading.value = true;
  try {
    const response = await listCustomers({
      search: val,
      per_page: 20,
    });
    
    update(() => {
      customerOptions.value = response.data || [];
    });
  } catch (error) {
    console.error('Failed to load customers:', error);
    update(() => {
      customerOptions.value = [];
    });
  } finally {
    customersLoading.value = false;
  }
};

const handleCustomerChange = async (customerId: number | null) => {
  if (!customerId) {
    selectedCustomer.value = null;
    form.value.payment_term = null;
    return;
  }

  // Find customer from options
  const customer = customerOptions.value.find((c) => c.id === customerId);
  if (customer) {
    selectedCustomer.value = customer;
    updatePaymentTermFromCustomer(customer);
  } else {
    // If not found in options, fetch from API
    try {
      const { getCustomer } = await import('@/services/sales/api');
      const fetchedCustomer = await getCustomer(customerId);
      selectedCustomer.value = fetchedCustomer;
      updatePaymentTermFromCustomer(fetchedCustomer);
    } catch (error) {
      console.error('Failed to load customer:', error);
      selectedCustomer.value = null;
      form.value.payment_term = null;
    }
  }
};

const updatePaymentTermFromCustomer = (customer: Customer) => {
  // ถ้าลูกค้าเป็นประเภทเครดิต ให้ดึงข้อมูลเงื่อนไขการชำระเงินมาใส่
  if (customer.payment_type === 'credit') {
    if (customer.credit_term_days) {
      // แปลง credit_term_days เป็นรูปแบบเงื่อนไขการชำระเงิน
      if (customer.credit_term_days === 0) {
        form.value.payment_term = 'COD';
      } else {
        form.value.payment_term = `Net ${customer.credit_term_days}`;
      }
    } else {
      // ถ้าไม่มี credit_term_days ให้ใส่เป็น "เครดิต"
      form.value.payment_term = 'เครดิต';
    }
  } else {
    // ถ้าเป็นเงินสด ให้ล้างค่า
    form.value.payment_term = null;
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
  // Convert from YYYY-MM-DD to DD/MM/YYYY for display
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
  // Convert from DD/MM/YYYY to YYYY-MM-DD for backend
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

const handleProductSelected = (product: Product) => {
  // Find warehouse object from warehouseOptions
  const warehouse = form.value.warehouse_id
    ? warehouseOptions.value.find((w) => w.id === form.value.warehouse_id) || null
    : null;

  const warehouseId = form.value.warehouse_id || null;

  // Check if the same product with the same warehouse already exists
  const existingItemIndex = form.value.items.findIndex(
    (item) => item.product_id === product.id && item.warehouse_id === warehouseId
  );

  if (existingItemIndex >= 0) {
    // If exists, increase quantity by 1
    const existingItem = form.value.items[existingItemIndex];
    if (existingItem) {
      existingItem.qty = (existingItem.qty || 1) + 1;
    }
  } else {
    // If not exists, add new item
    const item: Omit<SalesOrderItem, 'id' | 'sales_order_id'> = {
      product_id: product.id,
      qty: 1,
      price: product.priceTagged || 0,
      discount: 0,
      warehouse_id: warehouseId,
      product: product,
      warehouse: warehouse
        ? {
            id: warehouse.id,
            code: warehouse.code,
            name: warehouse.name,
          }
        : null,
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

const goBack = () => {
  router.back();
};

const loadQuotation = async (id: number) => {
  try {
    quotation.value = await getQuotation(id);
    quotationId.value = id;
    
    // Pre-fill form from quotation
    if (quotation.value) {
      form.value.customer_id = quotation.value.customer_id;
      form.value.quotation_id = quotation.value.id;
      
      // Load customer info
      if (quotation.value.customer) {
        selectedCustomer.value = quotation.value.customer;
        // Add customer to options for q-select
        customerOptions.value = [quotation.value.customer];
        // ถ้าลูกค้าเป็นเครดิต ให้ดึง payment_term จากลูกค้า
        if (quotation.value.customer.payment_type === 'credit') {
          updatePaymentTermFromCustomer(quotation.value.customer);
        }
      }
      
      // Load items from quotation
      if (quotation.value.items && quotation.value.items.length > 0) {
        form.value.items = quotation.value.items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
          discount: item.discount || 0,
          warehouse_id: null,
          product: item.product, // Keep product object for display
          warehouse: null, // No warehouse from quotation
        }));
      }
    }
  } catch (error) {
    // ไม่แสดง error ถ้าเป็น 403 (Forbidden) - เป็น permission issue
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status !== 403) {
      console.error('Failed to load quotation:', error);
    }
    // แสดง notification เฉพาะถ้าไม่ใช่ 403
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status !== 403) {
      notifyError({ message: 'ไม่สามารถโหลดข้อมูลใบเสนอราคาได้' });
    }
  }
};

const loadSalesOrder = async (id: number) => {
  try {
    await store.loadById(id);
    if (store.current) {
      const so = store.current;
      form.value.customer_id = so.customer_id;
      form.value.quotation_id = so.quotation_id ?? null;
      form.value.warehouse_id = so.warehouse_id ?? null;
      form.value.delivery_date = so.delivery_date || null;
      updateDeliveryDateDisplay();
      form.value.reference = so.reference || null;
      form.value.payment_term = so.payment_term || null;
      form.value.notes = so.notes || null;
      
      if (so.customer) {
        selectedCustomer.value = so.customer;
        // Add customer to options for q-select
        customerOptions.value = [so.customer];
        // ถ้าไม่มี payment_term ใน sales order และลูกค้าเป็นเครดิต ให้ดึงจากลูกค้า
        if (!so.payment_term && so.customer.payment_type === 'credit') {
          updatePaymentTermFromCustomer(so.customer);
        }
      }
      
      if (so.items && so.items.length > 0) {
        form.value.items = so.items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
          discount: item.discount || 0,
          warehouse_id: item.warehouse_id ?? null,
          // Keep product and warehouse objects for display (not in payload type)
          product: item.product,
          warehouse: item.warehouse ?? null,
        })) as typeof form.value.items;
      }
    }
  } catch (error) {
    // ไม่แสดง error ถ้าเป็น 403 (Forbidden) - เป็น permission issue
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status !== 403) {
      console.error('Failed to load sales order:', error);
      notifyError({ message: 'ไม่สามารถโหลดข้อมูลคำสั่งขายได้' });
    }
  }
};

// Watch for warehouse changes and update warehouse objects in items
watch(
  () => form.value.warehouse_id,
  (newWarehouseId) => {
    const warehouse = newWarehouseId
      ? warehouseOptions.value.find((w) => w.id === newWarehouseId) || null
      : null;

    // Update warehouse object for all items that don't have a specific warehouse
    form.value.items.forEach((item) => {
      if (!item.warehouse_id || item.warehouse_id === newWarehouseId) {
        item.warehouse_id = newWarehouseId ?? null;
        (item as SalesOrderItem).warehouse = warehouse
          ? {
              id: warehouse.id,
              code: warehouse.code,
              name: warehouse.name,
            }
          : null;
      }
    });
  },
);

onMounted(async () => {
  // Load warehouses
  await loadWarehouses();
  
  // Check if creating from quotation
  const quotationIdParam = route.query.quotation_id as string | undefined;
  if (quotationIdParam) {
    await loadQuotation(Number(quotationIdParam));
  }
  
  // Check if editing existing sales order
  if (isEditMode.value && route.params.id) {
    await loadSalesOrder(Number(route.params.id));
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

  // After validation, we know customer_id is not null
  const customerId = form.value.customer_id;

  try {
    // Remove product and warehouse objects from items before sending to API
    const itemsForPayload = form.value.items.map((item) => {
      // Type assertion because form items may have product/warehouse for display
      const itemWithRelations = item as SalesOrderItem;
      const { product, warehouse, ...itemWithoutRelations } = itemWithRelations;
      // Suppress unused variable warnings - we're intentionally removing these
      void product;
      void warehouse;
      // Ensure discount has a default value
      return {
        ...itemWithoutRelations,
        discount: itemWithoutRelations.discount ?? 0,
      };
    });

    const payload: SalesOrderPayload = {
      customer_id: customerId,
      quotation_id: form.value.quotation_id ?? null,
      warehouse_id: form.value.warehouse_id ?? null,
      delivery_date: form.value.delivery_date ?? null,
      reference: form.value.reference ?? null,
      payment_term: form.value.payment_term ?? null,
      notes: form.value.notes ?? null,
      items: itemsForPayload,
      total_amount: calculatedTotal.value,
      status: 'draft',
    };
    
    let salesOrder;
    if (isEditMode.value && route.params.id) {
      salesOrder = await store.update(Number(route.params.id), payload);
      notifySuccess({ message: 'แก้ไขคำสั่งขายเรียบร้อยแล้ว' });
    } else {
      salesOrder = await store.create(payload);
      notifySuccess({ message: 'สร้างคำสั่งขายเรียบร้อยแล้ว' });
    }
    
    await router.push({
      name: 'sales-orders-detail',
      params: { id: salesOrder.id },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : isEditMode.value
          ? 'ไม่สามารถแก้ไขคำสั่งขายได้'
          : 'ไม่สามารถสร้างคำสั่งขายได้';
    notifyError({ message });
  }
};
</script>
