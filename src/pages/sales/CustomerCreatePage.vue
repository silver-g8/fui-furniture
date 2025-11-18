<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">เพิ่มลูกค้าใหม่</div>
          <div class="text-subtitle2 text-grey-7">กรอกข้อมูลลูกค้าเพื่อสร้างรายการใหม่</div>
        </div>
        <q-btn flat color="primary" icon="arrow_back" label="กลับ" @click="goBack" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <customer-form
          v-model="form"
          :loading="saving"
          :is-edit="false"
          submit-label="บันทึก"
          cancel-label="ยกเลิก"
          @submit="handleSubmit"
          @cancel="goBack"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CustomerForm from '@/components/sales/CustomerForm.vue';
import type { CustomerPayload } from '@/services/sales/api';
import { createCustomer } from '@/services/sales/api';
import { useNotifier } from '@/composables/useNotifier';

const router = useRouter();
const { success: notifySuccess, error: notifyError } = useNotifier();

const form = ref<CustomerPayload>({
  code: '',
  name: '',
  email: '',
  phone: '',
  tax_id: null,
  address: '',
  shipping_address: null,
  billing_address: null,
  is_active: true,
  notes: null,
  payment_type: 'cash',
  credit_limit: null,
  credit_term_days: null,
  credit_note: null,
});

const saving = ref(false);

const goBack = () => {
  router.back();
};

const handleSubmit = async (payload: CustomerPayload) => {
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

    await createCustomer(payload);
    notifySuccess({ message: 'สร้างลูกค้าเรียบร้อยแล้ว' });
    await router.push({ name: 'sales-customers-list' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถสร้างลูกค้าใหม่ได้';
    notifyError({ message });
  } finally {
    saving.value = false;
  }
};
</script>
