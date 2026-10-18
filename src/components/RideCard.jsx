import { Pencil, Trash2, UsersRound } from "lucide-react";

function formatDate(value) {
  if (!value) return "לא צוין";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function RideCard({
  ride,
  registered = false,
  busy = false,
  isOwner = false,
  ownerView = false,
  admin = false,
  onRegister,
  onCancel,
  onDetails,
  onEdit,
  onDelete,
  onPassengers,
  onAdminDelete
}) {
  const capacity = Number(ride.capacity || 0);
  const booked = Number(ride.bookedSeats || 0);
  const free = Math.max(0, capacity - booked);
  const full = free === 0;
  const percent = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;

  return (
    <article className="ride-card">
      <div className="ride-topline">
        <span className="ride-number">נסיעה #{ride.id}</span>
        <span className={`availability ${full ? "full" : ""}`}>
          {full ? "מלאה" : `${free} פנויים`}
        </span>
      </div>

      <button className="route-button" type="button" onClick={() => onDetails?.(ride)}>
        <span className="route-city-block">
          <small>מוצא</small>
          <strong>{ride.originCity}</strong>
        </span>
        <span className="route-divider"><i /><b>←</b><i /></span>
        <span className="route-city-block">
          <small>יעד</small>
          <strong>{ride.destinationCity}</strong>
        </span>
      </button>

      <div className="ride-date">{formatDate(ride.departureAtUtc)}</div>

      <div className="seats-row">
        <span>{booked} מתוך {capacity} מקומות תפוסים</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track"><div className="progress-value" style={{ width: `${percent}%` }} /></div>

      {ownerView ? (
        <div className="owner-actions">
          <button className="soft-action" type="button" onClick={() => onPassengers?.(ride)}>
            <UsersRound size={16} /> נוסעים
          </button>
          <button className="soft-action" type="button" onClick={() => onEdit?.(ride)}>
            <Pencil size={16} /> עריכה
          </button>
          <button className="soft-action danger-soft" type="button" onClick={() => onDelete?.(ride)} disabled={busy}>
            <Trash2 size={16} /> מחיקה
          </button>
        </div>
      ) : (
        <div className="ride-actions">
          <button className="secondary-button" type="button" onClick={() => onDetails?.(ride)}>
            פרטים
          </button>

          {!isOwner && (registered ? (
            <button className="secondary-button strong-secondary" disabled={busy} onClick={() => onCancel?.(ride.id)}>
              ביטול הרשמה
            </button>
          ) : (
            <button className="primary-button" disabled={busy || full} onClick={() => onRegister?.(ride.id)}>
              {busy ? "מבצע..." : full ? "אין מקום" : "תפיסת מקום"}
            </button>
          ))}

          {isOwner && <span className="mine-chip">הנסיעה שלך</span>}

          {admin && !ownerView && (
            <button className="admin-mini-delete" type="button" disabled={busy} onClick={() => onAdminDelete?.(ride.id)}>
              מחיקת Admin
            </button>
          )}
        </div>
      )}
    </article>
  );
}
