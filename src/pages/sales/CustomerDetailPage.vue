<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">
            {{ customer?.name ?? 'ข้อมูลลูกค้า' }}
          </div>
          <q-badge v-if="customer" :color="customer.is_active ? 'positive' : 'grey'">
            {{ customer.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน' }}
          </q-badge>
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="loading" class="q-pa-lg flex flex-center">
        <q-spinner size="42px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
        <q-tabs v-model="tab" dense class="text-primary">
          <q-tab name="overview" label="ข้อมูลทั่วไป" icon="info" />
          <q-tab name="purchases" label="สินค้าที่เคยซื้อ" icon="shopping_cart" />
          <q-tab name="ar" label="บัญชีลูกหนี้" icon="account_balance_wallet" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="overview">
            <div v-if="!customer" class="text-grey-6">ไม่พบข้อมูลลูกค้า</div>
            <div v-else class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-list bordered padding>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>รหัสลูกค้า</q-item-label>
                      <q-item-label>{{ customer.code }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="customer.customer_group">
                    <q-item-section>
                      <q-item-label overline>กลุ่มลูกค้า</q-item-label>
                      <q-item-label>
                        <q-badge :color="getCustomerGroupColor(customer.customer_group)">
                          {{ customer.customer_group_label || customer.customer_group }}
                        </q-badge>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>ชื่อ</q-item-label>
                      <q-item-label>{{ customer.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>อีเมล</q-item-label>
                      <q-item-label>{{ customer.email }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>เบอร์โทรศัพท์</q-item-label>
                      <q-item-label>{{ customer.phone }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="customer.tax_id">
                    <q-item-section>
                      <q-item-label overline>เลขประจำตัวผู้เสียภาษี</q-item-label>
                      <q-item-label>{{ customer.tax_id }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="customer.address">
                    <q-item-section>
                      <q-item-label overline>ที่อยู่</q-item-label>
                      <q-item-label>{{ customer.address }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="customer.shipping_address">
                    <q-item-section>
                      <q-item-label overline>ที่อยู่จัดส่ง</q-item-label>
                      <q-item-label>{{ customer.shipping_address }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="customer.billing_address">
                    <q-item-section>
                      <q-item-label overline>ที่อยู่ออกใบกำกับภาษี</q-item-label>
                      <q-item-label>{{ customer.billing_address }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="customer.notes">
                    <q-item-section>
                      <q-item-label overline>หมายเหตุ</q-item-label>
                      <q-item-label>{{ customer.notes }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div class="col-12 col-md-6">
                <q-list bordered padding>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>ประเภทชำระเงิน</q-item-label>
                      <q-item-label>
                        <q-badge
                          :color="customer.payment_type === 'credit' ? 'primary' : 'positive'"
                        >
                          {{ customer.payment_type === 'credit' ? 'เครดิต' : 'เงินสด' }}
                        </q-badge>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <template v-if="customer.is_credit">
                    <q-item
                      v-if="customer.credit_limit !== null && customer.credit_limit !== undefined"
                    >
                      <q-item-section>
                        <q-item-label overline>วงเงินเครดิต</q-item-label>
                        <q-item-label>{{ formatCurrency(customer.credit_limit) }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="customer.credit_term_days">
                      <q-item-section>
                        <q-item-label overline>จำนวนวันเครดิต</q-item-label>
                        <q-item-label>{{ customer.credit_term_days }} วัน</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>ยอดค้างชำระ</q-item-label>
                        <q-item-label>
                          <span :class="customer.is_over_credit_limit ? 'text-negative' : ''">
                            {{ formatCurrency(customer.outstanding_balance) }}
                          </span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="customer.is_over_credit_limit">
                      <q-item-section>
                        <q-badge color="negative" class="q-mt-xs">
                          <q-icon name="warning" class="q-mr-xs" />
                          เกินวงเงินเครดิต
                        </q-badge>
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-else-if="
                        customer.credit_limit !== null && customer.credit_limit !== undefined
                      "
                    >
                      <q-item-section>
                        <q-item-label overline>วงเงินคงเหลือ</q-item-label>
                        <q-item-label>
                          {{ formatCurrency(customer.credit_limit - customer.outstanding_balance) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="customer.credit_note">
                      <q-item-section>
                        <q-item-label overline>หมายเหตุเครดิต</q-item-label>
                        <q-item-label>{{ customer.credit_note }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-list>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="purchases">
            <div v-if="purchasesLoading" class="q-pa-lg flex flex-center">
              <q-spinner size="42px" color="primary" />
            </div>
            <div v-else-if="purchasedProducts.length === 0" class="text-center q-pa-lg">
              <q-icon name="shopping_cart" size="64px" class="text-grey-5 q-mb-sm" />
              <div class="text-body1 text-grey-6">ยังไม่มีประวัติการซื้อสินค้า</div>
            </div>
            <q-table
              v-else
              :rows="purchasedProducts"
              :columns="purchaseColumns"
              row-key="id"
              flat
              bordered
            >
              <template v-slot:body-cell-image="props">
                <q-td :props="props">
                  <q-img
                    v-if="props.value"
                    :src="props.value"
                    style="width: 60px; height: 60px"
                    fit="contain"
                    spinner-color="primary"
                  >
                    <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-grey-3">
                        <q-icon name="image_not_supported" size="24px" class="text-grey-5" />
                      </div>
                    </template>
                  </q-img>
                  <q-icon v-else name="image_not_supported" size="32px" class="text-grey-5" />
                </q-td>
              </template>
              <template v-slot:body-cell-price="props">
                <q-td :props="props">
                  {{ formatCurrency(parseFloat(props.value)) }}
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <q-tab-panel name="ar">
            <div v-if="arLoading" class="q-pa-lg flex flex-center">
              <q-spinner size="42px" color="primary" />
            </div>
            <div v-else-if="arError" class="text-center q-pa-lg">
              <q-icon name="error" size="64px" class="text-negative q-mb-sm" />
              <div class="text-body1 text-negative">{{ arError }}</div>
            </div>
            <div v-else>
              <!-- AR Summary -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">สรุปยอดบัญชีลูกหนี้</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7 q-mb-xs">ยอดรวมที่ออก Invoice</div>
                      <div class="text-h6 text-weight-bold">
                        {{ formatCurrency(arSummary.total_invoiced) }}
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7 q-mb-xs">ยอดรวมที่ชำระแล้ว</div>
                      <div class="text-h6 text-weight-bold text-positive">
                        {{ formatCurrency(arSummary.total_paid) }}
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="text-caption text-grey-7 q-mb-xs">ยอดคงค้างชำระ</div>
                      <div class="text-h6 text-weight-bold text-negative">
                        {{ formatCurrency(arSummary.total_outstanding) }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Outstanding Invoices -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">ใบแจ้งหนี้ที่ค้างชำระ</div>
                  <div v-if="outstandingInvoices.length === 0" class="text-center q-pa-lg">
                    <q-icon name="receipt" size="64px" class="text-grey-5 q-mb-sm" />
                    <div class="text-body1 text-grey-6">ไม่มีใบแจ้งหนี้ที่ค้างชำระ</div>
                  </div>
                  <q-table
                    v-else
                    :rows="outstandingInvoices"
                    :columns="outstandingInvoiceColumns"
                    row-key="invoice_id"
                    flat
                    bordered
                  >
                    <template #body-cell-open_amount="props">
                      <q-td :props="props" class="text-right">
                        <div class="text-weight-medium text-negative">
                          {{ formatCurrency(parseFloat(props.row.open_amount)) }}
                        </div>
                      </q-td>
                    </template>
                    <template #body-cell-invoice_date="props">
                      <q-td :props="props">
                        {{ formatDate(props.row.invoice_date) }}
                      </q-td>
                    </template>
                    <template #body-cell-due_date="props">
                      <q-td :props="props">
                        {{ props.row.due_date ? formatDate(props.row.due_date) : '-' }}
                      </q-td>
                    </template>
                    <template #body-cell-days_overdue="props">
                      <q-td :props="props" class="text-right">
                        <q-chip
                          v-if="props.row.days_overdue > 0"
                          dense
                          :color="getOverdueColor(props.row.days_overdue)"
                          text-color="white"
                        >
                          {{ props.row.days_overdue }} วัน
                        </q-chip>
                        <span v-else class="text-grey-6">-</span>
                      </q-td>
                    </template>
                    <template #body-cell-actions="props">
                      <q-td :props="props">
                        <q-btn
                          flat
                          dense
                          round
                          icon="visibility"
                          color="primary"
                          @click="viewInvoice(props.row.invoice_id)"
                        />
                      </q-td>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>

              <!-- Payment History -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">ประวัติการชำระเงิน</div>
                  <div v-if="paymentHistory.length === 0" class="text-center q-pa-lg">
                    <q-icon name="payment" size="64px" class="text-grey-5 q-mb-sm" />
                    <div class="text-body1 text-grey-6">ยังไม่มีประวัติการชำระเงิน</div>
                  </div>
                    <q-table
                    v-else
                    :rows="paymentHistory"
                    :columns="paymentHistoryColumns"
                    row-key="receipt_id"
                    flat
                    bordered
                  >
                    <template #body-cell-receipt_date="props">
                      <q-td :props="props">
                        {{ formatDate(props.row.receipt_date) }}
                      </q-td>
                    </template>
                    <template #body-cell-amount="props">
                      <q-td :props="props" class="text-right">
                        <div class="text-weight-medium text-positive">
                          {{ formatCurrency(parseFloat(props.row.amount)) }}
                        </div>
                      </q-td>
                    </template>
                    <template #body-cell-allocated_invoices="props">
                      <q-td :props="props">
                        <div v-if="props.row.allocated_invoices && props.row.allocated_invoices.length > 0">
                          <div
                            v-for="(alloc, idx) in props.row.allocated_invoices"
                            :key="idx"
                            class="text-caption"
                          >
                            {{ alloc.invoice_no }}: {{ formatCurrency(parseFloat(alloc.allocated_amount)) }}
                          </div>
                        </div>
                        <span v-else class="text-grey-6">-</span>
                      </q-td>
                    </template>
                    <template #body-cell-actions="props">
                      <q-td :props="props">
                        <q-btn
                          flat
                          dense
                          round
                          icon="visibility"
                          color="primary"
                          @click="viewReceipt(props.row.receipt_id)"
                        />
                      </q-td>
                    </template>
                  </q-table>
                </q-card-section>
              </q-card>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { QTableProps } from 'quasar';
import {
  getCustomer,
  getCustomerPurchases,
  type Customer,
  type PurchasedProduct,
} from '@/services/sales/api';
import {
  getCustomerArSummary,
  getCustomerOutstandingInvoices,
  getCustomerPaymentHistory,
  type CustomerArSummary,
  type CustomerOutstandingInvoice,
  type CustomerPaymentHistory,
} from '@/services/sales/customerArService';
import { useNotifier } from '@/composables/useNotifier';

const route = useRoute();
const router = useRouter();
const { error: notifyError } = useNotifier();

const tab = ref<'overview' | 'purchases' | 'ar'>('overview');
const customerId = Number(route.params.id);
const loading = ref(false);
const purchasesLoading = ref(false);
const arLoading = ref(false);
const arError = ref<string | null>(null);
const customer = ref<Customer | null>(null);
const purchasedProducts = ref<PurchasedProduct[]>([]);
const arSummary = ref<CustomerArSummary>({
  customer_id: customerId,
  total_invoiced: 0,
  total_paid: 0,
  total_outstanding: 0,
});
const outstandingInvoices = ref<CustomerOutstandingInvoice[]>([]);
const paymentHistory = ref<CustomerPaymentHistory[]>([]);

const purchaseColumns = [
  {
    name: 'image',
    label: '',
    field: 'image_url',
    align: 'center' as const,
    style: 'width: 80px',
  },
  {
    name: 'name',
    label: 'สินค้า',
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'brand',
    label: 'แบรนด์',
    field: 'brand',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'category',
    label: 'หมวดหมู่',
    field: 'category',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'price',
    label: 'ราคา',
    field: 'price',
    align: 'right' as const,
    sortable: true,
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getOverdueColor = (days: number): string => {
  if (days <= 30) return 'warning';
  if (days <= 60) return 'orange';
  if (days <= 90) return 'negative';
  return 'red';
};

const getCustomerGroupColor = (
  group: 'personal' | 'government' | 'organization' | undefined,
): string => {
  switch (group) {
    case 'personal':
      return 'primary';
    case 'government':
      return 'positive';
    case 'organization':
      return 'deep-purple';
    default:
      return 'grey';
  }
};

const loadCustomer = async () => {
  loading.value = true;
  try {
    customer.value = await getCustomer(customerId);
  } catch (err) {
    notifyError({ message: 'ไม่สามารถโหลดข้อมูลลูกค้าได้' });
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadPurchases = async () => {
  purchasesLoading.value = true;
  try {
    purchasedProducts.value = await getCustomerPurchases(customerId);
  } catch (err) {
    notifyError({ message: 'ไม่สามารถโหลดประวัติการซื้อสินค้าได้' });
    console.error(err);
  } finally {
    purchasesLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  await loadCustomer();
  // Load purchases when purchases tab is selected
  if (tab.value === 'purchases') {
    await loadPurchases();
  }
});

const outstandingInvoiceColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'invoice_no',
    label: 'เลขที่ Invoice',
    field: 'invoice_no',
    align: 'left' as const,
  },
  {
    name: 'invoice_date',
    label: 'วันที่',
    field: 'invoice_date',
    align: 'left' as const,
  },
  {
    name: 'due_date',
    label: 'วันครบกำหนด',
    field: 'due_date',
    align: 'left' as const,
  },
  {
    name: 'open_amount',
    label: 'ยอดคงค้าง',
    field: 'open_amount',
    align: 'right' as const,
  },
  {
    name: 'days_overdue',
    label: 'เกินกำหนด',
    field: 'days_overdue',
    align: 'right' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
  },
]);

const paymentHistoryColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'receipt_no',
    label: 'เลขที่ Receipt',
    field: 'receipt_no',
    align: 'left' as const,
  },
  {
    name: 'receipt_date',
    label: 'วันที่',
    field: 'receipt_date',
    align: 'left' as const,
  },
  {
    name: 'amount',
    label: 'จำนวนเงิน',
    field: 'amount',
    align: 'right' as const,
  },
  {
    name: 'payment_method',
    label: 'วิธีการชำระ',
    field: 'payment_method',
    align: 'left' as const,
  },
  {
    name: 'allocated_invoices',
    label: 'จ่ายให้ Invoice',
    field: 'allocated_invoices',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
  },
]);

const loadArData = async () => {
  arLoading.value = true;
  arError.value = null;
  try {
    arSummary.value = await getCustomerArSummary(customerId);
    outstandingInvoices.value = await getCustomerOutstandingInvoices(customerId);
    paymentHistory.value = await getCustomerPaymentHistory(customerId);
  } catch (err) {
    arError.value = 'ไม่สามารถโหลดข้อมูลบัญชีลูกหนี้ได้';
    notifyError({ message: arError.value });
    console.error(err);
  } finally {
    arLoading.value = false;
  }
};

const viewInvoice = (invoiceId: number) => {
  void router.push({ name: 'ar-invoices-detail', params: { id: invoiceId } });
};

const viewReceipt = (receiptId: number) => {
  void router.push({ name: 'ar-receipts-detail', params: { id: receiptId } });
};

// Watch tab changes to load data when needed
watch(tab, () => {
  if (
    tab.value === 'purchases' &&
    purchasedProducts.value.length === 0 &&
    !purchasesLoading.value
  ) {
    void loadPurchases();
  } else if (tab.value === 'ar' && arSummary.value.total_invoiced === 0 && !arLoading.value) {
    void loadArData();
  }
});
</script>
