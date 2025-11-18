<template>
  <q-page padding v-if="quotation">
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">ใบเสนอราคา: {{ quotation.quotation_no }}</div>
          <div class="text-subtitle2 text-grey-7">รายละเอียดใบเสนอราคา</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
          <q-btn
            v-if="quotation.status === 'draft'"
            flat
            color="primary"
            icon="edit"
            label="แก้ไข"
            @click="goToEdit"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-subtitle2 q-mb-sm">ข้อมูลลูกค้า</div>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label>ชื่อลูกค้า</q-item-label>
                  <q-item-label caption>{{ quotation.customer?.name }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>รหัสลูกค้า</q-item-label>
                  <q-item-label caption>{{ quotation.customer?.code }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="col-12 col-md-6">
            <div class="text-subtitle2 q-mb-sm">ข้อมูลใบเสนอราคา</div>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label>วันที่</q-item-label>
                  <q-item-label caption>{{ formatDate(quotation.quotation_date) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>วันหมดอายุ</q-item-label>
                  <q-item-label caption>
                    {{ quotation.expiry_date ? formatDate(quotation.expiry_date) : '-' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>สถานะ</q-item-label>
                  <q-item-label>
                    <q-badge :color="getStatusColor(quotation.status)">
                      {{ getStatusLabel(quotation.status) }}
                    </q-badge>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">รายการสินค้า</div>
        <quotation-item-table :items="quotation.items || []" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row justify-end">
          <div class="col-12 col-md-4">
            <q-list>
              <q-item>
                <q-item-section>ยอดรวม</q-item-section>
                <q-item-section side>{{ formatCurrency(quotation.subtotal) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>ส่วนลด</q-item-section>
                <q-item-section side>-{{ formatCurrency(quotation.discount) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>ภาษี</q-item-section>
                <q-item-section side>{{ formatCurrency(quotation.tax) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section class="text-weight-bold">ยอดรวมทั้งสิ้น</q-item-section>
                <q-item-section side class="text-weight-bold">
                  {{ formatCurrency(quotation.grand_total) }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="quotation.notes">
        <div class="text-subtitle2 q-mb-sm">หมายเหตุ</div>
        <div>{{ quotation.notes }}</div>
      </q-card-section>

      <q-card-actions>
        <template v-if="quotation.status === 'draft'">
          <q-btn
            color="primary"
            icon="send"
            label="ส่งอนุมัติ"
            @click="handleSubmitForApproval"
            :loading="store.saving"
          />
        </template>
        <template v-if="quotation.status === 'waiting'">
          <q-btn
            color="positive"
            icon="check"
            label="อนุมัติ"
            @click="handleApprove"
            :loading="store.saving"
          />
          <q-btn
            color="negative"
            icon="close"
            label="ปฏิเสธ"
            @click="showRejectDialog = true"
            :loading="store.saving"
          />
        </template>
        <template v-if="quotation.status === 'approved'">
          <q-btn
            color="positive"
            icon="attach_money"
            label="ส่งไปขายเงินสด"
            @click="goToCashSale"
          />
          <q-btn
            color="primary"
            icon="add_shopping_cart"
            label="สร้าง Sales Order"
            @click="createSalesOrder"
            :loading="store.saving"
          />
          <q-btn
            color="secondary"
            icon="edit"
            label="สร้าง Sales Order (แก้ไขได้)"
            @click="goToCreateSalesOrder"
          />
        </template>
      </q-card-actions>

      <q-separator />

      <!-- Audit Logs -->
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">ประวัติการเปลี่ยนแปลง</div>
        <q-table
          flat
          bordered
          :rows="auditLogs"
          :columns="auditLogColumns"
          row-key="id"
          :loading="auditLogsLoading"
          :pagination="{ rowsPerPage: 10 }"
        >
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

    <!-- Reject Dialog -->
    <q-dialog v-model="showRejectDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">ปฏิเสธใบเสนอราคา</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="rejectReason"
            label="เหตุผลในการปฏิเสธ *"
            type="textarea"
            outlined
            dense
            rows="3"
            :rules="[(val) => !!val || 'กรุณาระบุเหตุผลในการปฏิเสธ']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" color="primary" v-close-popup />
          <q-btn
            flat
            label="ปฏิเสธ"
            color="negative"
            @click="handleReject"
            :loading="store.saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuotationStore } from '@/stores/sales/useQuotationStore';
import QuotationItemTable from '@/components/sales/QuotationItemTable.vue';
import { formatCurrency, formatDate } from '@/types/ar/common';
import { useNotifier } from '@/composables/useNotifier';
import type { QuotationStatus } from '@/types/sales';
import { getQuotationAuditLogs, type AuditLog } from '@/services/sales/quotation.service';

const route = useRoute();
const router = useRouter();
const store = useQuotationStore();
const { success: notifySuccess, error: notifyError } = useNotifier();

const quotation = computed(() => store.current);
const auditLogs = ref<AuditLog[]>([]);
const auditLogsLoading = ref(false);
const showRejectDialog = ref(false);
const rejectReason = ref('');

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

const getStatusColor = (status: QuotationStatus): string => {
  const colors: Record<QuotationStatus, string> = {
    draft: 'grey',
    waiting: 'orange',
    approved: 'positive',
    rejected: 'negative',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: QuotationStatus): string => {
  const labels: Record<QuotationStatus, string> = {
    draft: 'ร่าง',
    waiting: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ',
  };
  return labels[status] || status;
};

const goBack = () => {
  router.back();
};

const goToEdit = () => {
  void router.push({ name: 'sales-quotations-edit', params: { id: quotation.value?.id } });
};

const createSalesOrder = async () => {
  if (!quotation.value) return;
  try {
    const salesOrder = await store.createSalesOrder(quotation.value.id);
    notifySuccess({ message: 'สร้าง Sales Order เรียบร้อยแล้ว' });
    await router.push({
      name: 'sales-orders-detail',
      params: { id: salesOrder.id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถสร้าง Sales Order ได้';
    notifyError({ message });
  }
};

const goToCreateSalesOrder = () => {
  if (!quotation.value) return;
  void router.push({
    name: 'sales-orders-create',
    query: { quotation_id: quotation.value.id },
  });
};

const goToCashSale = () => {
  if (!quotation.value) return;
  void router.push({
    name: 'sales-cash-sale',
    query: { quotation_id: quotation.value.id },
  });
};

const handleSubmitForApproval = async () => {
  if (!quotation.value) return;
  try {
    // Update status to 'waiting'
    await store.update(quotation.value.id, { status: 'waiting' });
    notifySuccess({ message: 'ส่งอนุมัติใบเสนอราคาเรียบร้อยแล้ว' });
    // Reload quotation data
    await store.loadById(quotation.value.id);
    await loadAuditLogs();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถส่งอนุมัติใบเสนอราคาได้';
    notifyError({ message });
  }
};

const handleApprove = async () => {
  if (!quotation.value) return;
  try {
    await store.approve(quotation.value.id);
    notifySuccess({ message: 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว' });
    // Reload quotation data
    await store.loadById(quotation.value.id);
    await loadAuditLogs();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถอนุมัติใบเสนอราคาได้';
    notifyError({ message });
  }
};

const handleReject = async () => {
  if (!quotation.value || !rejectReason.value.trim()) {
    notifyError({ message: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
    return;
  }
  try {
    await store.reject(quotation.value.id, rejectReason.value.trim());
    notifySuccess({ message: 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว' });
    showRejectDialog.value = false;
    rejectReason.value = '';
    // Reload quotation data
    await store.loadById(quotation.value.id);
    await loadAuditLogs();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถปฏิเสธใบเสนอราคาได้';
    notifyError({ message });
  }
};

const getActionColor = (action: string): string => {
  const colors: Record<string, string> = {
    created: 'positive',
    updated: 'info',
    approved: 'positive',
    cancelled: 'negative',
    rejected: 'negative',
  };
  return colors[action] || 'grey';
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    created: 'สร้าง',
    updated: 'แก้ไข',
    approved: 'อนุมัติ',
    cancelled: 'ยกเลิก',
    rejected: 'ปฏิเสธ',
  };
  return labels[action] || action;
};

const loadAuditLogs = async () => {
  if (!quotation.value) return;
  auditLogsLoading.value = true;
  try {
    const result = await getQuotationAuditLogs(quotation.value.id);
    auditLogs.value = result.data;
  } catch (error) {
    console.error('Error loading audit logs:', error);
  } finally {
    auditLogsLoading.value = false;
  }
};

onMounted(async () => {
  const id = Number(route.params.id);
  await store.loadById(id);
  await loadAuditLogs();
});
</script>

