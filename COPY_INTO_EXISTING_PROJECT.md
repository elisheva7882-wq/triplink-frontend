# עדכון הפרויקט הקיים בלי למחוק `.env` או `node_modules`

אם `triplink-client` הישן כבר עובד אצלך, זו הדרך הבטוחה לעדכן אותו.

נניח שהגרסה הסופית חולצה אל:

```text
C:\elisheva\projects\net\triplink-client-final\triplink-client
```

והפרויקט העובד נמצא ב:

```text
C:\elisheva\projects\net\triplink-client
```

עצרי קודם את Vite עם `Ctrl+C`.

אחר כך אפשר להעתיק את `src` ואת `vite.config.js`:

```bat
cd /d C:\elisheva\projects\net
xcopy /E /I /Y "triplink-client-final\triplink-client\src" "triplink-client\src"
copy /Y "triplink-client-final\triplink-client\vite.config.js" "triplink-client\vite.config.js"
```

לרשימת היישובים יש תלות חדשה אחת. בתוך הפרויקט הישן הריצי פעם אחת:

```bat
cd /d C:\elisheva\projects\net\triplink-client
npm install @il-address/core@1.0.2
```

הפקודה לא מוחקת את `.env` ולא מחליפה את שאר קבצי הפרויקט.

אחר כך:

```bat
npm run dev
```

אין צורך להעתיק את `.env` מחדש אם ממשיכים לעבוד מתוך הפרויקט הישן.
