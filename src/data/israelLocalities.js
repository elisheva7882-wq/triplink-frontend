import { searchCities } from "@il-address/core";

// הנתונים של היישובים ארוזים בתוך החבילה עצמה.
// אין כאן fetch ואין תלות ב-data.gov.il בזמן שהאפליקציה רצה.
export function searchIsraelLocalities(query, limit = 10) {
  const text = String(query ?? "").trim();
  if (!text) return [];

  return searchCities(text, { limit, minQueryLength: 1 })
    .map((city) => city.nameHe)
    .filter(Boolean);
}
