# 🔧 แก้ไขปัญหา Environment Variable ไม่ถูก Embed ใน Build

## ปัญหา
- Login request ยังไปที่ Frontend domain (`image.sg8net.com`)
- ในไฟล์ build output พบว่า `apiBaseURL="/api/v1"` (relative path)
- `VITE_API_BASE_URL` ไม่ถูก embed ใน build

## สาเหตุ
Vite อาจไม่ได้อ่านไฟล์ `.env.production` หรือ build ไม่ได้ใช้ mode production

## วิธีแก้ไข

### ขั้นตอนที่ 1: ตรวจสอบไฟล์ .env.production

ตรวจสอบว่าไฟล์ `.env.production` มีเนื้อหาดังนี้:

```env
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
VITE_BACKEND_URL=https://imageapi.sg8net.com
```

**⚠️ สำคัญ:**
- ต้องไม่มี space หรือ tab นำหน้า
- ต้องไม่มี comment (`#`) ในบรรทัดเดียวกัน
- ต้องไม่มี quotes (`"` หรือ `'`) รอบค่า

**❌ ผิด:**
```env
  VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1  # มี space นำหน้า
VITE_API_BASE_URL="https://imageapi.sg8net.com/api/v1"  # มี quotes
```

**✅ ถูก:**
```env
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
VITE_BACKEND_URL=https://imageapi.sg8net.com
```

### ขั้นตอนที่ 2: ลบโฟลเดอร์ dist และ node_modules/.vite

```bash
cd C:\Users\silve\project\roiet\fui-furniture

# ลบโฟลเดอร์ dist
rmdir /s /q dist

# ลบ cache ของ Vite (ถ้ามี)
rmdir /s /q node_modules\.vite
```

### ขั้นตอนที่ 3: Build ด้วย Mode Production อย่างชัดเจน

```bash
# วิธีที่ 1: ใช้ NODE_ENV
set NODE_ENV=production
npm run build

# วิธีที่ 2: ใช้ Quasar CLI mode
npx quasar build -m spa
```

### ขั้นตอนที่ 4: ตรวจสอบ Build Output

1. เปิดไฟล์ `dist/spa/assets/index-*.js`
2. ค้นหา `imageapi.sg8net.com` - ควรเห็น URL ที่ถูกต้อง
3. หรือค้นหา `baseURL` - ควรเห็น `https://imageapi.sg8net.com/api/v1`

**ตัวอย่างที่ควรเห็น:**
```javascript
baseURL:"https://imageapi.sg8net.com/api/v1"
// หรือ
xn="https://imageapi.sg8net.com/api/v1"
```

### ขั้นตอนที่ 5: ถ้ายังไม่ได้ผล - ตรวจสอบ Quasar Config

ตรวจสอบว่า `quasar.config.ts` ไม่ได้ override environment variables:

```typescript
build: {
  // ตรวจสอบว่าไม่มี env: {} ที่ override
  // env: {}, // ถ้ามี ให้ลบหรือแก้ไข
}
```

### ขั้นตอนที่ 6: ตรวจสอบว่าไฟล์ถูก Build ใหม่จริงๆ

1. ตรวจสอบ timestamp ของไฟล์ใน `dist/spa/assets/`
2. ควรเป็นเวลาที่ build ล่าสุด

## วิธีตรวจสอบว่า Environment Variable ถูก Embed

### วิธีที่ 1: ค้นหาในไฟล์ Build Output

```bash
cd C:\Users\silve\project\roiet\fui-furniture\dist\spa\assets
findstr /i "imageapi" *.js
```

ควรเห็น: `https://imageapi.sg8net.com`

### วิธีที่ 2: ตรวจสอบใน Browser Network Tab

1. เปิด Browser Developer Tools (F12)
2. ไปที่ Tab **Network**
3. ลอง Login
4. ดู Request URL - ควรเป็น `https://imageapi.sg8net.com/api/v1/auth/login`

## Checklist

- [ ] ไฟล์ `.env.production` มี `VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1` (ไม่มี space, quotes)
- [ ] ลบโฟลเดอร์ `dist/` แล้ว
- [ ] ลบ cache ของ Vite (`node_modules/.vite`) แล้ว
- [ ] Build โปรเจกต์ใหม่: `npm run build` หรือ `npx quasar build -m spa`
- [ ] ตรวจสอบ Build Output ว่ามี `imageapi.sg8net.com` ในไฟล์ JS
- [ ] ตรวจสอบว่าไฟล์ถูก build ใหม่จริงๆ (timestamp)
- [ ] อัปโหลดไฟล์ใหม่จาก `dist/spa/` ไปยัง server

## หมายเหตุ

- Vite จะอ่าน `.env.production` เมื่อ `NODE_ENV=production` หรือ build mode เป็น production
- Quasar CLI ควรจะอ่าน `.env.production` อัตโนมัติเมื่อ build
- ถ้ายังไม่ได้ผล อาจต้องตรวจสอบ Quasar config หรือ Vite config

