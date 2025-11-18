<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">แก้ไขลูกค้า</div>
          <div class="text-subtitle2 text-grey-7">ปรับปรุงข้อมูลลูกค้า</div>
        </div>
        <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="loading" class="q-pa-lg flex flex-center">
        <q-spinner size="42px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
        <customer-form
          v-if="form"
          v-model="form"
          :loading="saving"
          :is-edit="true"
          submit-label="บันทึกการแก้ไข"
          cancel-label="ยกเลิก"
          @submit="handleSubmit"
          @cancel="goBack"
        />
        <div v-else class="text-grey-6">ไม่พบข้อมูลลูกค้า</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CustomerForm from '@/components/sales/CustomerForm.vue';
import type { CustomerPayload, Customer } from '@/services/sales/api';
import { getCustomer, updateCustomer } from '@/services/sales/api';
import { useNotifier } from '@/composables/useNotifier';

const route = useRoute();
const router = useRouter();
const { success: notifySuccess, error: notifyError } = useNotifier();

const loading = ref(false);
const saving = ref(false);
const form = ref<CustomerPayload | null>(null);

const customerId = Number(route.params.id);

const goBack = () => {
  router.back();
};

const loadCustomer = async () => {
  loading.value = true;
  try {
    const customer: Customer = await getCustomer(customerId);
    form.value = {
      code: customer.code,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      tax_id: customer.tax_id ?? null,
      address: customer.address,
      shipping_address: customer.shipping_address ?? null,
      billing_address: customer.billing_address ?? null,
      is_active: customer.is_active,
      notes: customer.notes ?? null,
      payment_type: customer.payment_type,
      customer_group: customer.customer_group,
      credit_limit: customer.credit_limit ?? null,
      credit_term_days: customer.credit_term_days ?? null,
      credit_note: customer.credit_note ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลลูกค้าได้';
    notifyError({ message });
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async (payload: CustomerPayload) => {
  if (!form.value) return;
  saving.value = true;
  try {
    if (payload.payment_type === 'credit') {
      if (payload.credit_limit == null || payload.credit_term_days == null) {
        notifyError({
          message: 'กรุณากรอกวงเงินเครดิตและจำนวนวันเครดิตสำหรับลูกค้าเครดิต',
        });
        saving.value = false;
        return;
      }
    }

    await updateCustomer(customerId, payload);
    notifySuccess({ message: 'บันทึกการแก้ไขลูกค้าเรียบร้อยแล้ว' });
    await router.push({ name: 'sales-customers-list' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถบันทึกการแก้ไขลูกค้าได้';
    notifyError({ message });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void loadCustomer();
});
</script>
