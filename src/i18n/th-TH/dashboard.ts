export default {
  title: 'ภาพรวมแดชบอร์ด',
  loading: 'กำลังโหลดข้อมูล...',
  noData: 'ยังไม่มีข้อมูล',
  chartSummary: '{points} คะแนน • รวม {total}',
  lastUpdated: {
    never: 'ยังไม่เคยดึงข้อมูล',
    at: 'อัปเดตล่าสุด {datetime}',
  },
  errors: {
    generic: 'ไม่สามารถโหลดวิดเจ็ตนี้ได้ กรุณาลองใหม่อีกครั้ง',
  },
  actions: {
    refresh: 'รีเฟรช',
    export: 'ส่งออก',
    retry: 'ลองใหม่',
  },
  chartTypes: {
    line: 'กราฟเส้น',
    bar: 'กราฟแท่ง',
    pie: 'กราฟพาย',
    doughnut: 'กราฟโดนัท',
    area: 'กราฟพื้นที่',
  },
  widgets: {
    salesOverview: {
      title: 'ภาพรวมยอดขาย',
      label: 'ยอดขายรวม',
      period: 'เทียบกับเดือนก่อน',
    },
    recentOrders: {
      title: 'คำสั่งซื้อล่าสุด',
    },
    revenueChart: {
      title: 'แนวโน้มรายได้',
    },
    inventoryHealth: {
      title: 'สถานะคลังสินค้า',
    },
    topProducts: {
      title: 'สินค้าขายดี',
    },
    recentActivity: {
      title: 'กิจกรรมล่าสุด',
      items: {
        orderCreated: 'สร้างคำสั่งซื้อใหม่',
        stockAdjusted: 'มีการปรับสต็อก',
        newSupplier: 'เพิ่มซัพพลายเออร์ใหม่',
      },
    },
  },
};

