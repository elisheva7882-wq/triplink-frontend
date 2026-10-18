const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function token() {
  return localStorage.getItem("triplink_token");
}

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("לא הוגדרה כתובת API. צרי .env והגדירי VITE_API_BASE_URL.");
  }

  const headers = new Headers(options.headers || {});
  if (token()) headers.set("Authorization", `Bearer ${token()}`);
  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const type = response.headers.get("content-type") || "";
  let data = null;

  if (response.status !== 204) {
    data = type.includes("application/json")
      ? await response.json()
      : { message: await response.text() };
  }

  if (!response.ok) {
    const error = new Error(data?.message || `הבקשה נכשלה (${response.status})`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export const api = {
  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  searchRides: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        query.set(key, value);
      }
    });
    return request(`/api/rides?${query.toString()}`);
  },

  getRide: (id) => request(`/api/rides/${id}`),

  createRide: (body) =>
    request("/api/rides", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateRide: (id, body) =>
    request(`/api/rides/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),

  deleteRide: (id) =>
    request(`/api/rides/${id}`, {
      method: "DELETE"
    }),

  myPublishedRides: () => request("/api/rides/mine"),

  registerForRide: (id) =>
    request(`/api/rides/${id}/register`, {
      method: "POST"
    }),

  cancelRegistration: (id) =>
    request(`/api/rides/${id}/register`, {
      method: "DELETE"
    }),

  myRegistrations: () => request("/api/registrations/me"),

  ridePassengers: (rideId) =>
    request(`/api/rides/${rideId}/registrations`),

  removePassenger: (rideId, passengerId) =>
    request(`/api/rides/${rideId}/registrations/${passengerId}`, {
      method: "DELETE"
    }),

  adminUsers: () => request("/api/admin/users"),
  adminUser: (id) => request(`/api/admin/users/${id}`),
  adminDeleteRide: (id) =>
    request(`/api/admin/rides/${id}`, {
      method: "DELETE"
    })
};
