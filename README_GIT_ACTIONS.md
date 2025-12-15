# Git Actions - دليل الاستخدام

## كيفية استخدام Git Actions

### 1. إعداد Repository Secrets

قبل استخدام Git Actions، يجب إضافة Secrets في GitHub:

1. اذهب إلى **Settings** > **Secrets and variables** > **Actions**
2. أضف الـ Secrets التالية:
   - `DOCKER_USERNAME`: اسم المستخدم في Docker Hub
   - `DOCKER_PASSWORD`: كلمة مرور Docker Hub

### 2. Workflows المتاحة

#### A. CI/CD Pipeline (`ci.yml`)
يعمل تلقائياً عند:
- Push إلى `main` أو `develop`
- Pull Request إلى `main` أو `develop`

**الخطوات:**
1. **Test**: تشغيل الاختبارات والتحقق من الكود
2. **Build**: بناء التطبيق
3. **Docker**: بناء Docker image ورفعه (فقط عند push إلى main)

#### B. Test Workflow (`test.yml`)
يمكن تشغيله يدوياً أو تلقائياً:
- Push إلى `main` أو `develop`
- Pull Request
- تشغيل يدوي من GitHub Actions

**الخطوات:**
1. **Unit Tests**: تشغيل الاختبارات
2. **Lint**: فحص الكود
3. **Type Check**: فحص TypeScript

### 3. كيفية الاستخدام

#### تشغيل تلقائي:
```bash
# عند عمل push
git push origin main
# سيتم تشغيل CI/CD تلقائياً
```

#### تشغيل يدوي:
1. اذهب إلى **Actions** في GitHub
2. اختر **Run Tests** أو **CI/CD Pipeline**
3. اضغط **Run workflow**

### 4. مراقبة النتائج

- اذهب إلى **Actions** tab في GitHub
- اختر الـ workflow المطلوب
- شاهد النتائج والـ logs

### 5. Docker Image

بعد نجاح الـ build، سيتم:
- بناء Docker image
- رفعه إلى Docker Hub
- Tags: `latest` و `commit-sha`

**استخدام Docker Image:**
```bash
docker pull YOUR_USERNAME/cancerdet:latest
docker run -p 8081:8081 YOUR_USERNAME/cancerdet:latest
```

### 6. Troubleshooting

**مشكلة: Tests فاشلة**
- راجع الـ logs في Actions
- تأكد من أن جميع الاختبارات تعمل محلياً

**مشكلة: Docker build فاشل**
- تأكد من وجود `Dockerfile`
- تحقق من الـ secrets في GitHub

**مشكلة: TypeScript errors**
- راجع الأخطاء في Actions logs
- أصلح الأخطاء محلياً قبل الـ push

### 7. إضافة Tests

لإضافة tests جديدة:
1. أنشئ ملفات test في `__tests__` أو `*.test.ts`
2. استخدم Jest أو أي testing framework
3. أضف script في `package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

### 8. إضافة Linting

لإضافة ESLint:
1. تثبيت ESLint: `npm install --save-dev eslint`
2. إضافة script في `package.json`:
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

## ملاحظات

- جميع الـ workflows تعمل على Ubuntu Latest
- Node.js version: 18
- Docker images تُرفع فقط عند push إلى `main`
- يمكن تخصيص الـ workflows حسب احتياجاتك

