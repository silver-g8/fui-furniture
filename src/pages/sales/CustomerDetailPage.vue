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
                  <q-item v-if="customer.address">
                    <q-item-section>
                      <q-item-label overline>ที่อยู่</q-item-label>
                      <q-item-label>{{ customer.address }}</q-item-label>
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
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getCustomer,
  getCustomerPurchases,
  type Customer,
  type PurchasedProduct,
} from '@/services/sales/api';
import { useNotifier } from '@/composables/useNotifier';

const route = useRoute();
const router = useRouter();
const { error: notifyError } = useNotifier();

const tab = ref<'overview' | 'purchases'>('overview');
const customerId = Number(route.params.id);
const loading = ref(false);
const purchasesLoading = ref(false);
const customer = ref<Customer | null>(null);
const purchasedProducts = ref<PurchasedProduct[]>([]);

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

// Watch tab changes to load purchases when needed
watch(tab, () => {
  if (
    tab.value === 'purchases' &&
    purchasedProducts.value.length === 0 &&
    !purchasesLoading.value
  ) {
    loadPurchases();
  }
});
</script>
