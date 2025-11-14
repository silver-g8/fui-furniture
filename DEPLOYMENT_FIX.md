# 🔧 วิธีแก้ปัญหา CSRF Cookie 404 Error

## ปัญหา

```
GET https://image.sg8net.com/sanctum/csrf-cookie 404 (Not Found)
```

Frontend เรียก CSRF cookie endpoint ที่ domain ผิด (Frontend domain แทน Backend domain)

## สาเหตุ

`VITE_API_BASE_URL` ไม่ได้ตั้งค่าเป็น **full URL** ใน production build ทำให้โค้ด fallback ไปใช้ Frontend domain

## วิธีแก้ไข

### ขั้นตอนที่ 1: สร้างไฟล์ `.env.production`

สร้างไฟล์ `.env.production` ในโฟลเดอร์ `fui-furniture`:

```env
# ⚠️ สำคัญ: ต้องตั้งค่าอย่างน้อย 1 ตัว

# วิธีที่ 1: ตั้งค่า VITE_BACKEND_URL (แนะนำ - ง่ายและชัดเจน)
VITE_BACKEND_URL=https://imageapi.sg8net.com

# วิธีที่ 2: ตั้งค่า VITE_API_BASE_URL เป็น full URL
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
```

**❌ ผิด:**

```env
VITE_API_BASE_URL=/api/v1
```

**✅ ถูก (วิธีที่ 1 - แนะนำ):**

```env
VITE_BACKEND_URL=https://imageapi.sg8net.com
```

**✅ ถูก (วิธีที่ 2):**

```env
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
```

**✅ ถูก (ใช้ทั้งสองตัว):**

```env
VITE_BACKEND_URL=https://imageapi.sg8net.com
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
```

### ขั้นตอนที่ 2: Build โปรเจกต์ใหม่

```bash
cd C:\Users\silve\project\roiet\fui-furniture
npm run build
```

### ขั้นตอนที่ 3: ตรวจสอบ Build Output

ตรวจสอบว่า environment variable ถูก embed ใน build หรือไม่:

1. เปิดไฟล์ `dist/spa/index.html` หรือไฟล์ JS ที่ build แล้ว
2. ค้นหา `VITE_API_BASE_URL` หรือ `imageapi.sg8net.com`
3. ควรเห็น URL ที่ถูกต้อง

### ขั้นตอนที่ 4: อัปโหลดไฟล์ใหม่

อัปโหลดไฟล์ทั้งหมดจาก `dist/spa/` ไปยัง server

### ขั้นตอนที่ 5: ตรวจสอบใน Browser

1. เปิด Browser Developer Tools (F12)
2. ไปที่ Tab **Console** - ควรไม่เห็น warning เกี่ยวกับ `apiBaseURL`
3. ไปที่ Tab **Network** - ตรวจสอบว่า request ไปที่:
   - ✅ **ถูกต้อง**: `https://imageapi.sg8net.com/sanctum/csrf-cookie`
   - ❌ **ผิด**: `https://image.sg8net.com/sanctum/csrf-cookie` (ถ้าเห็นแบบนี้ แสดงว่ายังตั้งค่า environment variable ไม่ถูกต้อง)

## วิธีตรวจสอบว่า Environment Variable ถูกตั้งค่าถูกต้อง

### ใน Browser Console

เปิด Browser Console และพิมพ์:

```javascript
// ตรวจสอบว่า apiBaseURL ถูกตั้งค่าถูกต้อง
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

ควรเห็น:

```
API Base URL: https://imageapi.sg8net.com/api/v1
```

### ตรวจสอบ Network Request

1. เปิด Developer Tools → Network
2. Filter: `sanctum`
3. ดู Request URL - ควรเป็น `https://imageapi.sg8net.com/sanctum/csrf-cookie`

## ถ้ายังไม่ได้ผล

### วิธีที่ 1: ตั้งค่า VITE_BACKEND_URL (แนะนำ)

เพิ่มใน `.env.production`:

```env
VITE_BACKEND_URL=https://imageapi.sg8net.com
```

หรือถ้าต้องการระบุ CSRF cookie URL โดยตรง:

```env
VITE_CSRF_COOKIE_URL=https://imageapi.sg8net.com/sanctum/csrf-cookie
```

### วิธีที่ 2: ตรวจสอบว่าไฟล์ถูก Build ใหม่จริงๆ

1. ลบโฟลเดอร์ `dist/` ทั้งหมด
2. Build ใหม่: `npm run build`
3. ตรวจสอบ timestamp ของไฟล์ใน `dist/spa/`

### วิธีที่ 3: Clear Browser Cache

1. Hard refresh: `Ctrl + Shift + R` (Windows) หรือ `Cmd + Shift + R` (Mac)
2. หรือ Clear cache และ reload

## Checklist

- [ ] สร้างไฟล์ `.env.production` แล้ว
- [ ] ตั้งค่า `VITE_BACKEND_URL=https://imageapi.sg8net.com` หรือ `VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1` (full URL)
- [ ] Build โปรเจกต์ใหม่: `npm run build`
- [ ] อัปโหลดไฟล์ใหม่จาก `dist/spa/` ไปยัง server
- [ ] ตรวจสอบใน Browser Console ว่าไม่มี error/warning เกี่ยวกับ CSRF cookie
- [ ] ตรวจสอบใน Network tab ว่า request ไปที่ `https://imageapi.sg8net.com/sanctum/csrf-cookie` (ไม่ใช่ `image.sg8net.com`)
- [ ] Clear browser cache (ถ้าจำเป็น)

## หมายเหตุ

- Environment variables ใน Vite จะถูก embed ใน build time
- ถ้าเปลี่ยน `.env.production` ต้อง **build ใหม่** ทุกครั้ง
- ตรวจสอบว่าไฟล์ `.env.production` อยู่ในโฟลเดอร์ `fui-furniture` (root ของโปรเจกต์)
