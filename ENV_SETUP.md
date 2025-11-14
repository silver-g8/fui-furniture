# Environment Setup Guide

คู่มือการตั้งค่า Environment Variables สำหรับโปรเจกต์ Roiet Frontend

## 📋 ภาพรวม

โปรเจกต์นี้ใช้ไฟล์ environment หลายไฟล์เพื่อจัดการ configuration ในสภาพแวดล้อมต่างๆ

### ไฟล์ Environment ทั้งหมด

```
fui-furniture/
├── .env                    # Base config (ไม่ควร commit sensitive data)
├── .env.local             # Local development overrides (ignored by git) ⭐
├── .env.development       # Auto-loaded ใน dev mode
├── .env.production        # Auto-loaded ใน production build
└── .env.example           # Template สำหรับทีม (commit ได้)
```

### ลำดับการโหลด (Priority)

Vite จะโหลดไฟล์ตามลำดับนี้ (ล่างสุด = priority สูงสุด):

1. `.env` - Base configuration
2. `.env.development` หรือ `.env.production` (ขึ้นอยู่กับ mode)
3. `.env.local` - **Local overrides (สำคัญที่สุด)** 🔥

## 🚀 Quick Start

### สำหรับ Developer ใหม่

```bash
cd fui-furniture

# 1. Copy template
cp .env.example .env.local

# 2. Edit .env.local
nano .env.local  # or use your favorite editor

# 3. Set your local backend URL
VITE_API_BASE_URL=http://furniture-api.test/api/v1
VITE_BACKEND_URL=http://furniture-api.test

# 4. Start dev server
npm run dev
```

### สำหรับ Team Members ที่ใช้ Backend URL ต่างกัน

**ตัวอย่าง: ใช้ Laravel Herd**
```bash
# .env.local
VITE_API_BASE_URL=http://furniture-api.test/api/v1
VITE_BACKEND_URL=http://furniture-api.test
```

**ตัวอย่าง: ใช้ php artisan serve**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_BACKEND_URL=http://localhost:8000
```

**ตัวอย่าง: ใช้ Docker**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_BACKEND_URL=http://localhost:8080
```

## 📝 รายละเอียดไฟล์แต่ละไฟล์

### `.env` - Base Configuration

ไฟล์นี้เก็บ configuration พื้นฐานที่ใช้ร่วมกันทั้งหมด

```env
# โดยปกติควรว่างหรือมีแค่ค่า default ที่ไม่ sensitive
VITE_API_BASE_URL=
```

**คำแนะนำ:**
- ไม่ควรใส่ URL production ที่นี่
- ควรว่างหรือมีค่า default ที่ปลอดภัย
- Commit ได้ แต่ระวังข้อมูล sensitive

---

### `.env.local` - Local Development (⭐ สำคัญ!)

ไฟล์นี้ **ignored by git** และใช้สำหรับ override configuration ในเครื่องของคุณเอง

```env
# .env.local
VITE_API_BASE_URL=http://furniture-api.test/api/v1
VITE_BACKEND_URL=http://furniture-api.test
```

**คำแนะนำ:**
- ✅ ใช้ไฟล์นี้สำหรับ local development
- ✅ แต่ละคนสามารถมี URL ต่างกันได้
- ✅ **ไม่ commit** เข้า git
- ✅ Override ค่าอื่นๆ ได้ทั้งหมด

---

### `.env.development` - Development Mode

Auto-loaded เมื่อรัน `npm run dev` หรือ `quasar dev`

```env
# .env.development
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_URL=
```

**คำแนะนำ:**
- ใช้ relative path (`/api/v1`) เพื่อใช้ Quasar dev server proxy
- Proxy config อยู่ใน `quasar.config.ts:131-142`
- ไฟล์นี้ commit ได้ เพราะเป็น default ของทีม

---

### `.env.production` - Production Build

Auto-loaded เมื่อรัน `npm run build` หรือ `quasar build`

```env
# .env.production
VITE_BACKEND_URL=https://imageapi.sg8net.com
VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1
```

**คำแนะนำ:**
- ใส่ URL production ที่นี่
- ใช้ HTTPS สำหรับ production
- ไฟล์นี้ commit ได้

---

### `.env.example` - Template for Team

Template สำหรับทีม เพื่อให้รู้ว่าต้องตั้งค่าอะไรบ้าง

```env
# .env.example
VITE_API_BASE_URL=
VITE_BACKEND_URL=
```

**คำแนะนำ:**
- ไม่ใส่ค่าจริง แต่ใส่ตัวอย่างใน comment
- Commit เข้า git
- Developer ใหม่ copy ไปเป็น `.env.local`

---

## 🔧 Environment Variables ทั้งหมด

### `VITE_API_BASE_URL`

Base URL สำหรับเรียก API

