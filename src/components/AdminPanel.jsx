import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminPanel({ notify }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.adminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function openUser(id) {
    try {
      setSelected(await api.adminUser(id));
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <section className="admin-section standalone-section">
      <div className="section-heading">
        <div>
          <p className="section-kicker">ניהול המערכת</p>
          <h2>משתמשי TripLink</h2>
        </div>
        <span className="role-pill">Admin</span>
      </div>

      <div className="admin-grid">
        <div className="users-panel">
          <div className="panel-title">
            <span>כל המשתמשים</span>
            <b>{users.length}</b>
          </div>

          {loading ? (
            <div className="empty-state compact">טוען משתמשים...</div>
          ) : users.length === 0 ? (
            <div className="empty-state compact">אין משתמשים להצגה.</div>
          ) : (
            <div className="user-list">
              {users.map((user) => (
                <button
                  className={`user-row ${selected?.id === user.id ? "selected" : ""}`}
                  key={user.id}
                  onClick={() => openUser(user.id)}
                >
                  <span className="initial-avatar">{user.email?.[0]?.toUpperCase() || "U"}</span>
                  <span className="user-row-copy">
                    <strong>{user.email}</strong>
                    <small>#{user.id} · {user.role}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="user-details-panel">
          {selected ? (
            <>
              <span className="initial-avatar large">{selected.email?.[0]?.toUpperCase() || "U"}</span>
              <p className="section-kicker">פרטי משתמש</p>
              <h3>{selected.email}</h3>
              <dl className="details-list">
                <div><dt>מזהה</dt><dd>{selected.id}</dd></div>
                <div><dt>תפקיד</dt><dd>{selected.role}</dd></div>
                <div>
                  <dt>נוצר בתאריך</dt>
                  <dd>{selected.createdAtUtc ? new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.createdAtUtc)) : "—"}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="empty-state">
              <strong>בחרי משתמש</strong>
              <span>הפרטים שלו יופיעו כאן.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
