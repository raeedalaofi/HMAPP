# 🔧 Quick Fix Guide - Invalid API Keys

## Problem
**Error:** `Invalid API key` when signing up or logging in

**Cause:** The Supabase API keys in `.env.local` are expired or regenerated

---

## ⚡ Quick Solution (2 Minutes)

### Option 1: Automated Fix Script
```bash
cd /Users/rayidalaoufy/Desktop/HMAPP/hmapp-web
./FIX_API_KEYS.sh
```
The script will:
- Backup your old `.env.local`
- Guide you to get new keys
- Test the keys
- Restart the server

---

### Option 2: Manual Fix

**Step 1:** Open Supabase Dashboard
```
https://supabase.com/dashboard/project/cnckjkicdybgvmkofwok/settings/api
```

**Step 2:** Copy these 2 keys:
- ✅ `anon` `public` key (long JWT token)
- ✅ `service_role` `secret` key (long JWT token)

**Step 3:** Update `.env.local`
```bash
cd /Users/rayidalaoufy/Desktop/HMAPP/hmapp-web
nano .env.local
```

Replace the old keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cnckjkicdybgvmkofwok.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PASTE_NEW_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<PASTE_NEW_SERVICE_ROLE_KEY>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Step 4:** Restart Server
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Step 5:** Test
- Go to: http://localhost:3000/signup
- Create an account
- Should work now! ✅

---

## 📊 What Was Wrong?

**Before (Broken):**
```
❌ SERVICE_ROLE_KEY from Nov 18, 2024
✅ ANON_KEY from Jan 20, 2025
   → Mismatched key pair = Authentication fails
```

**After (Fixed):**
```
✅ Both keys from same generation
✅ Both keys valid
✅ Authentication works
```

---

## 🔍 How to Verify It's Fixed

After updating keys, you should see:
```bash
npm run dev

# In logs:
✅ Login successful for: test@example.com
✅ Customer profile created
✅ Wallet created
```

---

## 📁 Files Created

1. **DEBUG_REPORT.md** - Full technical analysis
2. **FIX_API_KEYS.sh** - Automated fix script
3. **QUICK_FIX_GUIDE.md** - This file

---

## ⚠️ Important Notes

1. **Never commit** `.env.local` to Git
2. **Keep SERVICE_ROLE_KEY secret** - it bypasses all security
3. **Both keys must be from same generation**
4. **Email Auth must be enabled** in Supabase Dashboard

---

## 🚀 After Fix - Test These

### Test 1: Customer Signup
```
URL: http://localhost:3000/signup
Test Data:
  Name: اختبار
  Phone: 0512345678
  Email: test@example.com
  Password: test123456
Expected: Success ✅
```

### Test 2: Login
```
URL: http://localhost:3000/login
Use credentials from signup
Expected: Homepage with wallet ✅
```

### Test 3: Wallet Top-Up
```
URL: http://localhost:3000/wallet/top-up
Amount: 100 SAR
Expected: Balance increases ✅
```

---

## 📞 Still Not Working?

Check these:
1. ✅ Both keys are copied correctly (no spaces, complete)
2. ✅ Email provider is enabled in Supabase Auth settings
3. ✅ Server restarted after updating `.env.local`
4. ✅ Project is not paused in Supabase Dashboard

If still failing, check full details in `DEBUG_REPORT.md`

---

*Last Updated: 22 Nov 2025*
