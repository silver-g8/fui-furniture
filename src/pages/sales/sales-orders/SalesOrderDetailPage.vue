<template>
  <q-page padding v-if="salesOrder">
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">คำสั่งขาย: {{ salesOrder.sales_order_no }}</div>
          <div class="text-subtitle2 text-grey-7">รายละเอียดคำสั่งขาย</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
          <q-btn
            v-if="canEdit"
            flat
            color="primary"
            icon="edit"
            label="แก้ไข"
            @click="goToEdit"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Status Badge and Actions -->
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <div>
            <q-badge :color="getStatusColor(salesOrder.status)" class="q-pa-sm">
              {{ getStatusLabel(salesOrder.status) }}
            </q-badge>
          </div>
          <div v-if="salesOrder.invoice_status">
            <q-badge :color="getInvoiceStatusColor(salesOrder.invoice_status)" class="q-pa-sm">
              {{ getInvoiceStatusLabel(salesOrder.invoice_status) }}
            </q-badge>
          </div>
          <q-space />
          <div class="row q-gutter-sm">
            <q-btn
              v-if="salesOrder.status === 'draft'"
              color="primary"
              icon="check"
              label="ยืนยัน"
              :loading="store.saving"
              @click="handleConfirm"
            />
            <q-btn
              v-if="salesOrder.status === 'confirmed'"
              color="orange"
              icon="inventory"
              label="จองสต็อก"
              :loading="store.saving"
              @click="handleReserve"
            />
            <q-btn
              v-if="salesOrder.status === 'reserved' || salesOrder.status === 'picking' || salesOrder.status === 'shipping'"
              color="positive"
              icon="local_shipping"
              label="จัดส่ง"
              :loading="store.saving"
              @click="handleDeliver"
            />
            <q-btn
              v-if="canRequestInstallation"
              color="purple"
              icon="home_repair_service"
              label="ขอใบสั่งติดตั้ง"
              :loading="installationLoading"
              @click="showInstallationModal = true"
            />
            <q-btn
              v-if="canCreateInvoice"
              color="teal"
              icon="receipt"
              label="สร้างใบแจ้งหนี้"
              :loading="invoiceLoading"
              @click="showInvoiceModal = true"
            />
            <q-btn
              v-if="canPartialDeliver"
              color="indigo"
              icon="local_shipping"
              label="จัดส่งบางส่วน"
              :loading="partialDeliveryLoading"
              @click="showPartialDeliveryModal = true"
            />
            <q-btn
              v-if="canCreateReturn"
              color="orange"
              icon="assignment_return"
              label="สร้างใบคืนสินค้า"
              :loading="returnLoading"
              @click="showReturnModal = true"
            />
            <q-btn
              v-if="canCancel"
              color="negative"
              icon="cancel"
              label="ยกเลิก"
              :loading="store.saving"
              @click="handleCancel"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Order Information -->
      <q-card-section>
        <div class="text-h6 q-mb-md">ข้อมูลคำสั่งขาย</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>ลูกค้า</q-item-label>
                  <q-item-label>{{ salesOrder.customer?.name || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>คลังสินค้า</q-item-label>
                  <q-item-label>{{ salesOrder.warehouse?.name || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>วันที่สร้าง</q-item-label>
                  <q-item-label>{{ formatDate(salesOrder.created_at) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="col-12 col-md-6">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>วันที่จัดส่ง</q-item-label>
                  <q-item-label>{{ salesOrder.delivery_date ? formatDate(salesOrder.delivery_date) : '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>อ้างอิง</q-item-label>
                  <q-item-label>{{ salesOrder.reference || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>ยอดรวม</q-item-label>
                  <q-item-label class="text-h6 text-primary">
                    {{ formatCurrency(salesOrder.total_amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Items Table -->
      <q-card-section>
        <div class="text-h6 q-mb-md">รายการสินค้า</div>
        <SalesOrderItemTable
          :items="salesOrder.items || []"
          :loading="store.loading"
          :show-stock-status="true"
        />
      </q-card-section>

      <q-separator />

      <!-- Stock Movements -->
      <q-card-section>
        <div class="text-h6 q-mb-md">ประวัติการเคลื่อนไหวสต็อก</div>
        <q-table
          flat
          bordered
          :rows="stockMovements"
          :columns="movementColumns"
          row-key="id"
          :loading="movementsLoading"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #no-data>
            <div class="full-width row items-center justify-center text-grey q-gutter-sm q-pa-md">
              <q-icon name="warning" size="2em" />
              <div class="text-subtitle1">ยังไม่มีข้อมูล</div>
            </div>
          </template>
          <template #body-cell-type="props">
            <q-td :props="props">
              <q-badge :color="getMovementTypeColor(props.value)">
                {{ getMovementTypeLabel(props.value) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-quantity="props">
            <q-td :props="props" class="text-right">
              <span :class="getMovementQuantityClass(props.row.type)">
                {{ props.row.type === 'in' || props.row.type === 'reserve' ? '+' : '-' }}{{ props.value }}
              </span>
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ props.value ? formatDate(props.value) : '-' }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-separator />

      <!-- Payment Status -->
      <q-card-section v-if="paymentStatus">
        <div class="text-h6 q-mb-md">สถานะการชำระเงิน</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>สถานะใบแจ้งหนี้</q-item-label>
                  <q-item-label>
                    <q-badge :color="getInvoiceStatusColor(paymentStatus.invoice_status)" class="q-pa-sm">
                      {{ getInvoiceStatusLabel(paymentStatus.invoice_status) }}
                    </q-badge>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>ยอดรวมใบแจ้งหนี้</q-item-label>
                  <q-item-label class="text-h6">
                    {{ formatCurrency(paymentStatus.total_invoice_amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="col-12 col-md-6">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>ยอดชำระแล้ว</q-item-label>
                  <q-item-label class="text-h6 text-positive">
                    {{ formatCurrency(paymentStatus.total_paid_amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>ยอดค้างชำระ</q-item-label>
                  <q-item-label class="text-h6" :class="paymentStatus.total_outstanding_amount > 0 ? 'text-negative' : 'text-positive'">
                    {{ formatCurrency(paymentStatus.total_outstanding_amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
        <div v-if="paymentStatus.total_invoice_amount > 0" class="q-mt-md">
          <div class="text-caption q-mb-xs">ความคืบหน้าการชำระเงิน</div>
          <q-linear-progress
            :value="paymentStatus.total_paid_amount / paymentStatus.total_invoice_amount"
            color="positive"
            size="20px"
            rounded
          >
            <div class="absolute-full flex flex-center">
              <q-badge
                color="white"
                text-color="primary"
                :label="`${Math.round((paymentStatus.total_paid_amount / paymentStatus.total_invoice_amount) * 100)}%`"
              />
            </div>
          </q-linear-progress>
        </div>
      </q-card-section>

      <q-separator v-if="paymentStatus && paymentStatus.invoices && paymentStatus.invoices.length > 0" />

      <!-- Outstanding Invoices -->
      <q-card-section v-if="paymentStatus && paymentStatus.invoices && paymentStatus.invoices.length > 0">
        <div class="text-h6 q-mb-md">ใบแจ้งหนี้ที่ค้างชำระ</div>
        <q-table
          flat
          bordered
          :rows="paymentStatus.invoices"
          :columns="outstandingInvoiceColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getInvoiceStatusColor(props.value)">
                {{ getInvoiceStatusLabel(props.value) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-invoice_date="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template #body-cell-due_date="props">
            <q-td :props="props">
              {{ props.value ? formatDate(props.value) : '-' }}
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
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                color="primary"
                icon="visibility"
                label="ดู"
                @click="viewInvoice(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-separator v-if="salesOrder.invoices && salesOrder.invoices.length > 0" />

      <!-- All Invoices -->
      <q-card-section v-if="salesOrder.invoices && salesOrder.invoices.length > 0">
        <div class="text-h6 q-mb-md">ใบแจ้งหนี้ทั้งหมด</div>
        <q-table
          flat
          bordered
          :rows="salesOrder.invoices"
          :columns="invoiceColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getInvoiceStatusColor(props.value)">
                {{ getInvoiceStatusLabel(props.value) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-invoice_date="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template #body-cell-due_date="props">
            <q-td :props="props">
              {{ props.value ? formatDate(props.value) : '-' }}
            </q-td>
          </template>

          <template #body-cell-grand_total="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <template #body-cell-open_amount="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                color="primary"
                icon="visibility"
                label="ดู"
                @click="viewInvoice(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Installation Orders -->
      <q-separator v-if="salesOrder.installation_orders && salesOrder.installation_orders.length > 0" />
      <q-card-section v-if="salesOrder.installation_orders && salesOrder.installation_orders.length > 0">
        <div class="text-h6 q-mb-md">ใบสั่งติดตั้ง</div>
        <q-table
          flat
          bordered
          :rows="salesOrder.installation_orders"
          :columns="installationColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getInstallationStatusColor(props.value)">
                {{ getInstallationStatusLabel(props.value) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                color="primary"
                icon="visibility"
                label="ดู"
                @click="viewInstallation(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Notes -->
      <q-separator v-if="salesOrder.notes" />
      <q-card-section v-if="salesOrder.notes">
        <div class="text-h6 q-mb-md">หมายเหตุ</div>
        <div class="text-body2">{{ salesOrder.notes }}</div>
      </q-card-section>

      <q-separator />

      <!-- Sales Returns -->
      <q-separator v-if="salesReturns.length > 0" />
      <q-card-section v-if="salesReturns.length > 0">
        <div class="text-h6 q-mb-md">ใบคืนสินค้า</div>
        <q-table
          flat
          bordered
          :rows="salesReturns"
          :columns="salesReturnColumns"
          row-key="id"
          :loading="salesReturnsLoading"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.value === 'approved' ? 'positive' : 'grey'">
                {{ props.value === 'approved' ? 'อนุมัติแล้ว' : 'ร่าง' }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-returned_at="props">
            <q-td :props="props">
              {{ props.value ? formatDate(props.value) : '-' }}
            </q-td>
          </template>

          <template #body-cell-total="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.value) }}
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                dense
                color="primary"
                icon="visibility"
                label="ดู"
                @click="viewSalesReturn(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Audit Logs -->
      <q-separator />
      <q-card-section>
        <div class="text-h6 q-mb-md">ประวัติการเปลี่ยนแปลง</div>
        <q-table
          flat
          bordered
          :rows="auditLogs"
          :columns="auditLogColumns"
          row-key="id"
          :loading="auditLogsLoading"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #no-data>
            <div class="full-width row items-center justify-center text-grey q-gutter-sm q-pa-md">
              <q-icon name="warning" size="2em" />
              <div class="text-subtitle1">ยังไม่มีข้อมูล</div>
            </div>
          </template>
          <template #body-cell-action="props">
            <q-td :props="props">
              <q-badge :color="getActionColor(props.value)">
                {{ getActionLabel(props.value) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-user="props">
            <q-td :props="props">
              {{ props.value?.name || '-' }}
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Installation Request Modal -->
    <InstallationRequestModal
      v-model="showInstallationModal"
      :sales-order-id="salesOrder?.id || 0"
      :customer-addresses="customerAddresses"
      @submitted="handleInstallationRequest"
    />

    <!-- Invoice Create Modal -->
    <InvoiceCreateModal
      v-model="showInvoiceModal"
      :sales-order="salesOrder"
      @submitted="handleInvoiceCreate"
    />

    <!-- Partial Delivery Modal -->
    <PartialDeliveryModal
      v-model="showPartialDeliveryModal"
      :sales-order-id="salesOrder?.id || 0"
      :items="salesOrder?.items || []"
      @submitted="handlePartialDelivery"
    />

    <!-- Sales Return Create Modal -->
    <SalesReturnCreateModal
      v-model="showReturnModal"
      :sales-order-id="salesOrder?.id || 0"
      :items="salesOrder?.items || []"
      :warehouse-id="salesOrder?.warehouse_id ?? null"
      @submitted="handleReturnCreate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, Dialog } from 'quasar';
import { useSalesOrderStore } from '@/stores/sales/useSalesOrderStore';
import SalesOrderItemTable from '@/components/sales/SalesOrderItemTable.vue';
import InstallationRequestModal from '@/components/sales/InstallationRequestModal.vue';
import InvoiceCreateModal from '@/components/sales/InvoiceCreateModal.vue';
import PartialDeliveryModal from '@/components/sales/PartialDeliveryModal.vue';
import SalesReturnCreateModal from '@/components/sales/SalesReturnCreateModal.vue';
import { fetchStockMovements } from '@/services/catalog/stock.service';
import {
  requestInstallation,
  type InstallationRequestPayload,
  getSalesOrderAuditLogs,
  type AuditLog,
  createInvoiceFromSalesOrder,
  type InvoiceCreatePayload,
  getPaymentStatus,
} from '@/services/sales/salesOrder.service';
import { listSalesReturns } from '@/services/sales/salesReturn.service';
import type { SalesReturn } from '@/services/sales/salesReturn.service';
import type { SalesOrder, PaymentStatus } from '@/types/sales';
import type { StockMovement } from '@/types/catalog';
import type { SalesOrderStatus } from '@/types/sales';
import { formatCurrency } from '@/types/ar/common';
import type { QTableProps } from 'quasar';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const store = useSalesOrderStore();

const stockMovements = ref<StockMovement[]>([]);
const movementsLoading = ref(false);
const showInstallationModal = ref(false);
const installationLoading = ref(false);
const showInvoiceModal = ref(false);
const invoiceLoading = ref(false);
const showPartialDeliveryModal = ref(false);
const partialDeliveryLoading = ref(false);
const showReturnModal = ref(false);
const returnLoading = ref(false);
const auditLogs = ref<AuditLog[]>([]);
const auditLogsLoading = ref(false);
const salesReturns = ref<SalesReturn[]>([]);
const salesReturnsLoading = ref(false);

const auditLogColumns = [
  {
    name: 'created_at',
    label: 'วันที่',
    field: 'created_at',
    align: 'left' as const,
  },
  {
    name: 'user',
    label: 'ผู้ใช้',
    field: (row: AuditLog) => row.user,
    align: 'left' as const,
  },
  {
    name: 'action',
    label: 'การกระทำ',
    field: 'action',
    align: 'left' as const,
  },
];
const customerAddresses = ref<Array<{ id: number; address: string }>>([]);
const paymentStatus = ref<PaymentStatus | null>(null);
const paymentStatusLoading = ref(false);

const salesOrder = computed(() => store.current);

const canEdit = computed(() => {
  return salesOrder.value?.status === 'draft';
});

const canCancel = computed(() => {
  if (!salesOrder.value) return false;
  return !['completed', 'cancelled'].includes(salesOrder.value.status);
});

const canRequestInstallation = computed(() => {
  if (!salesOrder.value) return false;
  return ['confirmed', 'reserved', 'picking', 'shipping', 'delivered'].includes(salesOrder.value.status);
});

const canCreateInvoice = computed(() => {
  if (!salesOrder.value) return false;
  return ['delivered', 'completed'].includes(salesOrder.value.status);
});

const canPartialDeliver = computed(() => {
  if (!salesOrder.value) return false;
  return ['confirmed', 'reserved', 'picking', 'shipping', 'partially_delivered'].includes(
    salesOrder.value.status,
  );
});

const canCreateReturn = computed(() => {
  if (!salesOrder.value) return false;
  return ['delivered', 'completed', 'partially_delivered'].includes(salesOrder.value.status);
});

const getStatusColor = (status: SalesOrderStatus): string => {
  const colors: Record<SalesOrderStatus, string> = {
    draft: 'grey',
    confirmed: 'blue',
    reserved: 'orange',
    picking: 'purple',
    shipping: 'indigo',
    partially_delivered: 'warning',
    delivered: 'positive',
    completed: 'positive',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: SalesOrderStatus): string => {
  const labels: Record<SalesOrderStatus, string> = {
    draft: 'ร่าง',
    confirmed: 'ยืนยันแล้ว',
    reserved: 'จองแล้ว',
    picking: 'กำลังจัดเตรียม',
    shipping: 'กำลังจัดส่ง',
    partially_delivered: 'จัดส่งบางส่วน',
    delivered: 'จัดส่งแล้ว',
    completed: 'เสร็จสมบูรณ์',
    cancelled: 'ยกเลิก',
  };
  return labels[status] || status;
};

const movementColumns: QTableProps['columns'] = [
  {
    name: 'created_at',
    label: 'วันที่',
    field: 'created_at',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'type',
    label: 'ประเภท',
    field: 'type',
    align: 'center' as const,
  },
  {
    name: 'warehouseName',
    label: 'คลังสินค้า',
    field: 'warehouseName',
    align: 'left' as const,
  },
  {
    name: 'quantity',
    label: 'จำนวน',
    field: 'quantity',
    align: 'right' as const,
  },
  {
    name: 'reference',
    label: 'อ้างอิง',
    field: 'reference',
    align: 'left' as const,
  },
];

const outstandingInvoiceColumns: QTableProps['columns'] = [
  {
    name: 'invoice_no',
    label: 'เลขที่ใบแจ้งหนี้',
    field: 'invoice_no',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center' as const,
  },
  {
    name: 'invoice_date',
    label: 'วันที่',
    field: 'invoice_date',
    align: 'left' as const,
  },
  {
    name: 'due_date',
    label: 'ครบกำหนด',
    field: 'due_date',
    align: 'left' as const,
  },
  {
    name: 'grand_total',
    label: 'ยอดรวม',
    field: 'grand_total',
    align: 'right' as const,
  },
  {
    name: 'paid_total',
    label: 'ชำระแล้ว',
    field: 'paid_total',
    align: 'right' as const,
  },
  {
    name: 'open_amount',
    label: 'ยอดค้างชำระ',
    field: 'open_amount',
    align: 'right' as const,
  },
  {
    name: 'actions',
    label: 'จัดการ',
    field: '',
    align: 'right' as const,
  },
];

const invoiceColumns: QTableProps['columns'] = [
  {
    name: 'invoice_no',
    label: 'เลขที่ใบแจ้งหนี้',
    field: 'invoice_no',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center' as const,
  },
  {
    name: 'invoice_date',
    label: 'วันที่',
    field: 'invoice_date',
    align: 'left' as const,
  },
  {
    name: 'due_date',
    label: 'ครบกำหนด',
    field: 'due_date',
    align: 'left' as const,
  },
  {
    name: 'grand_total',
    label: 'ยอดรวม',
    field: 'grand_total',
    align: 'right' as const,
  },
  {
    name: 'open_amount',
    label: 'ยอดค้างชำระ',
    field: 'open_amount',
    align: 'right' as const,
  },
  {
    name: 'actions',
    label: 'จัดการ',
    field: '',
    align: 'right' as const,
  },
];

type InstallationOrderItem = NonNullable<SalesOrder['installation_orders']>[number];

const salesReturnColumns: QTableProps['columns'] = [
  {
    name: 'id',
    label: 'เลขที่',
    field: 'id',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center' as const,
  },
  {
    name: 'warehouse',
    label: 'คลังสินค้า',
    field: (row: SalesReturn) => row.warehouse?.name || '-',
    align: 'left' as const,
  },
  {
    name: 'reason',
    label: 'เหตุผล',
    field: 'reason',
    align: 'left' as const,
  },
  {
    name: 'returned_at',
    label: 'วันที่คืน',
    field: 'returned_at',
    align: 'left' as const,
  },
  {
    name: 'total',
    label: 'ยอดรวม',
    field: 'total',
    align: 'right' as const,
  },
  {
    name: 'created_at',
    label: 'วันที่สร้าง',
    field: 'created_at',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: 'จัดการ',
    field: '',
    align: 'right' as const,
  },
];

const installationColumns: QTableProps['columns'] = [
  {
    name: 'id',
    label: 'เลขที่',
    field: 'id',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center' as const,
  },
  {
    name: 'installation_address_override',
    label: 'ที่อยู่ติดตั้ง',
    field: (row: InstallationOrderItem) => row.installation_address_override || row.installation_address?.address || '-',
    align: 'left' as const,
  },
  {
    name: 'installation_contact_name',
    label: 'ผู้ติดต่อ',
    field: (row: InstallationOrderItem) => row.installation_contact_name || '-',
    align: 'left' as const,
  },
  {
    name: 'created_at',
    label: 'วันที่สร้าง',
    field: 'created_at',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: 'จัดการ',
    field: '',
    align: 'right' as const,
  },
];

const getMovementTypeColor = (type: string): string => {
  if (type === 'reserve') return 'orange';
  if (type === 'release') return 'blue';
  if (type === 'in') return 'positive';
  if (type === 'out') return 'negative';
  return 'grey';
};

const getMovementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    reserve: 'จอง',
    release: 'ปล่อยจอง',
    in: 'เข้า',
    out: 'ออก',
  };
  return labels[type] || type;
};

const getMovementQuantityClass = (type: string): string => {
  if (type === 'in' || type === 'reserve') return 'text-positive';
  if (type === 'out' || type === 'release') return 'text-negative';
  return '';
};

const getInstallationStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'grey',
    scheduled: 'blue',
    in_progress: 'orange',
    completed: 'positive',
    no_show: 'negative',
    pending_parts: 'warning',
  };
  return colors[status] || 'grey';
};

const getInstallationStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'ร่าง',
    scheduled: 'กำหนดเวลาแล้ว',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    no_show: 'ไม่มาติดตั้ง',
    pending_parts: 'รออะไหล่',
  };
  return labels[status] || status;
};

const loadPaymentStatus = async () => {
  if (!salesOrder.value?.id) return;

  paymentStatusLoading.value = true;
  try {
    paymentStatus.value = await getPaymentStatus(salesOrder.value.id);
  } catch (error) {
    console.error('Failed to load payment status:', error);
    paymentStatus.value = null;
  } finally {
    paymentStatusLoading.value = false;
  }
};

const getInvoiceStatusLabel = (status: string | undefined): string => {
  if (!status) return '-';
  const labels: Record<string, string> = {
    not_invoiced: 'ยังไม่ออกใบแจ้งหนี้',
    invoiced: 'ออกใบแจ้งหนี้แล้ว',
    partially_paid: 'ชำระบางส่วน',
    paid: 'ชำระครบแล้ว',
    draft: 'ร่าง',
    issued: 'ออกแล้ว',
    cancelled: 'ยกเลิก',
  };
  return labels[status] || status;
};

const getInvoiceStatusColor = (status: string | undefined): string => {
  if (!status) return 'grey';
  const colors: Record<string, string> = {
    not_invoiced: 'grey',
    invoiced: 'blue',
    partially_paid: 'orange',
    paid: 'positive',
    draft: 'grey',
    issued: 'blue',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

const loadStockMovements = async () => {
  if (!salesOrder.value?.id) return;

  movementsLoading.value = true;
  try {
    const response = await fetchStockMovements({
      soId: salesOrder.value.id,
      page: 1,
      perPage: 100,
    });
    stockMovements.value = response.data || [];
  } catch (error) {
    console.error('Failed to load stock movements:', error);
    stockMovements.value = [];
  } finally {
    movementsLoading.value = false;
  }
};

const handleConfirm = () => {
  if (!salesOrder.value) return;

  Dialog.create({
    title: 'ยืนยันคำสั่งขาย',
    message: 'คุณต้องการยืนยันคำสั่งขายนี้หรือไม่?',
    cancel: {
      label: 'ยกเลิก',
      flat: true,
    },
    ok: {
      label: 'ตกลง',
      color: 'primary',
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.confirm(salesOrder.value!.id);
        $q.notify({
          type: 'positive',
          message: 'ยืนยันคำสั่งขายสำเร็จ',
        });
        await store.loadById(salesOrder.value!.id);
        await loadStockMovements();
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        });
      }
    })();
  });
};

const handleReserve = () => {
  if (!salesOrder.value) return;

  Dialog.create({
    title: 'จองสต็อก',
    message: 'คุณต้องการจองสต็อกสำหรับคำสั่งขายนี้หรือไม่?',
    cancel: {
      label: 'ยกเลิก',
      flat: true,
    },
    ok: {
      label: 'ตกลง',
      color: 'primary',
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
    try {
      await store.reserve(salesOrder.value!.id);
      $q.notify({
        type: 'positive',
        message: 'จองสต็อกสำเร็จ',
      });
      await store.loadById(salesOrder.value!.id);
      await loadStockMovements();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      });
    }
    })();
  });
};

const handleDeliver = () => {
  if (!salesOrder.value) return;

  Dialog.create({
    title: 'จัดส่งสินค้า',
    message: 'คุณต้องการจัดส่งสินค้าสำหรับคำสั่งขายนี้หรือไม่?',
    cancel: {
      label: 'ยกเลิก',
      flat: true,
    },
    ok: {
      label: 'ตกลง',
      color: 'primary',
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
    try {
      await store.deliver(salesOrder.value!.id);
      $q.notify({
        type: 'positive',
        message: 'จัดส่งสินค้าสำเร็จ',
      });
      await store.loadById(salesOrder.value!.id);
      await loadStockMovements();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      });
    }
    })();
  });
};

const handleCancel = () => {
  if (!salesOrder.value) return;

  Dialog.create({
    title: 'ยกเลิกคำสั่งขาย',
    message: 'คุณต้องการยกเลิกคำสั่งขายนี้หรือไม่?',
    cancel: {
      label: 'ยกเลิก',
      flat: true,
    },
    ok: {
      label: 'ตกลง',
      color: 'primary',
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.cancel(salesOrder.value!.id);
        $q.notify({
          type: 'positive',
          message: 'ยกเลิกคำสั่งขายสำเร็จ',
        });
        await store.loadById(salesOrder.value!.id);
        await loadStockMovements();
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        });
      }
    })();
  });
};

const goBack = () => {
  router.back();
};

const goToEdit = () => {
  if (salesOrder.value) {
    void router.push({ name: 'sales-orders-edit', params: { id: salesOrder.value.id } });
  }
};

const handleInstallationRequest = async (payload: InstallationRequestPayload) => {
  if (!salesOrder.value) return;

  installationLoading.value = true;
  try {
    await requestInstallation(salesOrder.value.id, payload);
    $q.notify({
      type: 'positive',
      message: 'ขอใบสั่งติดตั้งสำเร็จ',
    });
    showInstallationModal.value = false;
    // Reload sales order to get updated installation orders
    await store.loadById(salesOrder.value.id);
  } catch (error: unknown) {
    const message =
      (error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : null) ||
      (error instanceof Error ? error.message : null) ||
      'เกิดข้อผิดพลาด';
    $q.notify({
      type: 'negative',
      message,
    });
  } finally {
    installationLoading.value = false;
  }
};

const viewInstallation = (installationId: number) => {
  void router.push({ name: 'installations-detail', params: { id: installationId } });
};

const handleInvoiceCreate = async (payload: InvoiceCreatePayload) => {
  if (!salesOrder.value) return;

  invoiceLoading.value = true;
  try {
    const invoice = await createInvoiceFromSalesOrder(salesOrder.value.id, payload);
    $q.notify({
      type: 'positive',
      message: 'สร้างใบแจ้งหนี้สำเร็จ',
    });
    showInvoiceModal.value = false;
    // Reload sales order to get updated invoices
    await store.loadById(salesOrder.value.id);
    await loadPaymentStatus();
    // Navigate to invoice detail page
    void router.push({ name: 'ar-invoices-detail', params: { id: invoice.id } });
  } catch (error: unknown) {
    const message =
      (error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : null) ||
      (error instanceof Error ? error.message : null) ||
      'เกิดข้อผิดพลาด';
    $q.notify({
      type: 'negative',
      message,
    });
  } finally {
    invoiceLoading.value = false;
  }
};

const viewInvoice = (invoiceId: number) => {
  void router.push({ name: 'ar-invoices-detail', params: { id: invoiceId } });
};

// Load customer addresses if available
const loadCustomerAddresses = () => {
  if (!salesOrder.value?.customer_id) return;

  // TODO: Load customer addresses from API if needed
  // For now, we'll use empty array
  customerAddresses.value = [];
};

const getActionColor = (action: string): string => {
  const colors: Record<string, string> = {
    created: 'positive',
    updated: 'info',
    confirmed: 'positive',
    reserved: 'orange',
    delivered: 'positive',
    cancelled: 'negative',
  };
  return colors[action] || 'grey';
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    created: 'สร้าง',
    updated: 'แก้ไข',
    confirmed: 'ยืนยัน',
    reserved: 'จองสต็อก',
    delivered: 'จัดส่ง',
    cancelled: 'ยกเลิก',
  };
  return labels[action] || action;
};

const loadAuditLogs = async () => {
  if (!salesOrder.value) return;
  auditLogsLoading.value = true;
  try {
    const result = await getSalesOrderAuditLogs(salesOrder.value.id);
    auditLogs.value = result.data;
  } catch (error) {
    console.error('Error loading audit logs:', error);
  } finally {
    auditLogsLoading.value = false;
  }
};

const loadSalesReturns = async () => {
  if (!salesOrder.value) return;
  salesReturnsLoading.value = true;
  try {
    const result = await listSalesReturns({
      sales_order_id: salesOrder.value.id,
      per_page: 100,
    });
    salesReturns.value = result.data;
  } catch (error) {
    console.error('Error loading sales returns:', error);
    salesReturns.value = [];
  } finally {
    salesReturnsLoading.value = false;
  }
};

const handlePartialDelivery = async () => {
  if (!salesOrder.value) return;
  await store.loadById(salesOrder.value.id);
  await loadStockMovements();
  showPartialDeliveryModal.value = false;
};

const handleReturnCreate = async () => {
  if (!salesOrder.value) return;
  await store.loadById(salesOrder.value.id);
  await loadSalesReturns();
  showReturnModal.value = false;
};

const viewSalesReturn = (returnId: number) => {
  // TODO: Navigate to sales return detail page
  console.log('View sales return:', returnId);
};

onMounted(async () => {
  const id = Number(route.params.id);
  await store.loadById(id);
  await loadStockMovements();
  loadCustomerAddresses();
  await loadPaymentStatus();
  await loadAuditLogs();
  await loadSalesReturns();
});
</script>
