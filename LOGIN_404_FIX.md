# 🔧 แก้ไขปัญหา Login 404 Error

## ปัญหา
```
POST https://image.sg8net.com/api/v1/auth/login 404 Not Found
```

Login request ไปที่ Frontend domain (`image.sg8net.com`) แทนที่จะเป็น Backend domain (`imageapi.sg8net.com`)

## สาเหตุ
`VITE_API_BASE_URL` ไม่ได้ตั้งค่าเป็น **full URL** ใน production build ทำให้ `apiBaseURL` เป็น relative path (`/api/v1`) และ axios ใช้ current origin (Frontend domain)

## วิธีแก้ไข

### ขั้นตอนที่ 1: ตรวจสอบไฟล์ `.env.production`

ตรวจสอบว่าไฟล์ `.env.production` ในโฟลเดอร์ `fui-furniture` มี:

```env
# ⚠️ สำคัญ: ต้องเป็น full URL (เริ่มด้วย https://)
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1

# หรือใช้ VITE_BACKEND_URL (สำหรับ CSRF cookie)
VITE_BACKEND_URL=https://imageapi.sg8net.com
```

**❌ ผิด:**
```env
VITE_API_BASE_URL=/api/v1
```

**✅ ถูก:**
```env
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
```

### ขั้นตอนที่ 2: ลบโฟลเดอร์ `dist/` และ Build ใหม่

```bash
cd C:\Users\silve\project\roiet\fui-furniture

# ลบโฟลเดอร์ dist (ถ้ามี)
rm -rf dist

# หรือใน Windows
rmdir /s /q dist

# Build ใหม่
npm run build
```

### ขั้นตอนที่ 3: ตรวจสอบ Build Output

ตรวจสอบว่า environment variable ถูก embed ใน build:

1. เปิดไฟล์ `dist/spa/assets/*.js` (ไฟล์ JavaScript ที่ build แล้ว)
2. ค้นหา `imageapi.sg8net.com` หรือ `VITE_API_BASE_URL`
3. ควรเห็น URL ที่ถูกต้อง: `https://imageapi.sg8net.com/api/v1`

หรือตรวจสอบใน Browser Console:

```javascript
// ตรวจสอบว่า apiBaseURL ถูกตั้งค่าถูกต้อง
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

ควรเห็น:
```
API Base URL: https://imageapi.sg8net.com/api/v1
```

### ขั้นตอนที่ 4: อัปโหลดไฟล์ใหม่

อัปโหลดไฟล์ทั้งหมดจาก `dist/spa/` ไปยัง server

### ขั้นตอนที่ 5: ตรวจสอบใน Browser

1. เปิด Browser Developer Tools (F12)
2. ไปที่ Tab **Console** - ตรวจสอบว่าไม่มี error เกี่ยวกับ `apiBaseURL`
3. ไปที่ Tab **Network** - ตรวจสอบว่า login request ไปที่:
   - ✅ **ถูกต้อง**: `https://imageapi.sg8net.com/api/v1/auth/login`
   - ❌ **ผิด**: `https://image.sg8net.com/api/v1/auth/login`

## วิธีตรวจสอบว่า Environment Variable ถูกตั้งค่าถูกต้อง

### ใน Browser Console

เปิด Browser Console และพิมพ์:

```javascript
// ตรวจสอบ environment variable
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// ตรวจสอบ apiBaseURL ที่ใช้จริง (ต้อง import จาก boot/axios ก่อน)
// หรือดูใน Network tab ว่า request ไปที่ไหน
```

### ตรวจสอบ Network Request

1. เปิด Developer Tools → Network
2. Filter: `login`
3. ดู Request URL - ควรเป็น `https://imageapi.sg8net.com/api/v1/auth/login`

## ถ้ายังไม่ได้ผล

### วิธีที่ 1: ตรวจสอบว่าไฟล์ถูก Build ใหม่จริงๆ

1. ลบโฟลเดอร์ `dist/` ทั้งหมด
2. Build ใหม่: `npm run build`
3. ตรวจสอบ timestamp ของไฟล์ใน `dist/spa/`
4. อัปโหลดไฟล์ใหม่ทั้งหมด

### วิธีที่ 2: Hard Refresh Browser

1. Hard refresh: `Ctrl + Shift + R` (Windows) หรือ `Cmd + Shift + R` (Mac)
2. หรือ Clear cache และ reload

### วิธีที่ 3: ตรวจสอบว่า `.env.production` อยู่ในตำแหน่งที่ถูกต้อง

ไฟล์ `.env.production` ต้องอยู่ในโฟลเดอร์ root ของโปรเจกต์:

```
fui-furniture/
├── .env.production  ← ต้องอยู่ที่นี่
├── package.json
├── quasar.config.ts
└── src/
```

## Checklist

- [ ] ไฟล์ `.env.production` มี `VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1` (full URL)
- [ ] ลบโฟลเดอร์ `dist/` แล้ว
- [ ] Build โปรเจกต์ใหม่: `npm run build`
- [ ] ตรวจสอบ Build Output ว่ามี URL ที่ถูกต้อง
- [ ] อัปโหลดไฟล์ใหม่จาก `dist/spa/` ไปยัง server
- [ ] ตรวจสอบใน Browser Console ว่า `VITE_API_BASE_URL` ถูกต้อง
- [ ] ตรวจสอบใน Network tab ว่า login request ไปที่ Backend domain
- [ ] Clear browser cache (ถ้าจำเป็น)

## หมายเหตุ

- Environment variables ใน Vite จะถูก embed ใน **build time**
- ถ้าเปลี่ยน `.env.production` ต้อง **build ใหม่** ทุกครั้ง
- ตรวจสอบว่าไฟล์ `.env.production` อยู่ในโฟลเดอร์ `fui-furniture` (root ของโปรเจกต์)
- ตรวจสอบว่าไฟล์ที่อัปโหลดไปยัง server เป็นไฟล์ที่ build ใหม่จริงๆ