**ค่าที่เป็นไปได้:**
- **Local (Herd):** `http://furniture-api.test/api/v1`
- **Local (artisan serve):** `http://localhost:8000/api/v1`
- **Local (relative path):** `/api/v1` (ใช้ proxy)
- **Production:** `https://imageapi.sg8net.com/api/v1`

**ใช้ใน Code:**
```typescript
// src/boot/axios.ts
const apiBaseURL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
```

---

### `VITE_BACKEND_URL`

Base URL ของ backend (ไม่รวม `/api/v1`)

**ค่าที่เป็นไปได้:**
- **Local (Herd):** `http://furniture-api.test`
- **Local (artisan serve):** `http://localhost:8000`
- **Production:** `https://imageapi.sg8net.com`

**ใช้สำหรับ:**
- ดึงไฟล์ static (images, documents)
- Link ไปหน้า backend admin (ถ้ามี)

---

## ⚠️ Common Pitfalls

### ❌ ปัญหา: Network Error ตอน dev

**สาเหตุ:** `.env` หรือ `.env.local` ว่างเปล่า และ `quasar.config.ts` fallback เป็น production URL

```typescript
// quasar.config.ts (ก่อนแก้ไข - ❌ ผิด)
rawDefine: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
    process.env.VITE_API_BASE_URL || 'https://imageapi.sg8net.com/api/v1'  // ❌
  ),
}
```

**วิธีแก้:**
1. สร้าง `.env.local` และใส่ URL ที่ถูกต้อง
2. แก้ `quasar.config.ts` ให้ fallback เป็น `/api/v1` แทน

```typescript
// quasar.config.ts (หลังแก้ไข - ✅ ถูก)
rawDefine: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
    process.env.VITE_API_BASE_URL || '/api/v1'  // ✅
  ),
}
```

---

### ❌ ปัญหา: แก้ .env แล้วไม่เห็นผล

**สาเหตุ:** ไม่ได้ restart dev server

**วิธีแก้:**
```bash
# หยุด server (Ctrl+C)
# Start ใหม่
npm run dev
```

---

### ❌ ปัญหา: Production build ใช้ Local URL

**สาเหตุ:** `.env.local` มี priority สูงกว่า `.env.production`

**วิธีแก้:**
```bash
# Build โดยไม่ใช้ .env.local
npm run build

# หรือลบ .env.local ชั่วคราว
mv .env.local .env.local.backup
npm run build
mv .env.local.backup .env.local
```

---

## 🧪 Testing Environment Setup

### ตรวจสอบค่า Environment

```bash
# เปิด Browser Console (F12)
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL)
console.log('Mode:', import.meta.env.MODE)  // 'development' or 'production'
```

### ทดสอบ API Connection

```bash
# เปิด Network tab ใน DevTools
# ลอง login หรือดึงข้อมูล
# ตรวจสอบว่า Request URL ถูกต้อง

# ตัวอย่าง Request URL ที่ถูกต้อง (Local):
GET http://furniture-api.test/api/v1/products

# ตัวอย่าง Request URL ที่ผิด (Production):
GET https://imageapi.sg8net.com/api/v1/products  # ❌ ไม่ควรเกิดใน dev mode
```

---

## 🔐 Security Best Practices

### DO ✅

- ใช้ `.env.local` สำหรับ local development
- Commit `.env.example` เข้า git
- Commit `.env.development` และ `.env.production`
- Add `.env.local*` เข้า `.gitignore`
- Document ทุก environment variable ใน `.env.example`

### DON'T ❌

- ❌ Commit `.env.local` เข้า git
- ❌ ใส่ API keys หรือ secrets ใน `.env` (ใช้ `.env.local`)
- ❌ Hardcode production URL ใน code
- ❌ Share `.env.local` กับทีม (แต่ละคนควรมีของตัวเอง)

---

## 📚 อ้างอิง

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Quasar Environment Variables](https://quasar.dev/quasar-cli-vite/handling-vite-env-vars)
- [Backend CLAUDE.md](../../Herd/furniture-api/CLAUDE.md)
- [Root CLAUDE.md](../CLAUDE.md)

---

## 🆘 Troubleshooting

หากยังมีปัญหา:

1. ตรวจสอบว่า backend รันอยู่: `curl http://furniture-api.test/api/v1`
2. ตรวจสอบ CORS settings ใน backend
3. ตรวจสอบ Proxy config ใน `quasar.config.ts`
4. Clear browser cache และ reload
5. Restart dev server

**ยังไม่แก้ไข?** ตรวจสอบ:
- [CSRF_TOKEN_MISMATCH_FIX.md](../CSRF_TOKEN_MISMATCH_FIX.md)
- [CSRF_COOKIE_TROUBLESHOOTING.md](../CSRF_COOKIE_TROUBLESHOOTING.md)
- [DEPLOYMENT_HOSTINGER.md](../DEPLOYMENT_HOSTINGER.md)
