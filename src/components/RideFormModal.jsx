import { useEffect, useState } from "react";
import { X } from "lucide-react";
import CityAutocomplete from "./CityAutocomplete";

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function RideFormModal({
  open,
  mode = "create",
  initialRide = null,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState({
    originCity: "",
    destinationCity: "",
    departureAtUtc: "",
    capacity: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialRide) {
      setForm({
        originCity: initialRide.originCity || "",
        destinationCity: initialRide.destinationCity || "",
        departureAtUtc: toLocalInput(initialRide.departureAtUtc),
        capacity: initialRide.capacity || 1
      });
    } else {
      setForm({
        originCity: "",
        destinationCity: "",
        departureAtUtc: "",
        capacity: 1
      });
    }
    setMessage("");
  }, [open, mode, initialRide]);

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();

    if (!form.originCity || !form.destinationCity) {
      setMessage("יש לבחור עיר מוצא ועיר יעד מתוך הרשימה.");
      return;
    }

    if (form.originCity === form.destinationCity) {
      setMessage("עיר המוצא ועיר היעד צריכות להיות שונות.");
      return;
    }

    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      setMessage("מספר המקומות חייב להיות לפחות 1.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      await onSubmit({
        originCity: form.originCity,
        destinationCity: form.destinationCity,
        departureAtUtc: new Date(form.departureAtUtc).toISOString(),
        capacity
      });
      onClose();
    } catch {
      // הודעת השגיאה מוצגת ב-Toaster המרכזי.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card ride-form-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="section-kicker">{mode === "edit" ? "ניהול נסיעה" : "נסיעה חדשה"}</p>
            <h2>{mode === "edit" ? "עריכת הנסיעה" : "לאן נוסעים?"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <form className="ride-form" onSubmit={submit}>
          <div className="two-columns">
            <CityAutocomplete
              label="עיר מוצא"
              required
              value={form.originCity}
              onChange={(originCity) => setForm((current) => ({ ...current, originCity }))}
              placeholder="התחילי להקליד יישוב"
            />
            <CityAutocomplete
              label="עיר יעד"
              required
              value={form.destinationCity}
              onChange={(destinationCity) => setForm((current) => ({ ...current, destinationCity }))}
              placeholder="התחילי להקליד יישוב"
            />
          </div>

          <div className="two-columns">
            <label className="field">
              <span>תאריך ושעה</span>
              <input
                type="datetime-local"
                required
                value={form.departureAtUtc}
                onChange={(event) => setForm({ ...form, departureAtUtc: event.target.value })}
              />
            </label>

            <label className="field">
              <span>מספר מקומות</span>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              />
            </label>
          </div>

          {message && <div className="inline-error">{message}</div>}

          {mode === "edit" && initialRide?.bookedSeats > 0 && (
            <div className="form-note">
              כרגע רשומים {initialRide.bookedSeats} נוסעים. אי אפשר להקטין את הקיבולת מתחת למספר הזה.
            </div>
          )}

          <button className="primary-button wide-button" disabled={loading}>
            {loading ? "שומר..." : mode === "edit" ? "שמירת שינויים" : "פרסום הנסיעה"}
          </button>
        </form>
      </div>
    </div>
  );
}
