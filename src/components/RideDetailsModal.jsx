import { X } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function RideDetailsModal({
  open,
  ride,
  registered,
  isOwner,
  busy,
  onClose,
  onRegister,
  onCancel
}) {
  if (!open || !ride) return null;

  const free = Math.max(0, Number(ride.capacity || 0) - Number(ride.bookedSeats || 0));

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card details-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="section-kicker">פרטי נסיעה #{ride.id}</p>
            <h2>{ride.originCity} <span className="route-arrow">←</span> {ride.destinationCity}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="details-date">{formatDate(ride.departureAtUtc)}</div>

        <div className="details-stats">
          <div><strong>{ride.capacity}</strong><span>מקומות</span></div>
          <div><strong>{ride.bookedSeats}</strong><span>תפוסים</span></div>
          <div><strong>{free}</strong><span>פנויים</span></div>
        </div>

        {!isOwner && (
          <div className="details-actions">
            {registered ? (
              <button className="secondary-button" disabled={busy} onClick={() => onCancel(ride.id)}>
                ביטול הרשמה
              </button>
            ) : (
              <button className="primary-button" disabled={busy || free === 0} onClick={() => onRegister(ride.id)}>
                {free === 0 ? "הנסיעה מלאה" : "תפיסת מקום"}
              </button>
            )}
          </div>
        )}

        {isOwner && <div className="owner-detail-note">זו נסיעה שפרסמת. אפשר לנהל אותה דרך “הנסיעות שפרסמתי”.</div>}
      </div>
    </div>
  );
}
