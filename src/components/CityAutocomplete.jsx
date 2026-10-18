import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { searchIsraelLocalities } from "../data/israelLocalities";

export default function CityAutocomplete({
  label,
  value,
  onChange,
  placeholder = "הקלידי יישוב",
  required = false
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const suggestions = useMemo(
    () => searchIsraelLocalities(query, 10),
    [query]
  );

  function choose(city) {
    setQuery(city);
    onChange(city);
    setOpen(false);
  }

  function type(event) {
    const next = event.target.value;
    setQuery(next);
    setOpen(true);
    // ערך נשלח לטופס רק אחרי בחירה אמיתית מהרשימה.
    onChange("");
  }

  return (
    <label className="field city-field">
      <span>{label}</span>
      <div className="city-box" ref={rootRef}>
        <input
          value={query}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          onChange={type}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (query !== value) setQuery(value || "");
            }, 120);
          }}
        />
        <button
          type="button"
          className="city-chevron"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((current) => !current)}
          aria-label="פתיחת רשימת יישובים"
        >
          <ChevronDown size={17} />
        </button>

        {open && query.trim() && (
          <div className="city-menu">
            {suggestions.length ? (
              suggestions.map((city) => (
                <button
                  type="button"
                  key={city}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(city)}
                >
                  {city}
                </button>
              ))
            ) : (
              <div className="city-empty">לא נמצא יישוב מתאים</div>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
