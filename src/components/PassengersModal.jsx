import { useEffect, useState } from "react";
import { UserRound, X } from "lucide-react";
import { api } from "../api/client";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function PassengersModal({ open, ride, onClose, notify, onChanged }) {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (open && ride?.id) loadPassengers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ride?.id]);

  async function loadPassengers() {
    setLoading(true);
    try {
      const data = await api.ridePassengers(ride.id);
      setPassengers(Array.isArray(data) ? data : []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function removePassenger(passenger) {
    const approved = window.confirm(`להסיר את ${passenger.email} מהנסיעה?`);
    if (!approved) return;

    setBusyId(passenger.passengerId);
    try {
      await api.removePassenger(ride.id, passenger.passengerId);
      notify("הנוסע הוסר והכיסא התפנה.", "success");
      await loadPassengers();
      await onChanged?.();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!open || !ride) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card passengers-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="section-kicker">{ride.originCity} ← {ride.destinationCity}</p>
            <h2>הנוסעים שנרשמו</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="passenger-summary">
          <strong>{ride.bookedSeats}/{ride.capacity}</strong>
          <span>מקומות תפוסים</span>
        </div>

        {loading ? (
          <div className="empty-state compact">טוען נוסעים...</div>
        ) : passengers.length === 0 ? (
          <div className="empty-state compact">
            <strong>עדיין אין נוסעים</strong>
            <span>כשתהיה הרשמה היא תופיע כאן.</span>
          </div>
        ) : (
          <div className="passengers-list">
            {passengers.map((passenger) => (
              <div className="passenger-row" key={passenger.passengerId}>
                <div className="passenger-avatar"><UserRound size={18} /></div>
                <div className="passenger-copy">
                  <strong>{passenger.email}</strong>
                  <span>נרשם/ה: {formatDate(passenger.registeredAtUtc)}</span>
                </div>
                <button
                  className="text-danger-button"
                  disabled={busyId === passenger.passengerId}
                  onClick={() => removePassenger(passenger)}
                >
                  {busyId === passenger.passengerId ? "מסיר..." : "הסרת נוסע"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
