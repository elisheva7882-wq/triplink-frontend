import { useEffect, useMemo, useState } from "react";
import { CarFront, LogOut, Plus, Search } from "lucide-react";
import { api } from "./api/client";
import { readSession } from "./auth/session";
import AuthScreen from "./components/AuthScreen";
import RideCard from "./components/RideCard";
import RideFormModal from "./components/RideFormModal";
import RideDetailsModal from "./components/RideDetailsModal";
import PassengersModal from "./components/PassengersModal";
import AdminPanel from "./components/AdminPanel";
import CityAutocomplete from "./components/CityAutocomplete";
import Toast from "./components/Toast";

const defaultFilters = {
  originCity: "",
  destinationCity: "",
  departureDate: "",
  sortBy: "departure",
  sortDescending: "false",
  page: 1,
  pageSize: 6
};

export default function App() {
  const [user, setUser] = useState(readSession);
  const [tab, setTab] = useState("rides");
  const [filters, setFilters] = useState(defaultFilters);
  const [ridesResult, setRidesResult] = useState({
    items: [],
    page: 1,
    pageSize: 6,
    totalCount: 0
  });
  const [myRegistrationIds, setMyRegistrationIds] = useState(new Set());
  const [myRegisteredRides, setMyRegisteredRides] = useState([]);
  const [publishedRides, setPublishedRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [busyRideId, setBusyRideId] = useState(null);
  const [toast, setToast] = useState(null);

  const [formModal, setFormModal] = useState({ open: false, mode: "create", ride: null });
  const [detailsRide, setDetailsRide] = useState(null);
  const [passengersRide, setPassengersRide] = useState(null);

  const isAdmin = user?.role === "Admin";
  const pages = useMemo(
    () => Math.max(1, Math.ceil((ridesResult.totalCount || 0) / (ridesResult.pageSize || 6))),
    [ridesResult]
  );

  useEffect(() => {
    if (!user) return;
    loadRides(defaultFilters);
    loadMyRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function notify(message, type = "info") {
    setToast({ message, type });
    window.clearTimeout(window.__triplinkToastTimer);
    window.__triplinkToastTimer = window.setTimeout(() => setToast(null), 4200);
  }

  function logout() {
    localStorage.removeItem("triplink_token");
    localStorage.removeItem("triplink_user");
    setUser(null);
    setTab("rides");
    setDetailsRide(null);
    setPassengersRide(null);
    setMyRegistrationIds(new Set());
    setMyRegisteredRides([]);
    setPublishedRides([]);
  }

  function handleApiError(error) {
    if (error.status === 401) {
      logout();
      notify("החיבור פג. התחברי מחדש.", "error");
      return;
    }
    if (error.status === 403) {
      notify("אין לך הרשאה לבצע את הפעולה הזו.", "error");
      return;
    }
    if (error.status === 404) {
      notify(error.message || "הפריט שחיפשת לא נמצא.", "error");
      return;
    }
    if (error.status === 409) {
      notify(error.message || "הפעולה לא יכולה להתבצע במצב הנוכחי.", "error");
      return;
    }
    notify(error.message || "אירעה שגיאה.", "error");
  }

  async function loadRides(nextFilters = filters) {
    setLoadingRides(true);
    try {
      const data = await api.searchRides(nextFilters);
      setRidesResult({
        items: data?.items || [],
        page: data?.page || nextFilters.page || 1,
        pageSize: data?.pageSize || nextFilters.pageSize || 6,
        totalCount: data?.totalCount || 0
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingRides(false);
    }
  }

  async function loadMyRegistrations() {
    try {
      const registrations = await api.myRegistrations();
      const list = Array.isArray(registrations) ? registrations : [];
      setMyRegistrationIds(new Set(list.map((item) => item.rideId)));

      const rides = await Promise.all(
        list.map(async (item) => {
          try {
            return await api.getRide(item.rideId);
          } catch {
            return null;
          }
        })
      );
      setMyRegisteredRides(rides.filter(Boolean));
    } catch (error) {
      if (error.status !== 401) handleApiError(error);
    }
  }

  async function loadPublishedRides() {
    setLoadingPublished(true);
    try {
      const data = await api.myPublishedRides();
      setPublishedRides(Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingPublished(false);
    }
  }

  async function refreshRideEverywhere(rideId) {
    await Promise.all([loadRides(), loadMyRegistrations(), loadPublishedRides()]);
    if (detailsRide?.id === rideId) {
      try {
        setDetailsRide(await api.getRide(rideId));
      } catch {
        setDetailsRide(null);
      }
    }
  }

  function isRideOwner(ride) {
    return user?.userId != null && Number(ride?.ownerId) === Number(user.userId);
  }

  async function registerForRide(rideId) {
    setBusyRideId(rideId);
    try {
      await api.registerForRide(rideId);
      notify("המקום שלך נשמר. נתראה בדרך!", "success");
      await refreshRideEverywhere(rideId);
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusyRideId(null);
    }
  }

  async function cancelRegistration(rideId) {
    setBusyRideId(rideId);
    try {
      await api.cancelRegistration(rideId);
      notify("ההרשמה בוטלה והמקום התפנה.", "success");
      await refreshRideEverywhere(rideId);
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusyRideId(null);
    }
  }

  async function createRide(body) {
    try {
      await api.createRide(body);
      notify("הנסיעה פורסמה בהצלחה.", "success");
      setFilters(defaultFilters);
      await Promise.all([loadRides(defaultFilters), loadPublishedRides()]);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async function updateRide(body) {
    const ride = formModal.ride;
    if (!ride) return;

    try {
      await api.updateRide(ride.id, body);
      notify("השינויים נשמרו.", "success");
      await refreshRideEverywhere(ride.id);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async function deleteMyRide(ride) {
    const approved = window.confirm(`למחוק את הנסיעה ${ride.originCity} → ${ride.destinationCity}?`);
    if (!approved) return;

    setBusyRideId(ride.id);
    try {
      await api.deleteRide(ride.id);
      notify("הנסיעה נמחקה.", "success");
      setPublishedRides((current) => current.filter((item) => item.id !== ride.id));
      await loadRides();
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusyRideId(null);
    }
  }

  async function adminDeleteRide(rideId) {
    const approved = window.confirm("למחוק את הנסיעה כמנהל? הפעולה אינה ניתנת לביטול.");
    if (!approved) return;

    setBusyRideId(rideId);
    try {
      await api.adminDeleteRide(rideId);
      notify("הנסיעה נמחקה על ידי Admin.", "success");
      await loadRides();
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusyRideId(null);
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    const next = { ...filters, page: 1 };
    setFilters(next);
    loadRides(next);
  }

  function changePage(nextPage) {
    const next = { ...filters, page: nextPage };
    setFilters(next);
    loadRides(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuthenticated={setUser} notify={notify} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="logo" type="button" onClick={() => setTab("rides")}>
          <span className="logo-mark"><CarFront size={20} /></span>
          <span>TripLink</span>
        </button>

        <nav className="main-nav">
          <button className={tab === "rides" ? "active" : ""} onClick={() => setTab("rides")}>נסיעות</button>
          <button
            className={tab === "mine" ? "active" : ""}
            onClick={() => {
              setTab("mine");
              loadMyRegistrations();
            }}
          >
            ההרשמות שלי
          </button>
          <button
            className={tab === "published" ? "active" : ""}
            onClick={() => {
              setTab("published");
              loadPublishedRides();
            }}
          >
            הנסיעות שפרסמתי
          </button>
          {isAdmin && (
            <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>ניהול</button>
          )}
        </nav>

        <div className="profile-area">
          <div className="profile-copy">
            <strong>{user.email}</strong>
            <span>{user.role}</span>
          </div>
          <button className="icon-button logout-button" onClick={logout} title="התנתקות" aria-label="התנתקות">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="page-content">
        {tab === "rides" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="hero-label">נסיעה טובה מתחילה בחיבור טוב</span>
                <h1>מוצאים מקום.<br /><em>יוצאים לדרך.</em></h1>
                <p>
                  חפשי נסיעה לפי מסלול ותאריך, או פרסמי נסיעה משלך.
                  TripLink מרכזת את המקומות, ההרשמות והנוסעים במקום אחד.
                </p>
                <button className="hero-button" onClick={() => setFormModal({ open: true, mode: "create", ride: null })}>
                  <Plus size={18} /> פרסום נסיעה
                </button>
              </div>

              <div className="hero-board">
                <div className="hero-board-route">
                  <span><small>מוצא</small><strong>ירושלים</strong></span>
                  <b>←</b>
                  <span><small>יעד</small><strong>תל אביב - יפו</strong></span>
                </div>
                <div className="hero-board-stats">
                  <div><strong>{ridesResult.totalCount}</strong><span>נסיעות בתוצאות</span></div>
                  <div><strong>{myRegistrationIds.size}</strong><span>הרשמות פעילות</span></div>
                </div>
              </div>
            </section>

            <section className="search-card">
              <div className="search-title">
                <div>
                  <p className="section-kicker">חיפוש נסיעה</p>
                  <h2>לאן תרצי להגיע?</h2>
                </div>
                <Search size={22} />
              </div>

              <form className="search-form" onSubmit={submitSearch}>
                <CityAutocomplete
                  label="מוצא"
                  value={filters.originCity}
                  onChange={(originCity) => setFilters((current) => ({ ...current, originCity }))}
                  placeholder="הקלידי יישוב מוצא"
                />
                <CityAutocomplete
                  label="יעד"
                  value={filters.destinationCity}
                  onChange={(destinationCity) => setFilters((current) => ({ ...current, destinationCity }))}
                  placeholder="הקלידי יישוב יעד"
                />
                <label className="field">
                  <span>תאריך</span>
                  <input
                    type="date"
                    value={filters.departureDate}
                    onChange={(event) => setFilters({ ...filters, departureDate: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>מיון</span>
                  <select value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })}>
                    <option value="departure">זמן יציאה</option>
                    <option value="origin">עיר מוצא</option>
                    <option value="destination">עיר יעד</option>
                    <option value="capacity">מספר מקומות</option>
                  </select>
                </label>
                <label className="field">
                  <span>סדר</span>
                  <select value={filters.sortDescending} onChange={(event) => setFilters({ ...filters, sortDescending: event.target.value })}>
                    <option value="false">עולה</option>
                    <option value="true">יורד</option>
                  </select>
                </label>
                <button className="primary-button search-submit"><Search size={17} /> חיפוש</button>
              </form>
            </section>

            <section className="rides-section">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">נסיעות זמינות</p>
                  <h2>בחרי את הדרך שמתאימה לך</h2>
                </div>
                <button className="small-link-button" onClick={() => loadRides()} disabled={loadingRides}>רענון</button>
              </div>

              {loadingRides ? (
                <div className="empty-state">טוען נסיעות...</div>
              ) : ridesResult.items.length === 0 ? (
                <div className="empty-state">
                  <strong>לא מצאנו נסיעות שמתאימות לחיפוש</strong>
                  <span>אפשר לשנות את הסינון או לפרסם נסיעה חדשה.</span>
                </div>
              ) : (
                <div className="rides-grid">
                  {ridesResult.items.map((ride) => (
                    <RideCard
                      key={ride.id}
                      ride={ride}
                      registered={myRegistrationIds.has(ride.id)}
                      isOwner={isRideOwner(ride)}
                      busy={busyRideId === ride.id}
                      onRegister={registerForRide}
                      onCancel={cancelRegistration}
                      onDetails={setDetailsRide}
                      admin={isAdmin}
                      onAdminDelete={adminDeleteRide}
                    />
                  ))}
                </div>
              )}

              {pages > 1 && (
                <div className="pagination">
                  <button disabled={ridesResult.page <= 1} onClick={() => changePage(ridesResult.page - 1)}>הקודם</button>
                  <span>עמוד {ridesResult.page} מתוך {pages}</span>
                  <button disabled={ridesResult.page >= pages} onClick={() => changePage(ridesResult.page + 1)}>הבא</button>
                </div>
              )}
            </section>
          </>
        )}

        {tab === "mine" && (
          <section className="rides-section standalone-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">הדרך שלי</p>
                <h2>ההרשמות שלי</h2>
              </div>
              <span className="count-pill">{myRegisteredRides.length}</span>
            </div>

            {myRegisteredRides.length === 0 ? (
              <div className="empty-state">
                <strong>עוד לא נרשמת לנסיעה</strong>
                <span>חזרי למסך הנסיעות ותפסי מקום.</span>
              </div>
            ) : (
              <div className="rides-grid">
                {myRegisteredRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    registered
                    busy={busyRideId === ride.id}
                    onCancel={cancelRegistration}
                    onDetails={setDetailsRide}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "published" && (
          <section className="rides-section standalone-section">
            <div className="section-heading published-heading">
              <div>
                <p className="section-kicker">ניהול נסיעות</p>
                <h2>הנסיעות שפרסמתי</h2>
                <p className="section-description">כאן אפשר לערוך נסיעה, לראות מי נרשם ולהסיר נוסע במקרה הצורך.</p>
              </div>
              <button className="primary-button" onClick={() => setFormModal({ open: true, mode: "create", ride: null })}>
                <Plus size={17} /> נסיעה חדשה
              </button>
            </div>

            {loadingPublished ? (
              <div className="empty-state">טוען את הנסיעות שפרסמת...</div>
            ) : publishedRides.length === 0 ? (
              <div className="empty-state">
                <strong>עוד לא פרסמת נסיעה</strong>
                <span>פרסמי את הנסיעה הראשונה והיא תופיע כאן.</span>
              </div>
            ) : (
              <div className="rides-grid">
                {publishedRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    ownerView
                    busy={busyRideId === ride.id}
                    onDetails={setDetailsRide}
                    onEdit={(selected) => setFormModal({ open: true, mode: "edit", ride: selected })}
                    onDelete={deleteMyRide}
                    onPassengers={setPassengersRide}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "admin" && isAdmin && <AdminPanel notify={notify} />}
      </main>

      <RideFormModal
        open={formModal.open}
        mode={formModal.mode}
        initialRide={formModal.ride}
        onClose={() => setFormModal({ open: false, mode: "create", ride: null })}
        onSubmit={formModal.mode === "edit" ? updateRide : createRide}
      />

      <RideDetailsModal
        open={Boolean(detailsRide)}
        ride={detailsRide}
        registered={detailsRide ? myRegistrationIds.has(detailsRide.id) : false}
        isOwner={detailsRide ? isRideOwner(detailsRide) : false}
        busy={detailsRide ? busyRideId === detailsRide.id : false}
        onClose={() => setDetailsRide(null)}
        onRegister={registerForRide}
        onCancel={cancelRegistration}
      />

      <PassengersModal
        open={Boolean(passengersRide)}
        ride={passengersRide}
        onClose={() => setPassengersRide(null)}
        notify={notify}
        onChanged={async () => {
          await Promise.all([loadPublishedRides(), loadRides()]);
          if (passengersRide) {
            try {
              const fresh = await api.getRide(passengersRide.id);
              setPassengersRide(fresh);
            } catch {
              setPassengersRide(null);
            }
          }
        }}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
