# حزمة التشغيل الأونلاين الحقيقي — لعبة العباقرة 3D

تحتوي هذه الحزمة على خيارين جاهزين لتشغيل غرف اللعب الجماعي عن بُعد بين الأصدقاء:

## الخيار الأول (الأسهل مع GitHub Pages — بدون خادم): Firebase Realtime Database
1. افتح [Firebase Console](https://console.firebase.google.com) وأنشئ مشروعًا مجانيًا ثم فعّل **Realtime Database**.
2. انسخ بيانات `firebaseConfig` وضعها داخل ملف `client/firebase_sync.js`.
3. ارفع مجلد `public/` مع `client/firebase_sync.js` على **GitHub Pages**؛ يدعم الملف قفل البازر الذري (`runTransaction`) لمنع تضارب الضغط المتزامن.

## الخيار الثاني (خادم Node.js + Socket.IO كامل):
1. افتح مجلد `server/` وشغّل الأوامر التالية:
   ```bash
   npm install
   npm start
   ```
2. افتح المتصفح على `http://localhost:3000` (سيعرض تلقائيًا `public/index.html`).
3. للنشر المجاني على الإنترنت: ارفع المجلد على **Render.com** أو **Railway.app** بأمر تشغيل `node server/server.js`، ثم اربط الواجهة عبر `client/online_client.js`.
