# roiet APP (fui-furniture)

front-end UI

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

## Catalog Module Quickstart

```bash
# สร้างไฟล์ environment จากตัวอย่าง
cp .env.example .env

# เริ่มเซิร์ฟเวอร์พัฒนา
npm run dev

# รัน lint & test ของโมดูล catalog
npm run lint
npm run test
```

## Developer Utilities

- `src/composables/useNotifier.ts` – ตัวช่วยแจ้งเตือน success/error/info แบบมาตรฐาน
- `src/composables/useLoadingOverlay.ts` – ครอบการเรียก async พร้อม overlay โหลด
- `src/composables/useTableFilters.ts` – จัดการ state และซิงค์ query สำหรับตาราง/ฟิลเตอร์
- `src/composables/useCrudForm.ts` – จัดการสถานะ form create/edit พร้อมข้อความสำเร็จ/ผิดพลาด

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
