# راهنمای ساخت مخزن و انتشار BPMN Decision Lab در GitHub

## نام پیشنهادی مخزن

`bpmn-decision-lab`

## توضیح کوتاه مخزن

`A browser-based BPMN learning lab for process analysis, simulation, assessment, and improvement.`

## ۱. ساخت مخزن جدید

1. وارد حساب GitHub خود شوید.
2. از بالای صفحه روی `+` و سپس `New repository` کلیک کنید.
3. Owner را حساب شخصی خود انتخاب کنید.
4. Repository name را `bpmn-decision-lab` قرار دهید.
5. توضیح بالا را وارد کنید.
6. اگر قصد دارید پروژه بخشی از پورتفولیوی عمومی شما باشد، `Public` را انتخاب کنید؛ در غیر این صورت `Private` را انتخاب کنید.
7. چون پوشه محلی از قبل README، License و Gitignore دارد، در فرم ایجاد مخزن گزینه‌های Initialize with README، Add .gitignore و Choose a license را انتخاب نکنید.
8. روی `Create repository` کلیک کنید.

راهنمای رسمی GitHub: [Creating a new repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

## ۲. بارگذاری فایل‌ها از طریق مرورگر (بدون Git)

1. فایل ZIP پروژه را روی کامپیوتر از حالت فشرده خارج کنید.
2. در مخزن تازه‌ساخته‌شده، `Add file` و سپس `Upload files` را انتخاب کنید.
3. وارد پوشه `bpmn-decision-lab` شوید و **تمام محتویات داخل پوشه** را انتخاب کنید؛ خود پوشه را به‌صورت یک پوشه تودرتو بارگذاری نکنید.
4. فایل‌ها و پوشه‌ها باید در ریشه مخزن دیده شوند؛ برای نمونه `index.html` باید در سطح اول باشد.
5. در بخش Commit message بنویسید: `Initial release: BPMN Decision Lab pilot`.
6. روی `Commit changes` کلیک کنید.

نکته: GitHub در مرورگر برای بارگذاری تعداد زیاد فایل‌ها محدودیت دارد. اگر آپلود کامل نشد، از روش Git در بخش بعد استفاده کنید.

## ۳. بارگذاری با Git (پیشنهادی برای توسعه‌های بعدی)

پس از نصب Git، ترمینال را در پوشه اصلی پروژه باز کنید؛ همان پوشه‌ای که `index.html` و `README.md` در آن قرار دارند. سپس:

```bash
git init
git add .
git commit -m "Initial release: BPMN Decision Lab pilot"
git branch -M main
git remote add origin https://github.com/fmehrabi/bpmn-decision-lab.git
git push -u origin main
```

اگر نام کاربری GitHub یا نام مخزن متفاوت است، نشانی remote را اصلاح کنید. اگر remote از قبل تنظیم شده است، فرمان `git remote add origin ...` را دوباره اجرا نکنید.

## ۴. بارگذاری سریع با PowerShell در ویندوز

در ریشه پوشه استخراج‌شده، روی نوار آدرس File Explorer کلیک کنید، `powershell` را بنویسید و Enter بزنید. پس از ساخت مخزن خالی در GitHub، این فرمان را اجرا کنید:

```powershell
.\scripts\publish-to-github.ps1
```

این اسکریپت Git را بررسی می‌کند، مخزن محلی را آماده می‌کند، فایل‌ها را Commit می‌کند، شاخه `main` و remote را تنظیم می‌کند و سپس Push را انجام می‌دهد. در اولین Push ممکن است Git Credential Manager پنجره ورود GitHub را باز کند. اگر سیاست اجرای PowerShell اجازه اجرای اسکریپت نداد، فقط برای همان اجرا از فرمان زیر استفاده کنید:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-to-github.ps1
```

در صورت استفاده از نام مخزن دیگری، نشانی آن را به پارامتر اسکریپت بدهید:

```powershell
.\scripts\publish-to-github.ps1 -RepositoryUrl "https://github.com/USERNAME/REPOSITORY.git"
```

## ۵. فعال‌کردن GitHub Pages

1. وارد مخزن `bpmn-decision-lab` شوید.
2. روی `Settings` کلیک کنید.
3. از منوی کناری `Pages` را باز کنید.
4. در بخش `Build and deployment`، Source را روی `Deploy from a branch` قرار دهید.
5. Branch را `main` و Folder را `/(root)` انتخاب کنید.
6. `Save` را بزنید.
7. پس از اتمام انتشار، لینک Pages در همان صفحه نمایش داده می‌شود. قالب معمول نشانی برای این مخزن چنین است:

   `https://fmehrabi.github.io/bpmn-decision-lab/`

   این نشانی تا زمان فعال‌سازی موفق Pages، یک لینک منتشرشده و تأییدشده محسوب نمی‌شود.

راهنمای رسمی: [Configuring a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## ۶. Public یا Private؟

- **Public:** مناسب پورتفولیو و نمایش پروژه به استادان، همکاران و کارفرمایان. محتوای مخزن و سایت Pages برای عموم قابل مشاهده است.
- **Private:** مناسب زمانی که هنوز قصد انتشار عمومی ندارید یا ابتدا می‌خواهید محتوا را با مدرس بررسی کنید. امکان Pages برای مخازن خصوصی به نوع طرح و تنظیمات حساب وابسته است.

قبل از Public کردن، مطمئن شوید داده واقعی دانشجویان، نام سازمان‌های واقعی، اطلاعات محرمانه، فایل‌های مجوزدار یا اطلاعات شخصی در مخزن نیست.

## ۷. نگهداری و به‌روزرسانی

هر بار که سؤال یا پارامتر جدیدی اضافه می‌کنید:

```bash
python scripts/build-data.py
node tests/smoke-test.js
git add .
git commit -m "Improve assessment and process case"
git push
```

اگر از رابط وب GitHub استفاده می‌کنید، پس از تولید `assets/data.js`، فایل‌های تغییرکرده را دوباره بارگذاری کنید.

## ۸. پیشنهاد برای تکمیل صفحه مخزن

- About: توضیح کوتاه انگلیسی بالا
- Topics: `bpmn`, `business-process-management`, `process-simulation`, `process-improvement`, `learning-lab`, `decision-analysis`
- Website: لینک GitHub Pages بعد از انتشار موفق
- README: متن انگلیسی خلاصه در صفحه اول و پیوند به `README.fa.md`
- Releases: نسخه `v0.4.1` برای اولین پایلوت عمومی

## نکته درباره این تحویل

فایل‌های مخزن آماده شده‌اند، اما در این گفتگو به حساب GitHub شما commit یا push انجام نشده است. ایجاد مخزن و انتشار نهایی باید از داخل حساب خودتان انجام شود.

## ۹. کنترل کیفیت خودکار مخزن

در پوشه `.github/workflows/quality-check.yml` یک GitHub Actions workflow قرار دارد. پس از Push یا بازشدن Pull Request به شاخه `main`، این کنترل‌ها اجرا می‌شوند:

1. بازسازی `assets/data.js` از فایل‌های JSON اصلی؛
2. کنترل فایل‌های ضروری و ارجاع‌های محلی؛
3. اجرای تست‌های صحت اولیه شبیه‌سازی و بانک سؤال؛
4. بررسی نحو JavaScript.

وضعیت اجرا را از زبانه `Actions` مخزن ببینید. این فرایند برای کنترل کیفیت کد و داده است؛ اجرای خود وب‌سایت همچنان کاملاً سمت مرورگر و بدون API خارجی انجام می‌شود.

## ۱۰. موضوعات پیشنهادی مخزن

در بخش About مخزن این Topics را اضافه کنید:

`bpmn` · `business-process-management` · `process-simulation` · `process-improvement` · `decision-analysis` · `business-process-modeling` · `educational-technology`

در قسمت Website، نشانی GitHub Pages را فقط پس از انتشار موفق ثبت کنید.
