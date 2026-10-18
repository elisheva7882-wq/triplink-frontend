import { useState } from "react";
import { ArrowLeft, CarFront } from "lucide-react";
import { api } from "../api/client";
import { buildSession } from "../auth/session";

export default function AuthScreen({ onAuthenticated, notify }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        await api.register(form);
        notify("החשבון נוצר בהצלחה. עכשיו אפשר להתחבר.", "success");
        setMode("login");
        return;
      }

      const response = await api.login(form);
      if (!response?.token) throw new Error("השרת לא החזיר Token.");

      const user = buildSession(response, form.email);
      localStorage.setItem("triplink_token", response.token);
      localStorage.setItem("triplink_user", JSON.stringify(user));
      onAuthenticated(user);
      notify("התחברת בהצלחה", "success");
    } catch (error) {
      notify(
        error.status === 401 ? "האימייל או הסיסמה אינם נכונים." : error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="brand-badge"><CarFront size={21} />TripLink</div>

        <div className="auth-brand-copy">
          <span className="brand-small-line">נוסעים חכם יותר</span>
          <h1>הדרך הופכת<br /><em>לקצת יותר קלה.</em></h1>
          <p>
            מוצאים נסיעה, משתפים מסלול ומנהלים את כל ההרשמות במקום אחד —
            פשוט, מהיר ונעים.
          </p>
        </div>

        <div className="floating-route-card">
          <div><small>מוצא</small><strong>ירושלים</strong></div>
          <span className="floating-route-line"><i /><b>←</b><i /></span>
          <div><small>יעד</small><strong>תל אביב - יפו</strong></div>
        </div>
      </section>

      <section className="auth-panel-wrap">
        <div className="auth-panel">
          <p className="section-kicker">{mode === "login" ? "טוב לראות אותך שוב" : "מתחילים לנסוע"}</p>
          <h2>{mode === "login" ? "התחברות ל-TripLink" : "יצירת חשבון"}</h2>

          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>התחברות</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>הרשמה</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label className="field">
              <span>אימייל</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>

            <label className="field">
              <span>סיסמה</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>

            <button className="primary-button auth-submit" disabled={loading}>
              {loading ? "רק רגע..." : mode === "login" ? "כניסה" : "יצירת חשבון"}
              {!loading && <ArrowLeft size={17} />}
            </button>
          </form>

          <p className="auth-note">הסיסמה נשלחת ל-API ואינה נשמרת בדפדפן.</p>
        </div>
      </section>
    </main>
  );
}
