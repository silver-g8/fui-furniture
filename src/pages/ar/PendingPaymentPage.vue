<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">AR ที่ชำระแล้ว</div>
          <div class="text-subtitle2 text-grey-7">
            ตรวจสอบและลบ Invoice ที่ชำระเงินครบแล้ว (รอการลบ)
          </div>
        </div>
        <q-btn
          color="primary"
          icon="refresh"
          label="ตรวจสอบและลบ"
          :loading="cleaningUp"
          @click="handleCleanup"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Customer Filter -->
        <div class="row q-mb-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedCustomerId"
              label="กรองตามลูกค้า"
              outlined
              dense
              clearable
              use-input
              input-debounce="400"
              :options="customerOptions"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :loading="customersLoading"
              @filter="filterCustomers"
              @update:model-value="loadInvoices"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ customerSearch ? 'ไม่พบลูกค้า' : 'พิมพ์เพื่อค้นหาลูกค้า' }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <q-table
          :rows="invoices"
          :columns="columns"
          :loading="loading"
          row-key="id"
          :pagination="{ rowsPerPage: 20 }"
          flat
          bordered
        >
          <template #body-cell-customer="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>

          <template #body-cell-invoice_date="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template #body-cell-grand_total="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <template #body-cell-paid_total="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <template #body-cell-open_amount="props">
            <q-td :props="props" class="text-right">
              <span :class="props.value > 0 ? 'text-negative' : 'text-positive'">
                {{ formatCurrency(props.value) }}
              </span>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.value === 'paid' ? 'positive' : 'warning'"
                :label="props.value === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <div class="row q-gutter-xs justify-center">
                <q-btn
                  flat
                  dense
                  round
                  icon="visibility"
                  color="primary"
                  @click="viewInvoice(props.row.id)"
                >
                  <q-tooltip>ดูรายละเอียด</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  :loading="deletingInvoiceId === props.row.id"
                  @click="handleDelete(props.row)"
                >
                  <q-tooltip>ลบ</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template #no-data>
            <div class="text-center q-pa-lg column items-center">
              <q-icon name="description" size="64px" color="grey-5" />
              <div class="text-subtitle1 q-mt-md">ไม่มีข้อมูล Invoice ที่ชำระเงินแล้ว</div>
              <div class="text-body2 text-grey-6">
                Invoice ที่ชำระเงินครบแล้ว (open_amount = 0) จะถูกแสดงที่นี่
              </div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  getPendingPayments,
  cleanupPaidInvoices,
  deleteSingleInvoice,
  type PendingPaymentInvoice,
} from '@/services/ar/pendingPayment.service';
import { listCustomers, type Customer } from '@/services/sales/api';
import { formatCurrency, formatDate } from '@/types/ar/common';
import { useNotifier } from '@/composables/useNotifier';

const router = useRouter();
const $q = useQuasar();
const { success: notifySuccess, error: notifyError } = useNotifier();

const invoices = ref<PendingPaymentInvoice[]>([]);
const loading = ref(false);
const cleaningUp = ref(false);
const deletingInvoiceId = ref<number | null>(null);
const selectedCustomerId = ref<number | null>(null);
const customerOptions = ref<Customer[]>([]);
const customersLoading = ref(false);
const customerSearch = ref('');

const columns = [
  {
    name: 'invoice_no',
    label: 'เลขที่ Invoice',
    field: 'invoice_no',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'customer',
    label: 'ลูกค้า',
    field: (row: PendingPaymentInvoice) => row.customer?.name,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'invoice_date',
    label: 'วันที่',
    field: 'invoice_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'grand_total',
    label: 'ยอดรวม',
    field: 'grand_total',
    align: 'right' as const,
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: 'paid_total',
    label: 'ชำระแล้ว',
    field: 'paid_total',
    align: 'right' as const,
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: 'open_amount',
    label: 'คงเหลือ',
    field: 'open_amount',
    align: 'right' as const,
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: 'การดำเนินการ',
    field: () => '',
    align: 'center' as const,
    sortable: false,
  },
];

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

const loadInvoices = async () => {
  loading.value = true;
  try {
    const response = await getPendingPayments(selectedCustomerId.value || undefined);
    invoices.value = response.data;
  } catch (error) {
    console.error('Failed to load invoices:', error);
    notifyError({ message: 'ไม่สามารถโหลดข้อมูลได้' });
  } finally {
    loading.value = false;
  }
};

const handleCleanup = () => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: 'คุณต้องการตรวจสอบและลบ Invoice ที่ชำระเงินแล้วหรือไม่?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
    cleaningUp.value = true;
    try {
      const response = await cleanupPaidInvoices(selectedCustomerId.value || undefined);
      await loadInvoices();
      notifySuccess({
        message: `ลบ Invoice ที่ชำระแล้ว ${response.deleted_count} รายการ`,
      });
      if (response.errors.length > 0) {
        console.warn('Cleanup errors:', response.errors);
        notifyError({
          message: `มีข้อผิดพลาดในการลบ ${response.errors.length} รายการ`,
        });
      }
    } catch (error) {
      console.error('Failed to cleanup:', error);
      notifyError({ message: 'ไม่สามารถลบข้อมูลได้' });
    } finally {
      cleaningUp.value = false;
    }
    })();
  });
};

const viewInvoice = (invoiceId: number) => {
  void router.push({ name: 'ar-invoices-detail', params: { id: invoiceId } });
};

const handleDelete = (invoice: PendingPaymentInvoice) => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบ Invoice ${invoice.invoice_no} หรือไม่?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      deletingInvoiceId.value = invoice.id;
      try {
        await deleteSingleInvoice(invoice.id);
        await loadInvoices();
        notifySuccess({
          message: `ลบ Invoice ${invoice.invoice_no} สำเร็จ`,
        });
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        const message = error instanceof Error ? error.message : 'ไม่สามารถลบข้อมูลได้';
        notifyError({ message });
      } finally {
        deletingInvoiceId.value = null;
      }
    })();
  });
};

onMounted(() => {
  void loadInvoices();
});
</script>

