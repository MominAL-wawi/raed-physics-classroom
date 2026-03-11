<div dir="rtl">

# منصة رائد لتعليم الفيزياء

<div align="center">

منصة تعليمية متكاملة لإدارة الامتحانات والأسئلة والملفات التعليمية

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-7952B3?style=flat-square&logo=bootstrap)](https://getbootstrap.com/)

</div>

---

## نظرة عامة

منصة رائد هي نظام تعليمي شامل مصمم لتسهيل عملية التعليم والتعلم في مادة الفيزياء. تتيح المنصة للمعلمين إنشاء الامتحانات وإدارة بنك الأسئلة، بينما يمكن للطلاب أداء الامتحانات ومراجعة نتائجهم بسهولة.

---

## المميزات الرئيسية

### للمعلمين
- إنشاء وإدارة بنك الأسئلة (اختيار من متعدد / صح وخطأ)
- إضافة صور توضيحية للأسئلة
- إنشاء امتحانات مخصصة مع تحديد المدة الزمنية
- تحديد نافذة زمنية لإتاحة الامتحان
- عرض نتائج الطلاب وتصديرها بصيغة Excel
- رفع ومشاركة الملفات التعليمية

### للطلاب
- أداء الامتحانات بواجهة سهلة وآمنة
- حفظ تلقائي للإجابات أثناء الامتحان
- دعم العمل بدون اتصال (Offline)
- مراجعة الإجابات بعد الانتهاء
- عرض سجل النتائج السابقة
- الوصول للملفات التعليمية

### للمسؤول
- إدارة حسابات المعلمين والطلاب
- إضافة وحذف المستخدمين
- مراقبة النظام بشكل عام

---

## التقنيات المستخدمة

| التقنية | الوصف |
|---------|-------|
| **Vue.js 3** | إطار عمل الواجهة الأمامية |
| **Vue Router** | إدارة التوجيه والصفحات |
| **Pinia** | إدارة الحالة (State Management) |
| **Firebase Realtime Database** | قاعدة البيانات السحابية |
| **Bootstrap 5** | مكتبة التصميم |
| **Bootstrap Icons** | الأيقونات |

---

## هيكل المشروع

```
src/
├── components/          # المكونات القابلة لإعادة الاستخدام
│   ├── HeaderComponent.vue
│   ├── FooterComponent.vue
│   ├── QuestionCard.vue
│   └── FileCard.vue
├── views/               # صفحات التطبيق
│   ├── LoginPage.vue
│   ├── AdminDashboard.vue
│   ├── TeacherDashboard.vue
│   ├── StudentDashboard.vue
│   ├── QuestionsPage.vue
│   ├── ExamsPage.vue
│   ├── CreateExamPage.vue
│   ├── TakeExamPage.vue
│   ├── ResultsPage.vue
│   ├── StudentResultsPage.vue
│   ├── ExamReviewPage.vue
│   └── FilesPage.vue
├── store/               # مخازن Pinia
│   ├── authStore.js
│   ├── questionsStore.js
│   ├── examsStore.js
│   ├── answersStore.js
│   └── filesStore.js
├── firebase/            # إعدادات Firebase
│   └── config.js
├── router/              # إعدادات التوجيه
│   └── index.js
├── App.vue
└── main.js
```

---

## التثبيت والإعداد

### المتطلبات الأساسية
- Node.js (الإصدار 16 أو أحدث)
- npm أو yarn

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone https://github.com/MominAL-wawi/raed-physics-learning.git
cd raed-physics-learning
```

2. **تثبيت الاعتماديات**
```bash
npm install
```

3. **تشغيل خادم التطوير**
```bash
npm run serve
```

4. **بناء الإنتاج**
```bash
npm run build
```

---

## إعداد Firebase

يستخدم المشروع Firebase Realtime Database. للإعداد:

1. قم بإنشاء مشروع Firebase جديد
2. فعّل Realtime Database
3. عدّل رابط قاعدة البيانات في ملف `src/firebase/config.js`

### هيكل قاعدة البيانات

```
/
├── Student/        # بيانات الطلاب
├── Teacher/        # بيانات المعلمين
├── admin/          # بيانات المسؤولين
├── questions/      # بنك الأسئلة
├── exams/          # الامتحانات
├── results/        # نتائج الطلاب
├── files/          # الملفات التعليمية
└── ongoingExams/   # الامتحانات الجارية
```

---

## الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `npm run serve` | تشغيل خادم التطوير مع Hot Reload |
| `npm run build` | بناء نسخة الإنتاج |
| `npm run test:unit` | تشغيل اختبارات الوحدات |
| `npm run lint` | فحص وإصلاح الكود |

---

## أدوار المستخدمين

| الدور | المسار | الصلاحيات |
|-------|--------|-----------|
| **مسؤول** | `/admin` | إدارة جميع المستخدمين |
| **معلم** | `/teacher` | إدارة الأسئلة والامتحانات والنتائج |
| **طالب** | `/student` | أداء الامتحانات ومراجعة النتائج |

---

## الأمان

- حماية الصفحات عبر التحقق من الصلاحيات
- منع تصوير الشاشة أثناء الامتحان
- حفظ تلقائي للإجابات لمنع فقدان البيانات
- دعم العمل بدون اتصال مع المزامنة التلقائية

---

## المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. أنشئ فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'إضافة ميزة رائعة'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

## التواصل

للاستفسارات والدعم الفني، يرجى فتح Issue في مستودع GitHub.

</div>
