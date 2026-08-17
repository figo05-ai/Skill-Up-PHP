# Skill-Up HRMS 🏢

![Skill-Up HRMS](https://img.shields.io/badge/Version-1.0.0-blue)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=flat&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

نظام إدارة موارد بشرية متكامل (HR Management System) مبني بأحدث التقنيات لخدمة مؤسسة **Skill-Up**. يهدف النظام إلى تسهيل إدارة الموظفين، الحضور والانصراف، العملاء، والمهام اليومية بطريقة سلسة واحترافية.

---

## 🌟 المميزات الأساسية (Core Features)

1. **إدارة الموظفين (Employees Management):**
   - إضافة، تعديل، وحذف بيانات الموظفين (مع دعم بيانات مفصلة كالمسمى الوظيفي، ساعات العمل، وتاريخ التعيين).
   - عرض ملف شخصي متكامل لكل موظف.
2. **الحضور والانصراف (Attendance Tracking):**
   - تسجيل ساعات حضور وانصراف الموظفين.
   - تقارير مخصصة لحالة الحضور وساعات العمل وتتبع الأداء.
3. **إدارة المهام (Task Management):**
   - إسناد المهام للموظفين وتتبع نسبة الإنجاز (Progress).
   - لوحة مهام (Task Board) تفاعلية لمتابعة حالات المهام (قيد الانتظار، جارية، مكتملة).
4. **إدارة العملاء (Clients Management):**
   - قاعدة بيانات مخصصة لعملاء الشركة، وأرقام السجلات التجارية، وملفات التواصل.
5. **التقارير والإحصائيات (Reporting & Analytics):**
   - لوحة تحكم ذكية (Dashboard) تعرض نظرة عامة على أداء الشركة.
   - تصدير تقارير المهام والحضور بشكل احترافي.
6. **سجل النظام (System Logs):**
   - تتبع كامل لكافة الإجراءات التي تتم على النظام لضمان الحماية والشفافية.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### Backend (الخادم)
- **Framework:** Laravel (PHP)
- **Database:** MySQL
- **Authentication:** Laravel Sanctum (Token-based Auth)

### Frontend (الواجهة الأمامية)
- **Library:** React.js (18+)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State/API:** Axios & Context API
- **Build Tool:** Vite

---

## 🚀 كيفية تشغيل المشروع محلياً (Local Setup)

### 1. المتطلبات الأساسية
- تثبيت PHP (8.1 أو أحدث)
- تثبيت Composer
- تثبيت Node.js & npm
- تثبيت MySQL Database

### 2. خطوات التثبيت
```bash
# 1. نسخ المستودع
git clone https://github.com/figo05-ai/Skill-Up-PHP.git
cd Skill-Up-PHP

# 2. تثبيت حزم الخادم
composer install

# 3. تثبيت حزم الواجهة الأمامية
npm install

# 4. إعداد ملف البيئة
cp .env.example .env
# قم بتعديل بيانات قاعدة البيانات في ملف .env

# 5. تجهيز النظام
php artisan key:generate
php artisan migrate
php artisan storage:link

# 6. تشغيل الخادم
php artisan serve

# 7. تشغيل الواجهة الأمامية في نافذة Terminal أخرى
npm run dev
```

---

## 🌍 رفع المشروع على الاستضافة (Deployment)

1. اسحب المشروع على الاستضافة الخاصة بك (مثل Hostinger).
2. قم بتحديث ملف الـ `.env` بإعدادات الإنتاج:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com
   ```
3. قم بتشغيل الأوامر التالية من خلال الـ SSH:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm run build
   php artisan storage:link
   php artisan optimize
   ```
4. تأكد من ضبط مسار الدومين (Document Root) إلى المجلد `public`.

---

## 🔐 حسابات الإدارة الافتراضية
يرجى الرجوع لمسؤول النظام للحصول على بيانات الاعتماد الخاصة بمدير النظام (Admin Credentials).

---
*تم التطوير بكل ❤️ لصالح مؤسسة Skill-Up.*
