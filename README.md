# TripLink Client — Final React

ממשק React + Vite עבור פרויקט TripLink.

## מה כלול

- הרשמה והתחברות עם JWT.
- חיפוש נסיעות לפי יישוב מוצא, יישוב יעד ותאריך.
- מיון ו-Pagination מהשרת.
- Autocomplete ליישובים בישראל.
- יצירת נסיעה ועריכת נסיעה.
- פרטי נסיעה.
- הרשמה לנסיעה וביטול הרשמה.
- מסך "ההרשמות שלי".
- מסך "הנסיעות שפרסמתי".
- צפייה בנוסעים שנרשמו לנסיעה שפרסמתי.
- הסרת נוסע על ידי בעל הנסיעה.
- מחיקת נסיעה על ידי בעל הנסיעה.
- מסכי Admin לצפייה במשתמשים ומחיקת נסיעות.
- טיפול בהודעות 401 / 403 / 404 / 409.
- RTL ועיצוב Responsive.

## רשימת היישובים — ללא fetch בזמן ריצה

ה-Autocomplete משתמש ב-`@il-address/core`.
נתוני היישובים מגיעים כחלק מהחבילה המותקנת ונארזים יחד עם ה-Frontend.
האפליקציה **לא שולחת בקשה ל-data.gov.il בזמן שהמשתמש מחפש יישוב**.

לכן אחרי `npm install` הפרויקט יכול לחפש יישובים מתוך הנתונים המקומיים של ה-Bundle.

## חיבור ל-TripLink.API

צרי קובץ `.env` ליד `package.json`:

```env
VITE_API_BASE_URL=https://localhost:XXXX
```

החליפי `XXXX` בפורט של TripLink.API.

לדוגמה, אם Swagger הוא:

```text
https://localhost:7184/swagger
```

אז:

```env
VITE_API_BASE_URL=https://localhost:7184
```

## הפעלה

```bash
npm install
npm run dev
```

Vite מוגדר לעבוד דווקא על:

```text
http://localhost:5173
```

עם `strictPort: true`, ולכן אם 5173 תפוס הוא לא יעבור בשקט ל-5174.

## Endpoints נוספים שהגרסה הזאת משתמשת בהם

```text
GET    /api/rides/mine
GET    /api/rides/{rideId}/registrations
DELETE /api/rides/{rideId}/registrations/{passengerId}
PUT    /api/rides/{rideId}
DELETE /api/rides/{rideId}
```

## הערה על CORS

ב-TripLink.API יש לאפשר את:

```text
http://localhost:5173
```
