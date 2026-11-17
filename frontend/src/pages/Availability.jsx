import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAvailability, getMentorSlots, saveAvailability } from "../api";
import logo from "../assets/logo.png";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// every half hour from 6:00 AM to 10:00 PM, as minutes after midnight
const TIMES = Array.from({ length: 33 }, (_, i) => 360 + i * 30);
const START_TIMES = TIMES.slice(0, -1);
const END_TIMES = TIMES.slice(1);
const DEFAULT_WINDOW = { start: 15 * 60 + 30, end: 17 * 60 + 30 }; // 3:30 PM to 5:30 PM

function fmt(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function toDays(windows) {
  const days = Array.from({ length: 7 }, () => []);
  for (const w of windows) days[w.weekday].push({ start: w.start, end: w.end });
  days.forEach((d) => d.sort((a, b) => a.start - b.start));
  return days;
}

function toWindows(days) {
  return days.flatMap((windows, weekday) =>
    windows.map((w) => ({ weekday, start: w.start, end: w.end }))
  );
}

const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function Availability({ token, me }) {
  const [days, setDays] = useState(() => toDays([]));
  const [tz, setTz] = useState(browserTz);
  const [baseline, setBaseline] = useState(null); // what's saved on the server
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const snapshot = (timezone, d) => JSON.stringify({ timezone, windows: toWindows(d) });
  const dirty = baseline !== null && snapshot(tz, days) !== baseline;

  function loadSlots() {
    getMentorSlots(token, me.id).then(setSlots).catch(() => {});
  }

  useEffect(() => {
    getAvailability(token)
      .then((r) => {
        const loadedTz = r.timezone ?? browserTz;
        const loadedDays = toDays(r.windows);
        setTz(loadedTz);
        setDays(loadedDays);
        setBaseline(snapshot(loadedTz, loadedDays));
      })
      .catch((err) => setError(err.message));
    loadSlots();
  }, [token]);

  function change(updater) {
    setJustSaved(false);
    setDays((current) => updater(current.map((d) => d.map((w) => ({ ...w })))));
  }

  const toggleDay = (i) =>
    change((d) => {
      d[i] = d[i].length ? [] : [{ ...DEFAULT_WINDOW }];
      return d;
    });

  const setTime = (i, j, field, value) =>
    change((d) => {
      d[i][j][field] = value;
      if (field === "start" && d[i][j].end <= value) d[i][j].end = Math.min(value + 60, 1320);
      return d;
    });

  const addWindow = (i) =>
    change((d) => {
      const last = d[i][d[i].length - 1];
      d[i].push({ start: last.end, end: Math.min(last.end + 60, 1320) });
      return d;
    });

  const removeWindow = (i, j) =>
    change((d) => {
      d[i].splice(j, 1);
      return d;
    });

  const copyToWeekdays = (i) =>
    change((d) => {
      for (let k = 0; k < 5; k++) if (k !== i) d[k] = d[i].map((w) => ({ ...w }));
      return d;
    });

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const saved = await saveAvailability(token, { timezone: tz, windows: toWindows(days) });
      const savedDays = toDays(saved.windows);
      setDays(savedDays);
      setTz(saved.timezone);
      setBaseline(snapshot(saved.timezone, savedDays));
      setJustSaved(true);
      loadSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const slotGroups = useMemo(() => {
    const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
    const groups = [];
    for (const s of slots) {
      const start = new Date(s.start);
      const end = new Date(s.end);
      const label = dayFmt.format(start);
      let group = groups[groups.length - 1];
      if (!group || group.label !== label) {
        group = { label, times: [] };
        groups.push(group);
      }
      group.times.push(`${timeFmt.format(start)} – ${timeFmt.format(end)}`);
    }
    return groups;
  }, [slots]);

  return (
    <div className="page">
      <header className="header">
        <img src={logo} alt="Massachusetts Science + Engineering Fair" />
        <span className="mono muted">Mentor workspace</span>
      </header>

      <main className="main form-page">
        <div className="intro stack-12">
          <Link to="/" className="hint">← Back</Link>
          <h1>Availability</h1>
          <p className="lead">
            Make room for the next great idea. Set the times students can request
            to meet with you.
          </p>
        </div>

        <section className="card form">
          <div className="form-top">
            <strong>Your schedule’s timezone</strong>
            <span className="muted">
              {tz}
              {tz !== browserTz && (
                <>
                  {" · "}
                  <button type="button" className="link inline" onClick={() => { setJustSaved(false); setTz(browserTz); }}>
                    Use {browserTz} instead
                  </button>
                </>
              )}
            </span>
          </div>

          <div className="form-section">
            <div className="stack-8">
              <div className="section-title">
                <h2>Weekly availability</h2>
              </div>
              <p className="hint">
                Set your regular hours. Students see these times in their own
                timezone. Sessions are 30 minutes with a 15-minute break between
                them.
              </p>
            </div>

            <div>
              {DAYS.map((name, i) => (
                <div className="week-row" key={name}>
                  <label className="switch" aria-label={`${name} available`}>
                    <input type="checkbox" checked={days[i].length > 0} onChange={() => toggleDay(i)} />
                    <span />
                  </label>
                  <div className={`day-name${days[i].length ? "" : " muted"}`}>{name}</div>

                  {days[i].length === 0 ? (
                    <p className="hint grow">Unavailable</p>
                  ) : (
                    <div className="windows grow">
                      {days[i].map((w, j) => (
                        <div className="window" key={j}>
                          <select value={w.start} onChange={(e) => setTime(i, j, "start", Number(e.target.value))}>
                            {START_TIMES.map((t) => (
                              <option key={t} value={t}>{fmt(t)}</option>
                            ))}
                          </select>
                          <span className="hint">to</span>
                          <select value={w.end} onChange={(e) => setTime(i, j, "end", Number(e.target.value))}>
                            {END_TIMES.filter((t) => t >= w.start + 30).map((t) => (
                              <option key={t} value={t}>{fmt(t)}</option>
                            ))}
                          </select>
                          <button type="button" className="link inline" onClick={() => removeWindow(i, j)}>
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="window-actions">
                        {days[i].length < 3 && days[i][days[i].length - 1].end < 1290 && (
                          <button type="button" className="link inline" onClick={() => addWindow(i)}>
                            + Add another window
                          </button>
                        )}
                        <button type="button" className="link inline" onClick={() => copyToWeekdays(i)}>
                          Copy to all weekdays
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="hint">
              Weekends are off by default. Students can request times at least 24
              hours ahead and up to 7 days out, and you approve each session.
            </p>
          </div>

          <div className="form-actions">
            <div className="stack-8">
              <strong className="small-text">
                {dirty ? "You have unsaved changes" : justSaved ? "Saved" : "Everything is saved"}
              </strong>
              <p className="hint">Save to update the times students can request.</p>
              {error && <p className="error">{error}</p>}
            </div>
            <button type="button" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>

        <section className="card form">
          <div className="form-section no-border">
            <div className="stack-8">
              <div className="section-title">
                <h2>Student view</h2>
              </div>
              <p className="hint">
                The times students can request with you right now, shown in your
                browser’s timezone. Pending requests don’t reserve a time.
              </p>
            </div>
            {slotGroups.length === 0 ? (
              <p className="hint">
                No requestable times yet. Save your weekly hours, and times at least
                24 hours away will appear here.
              </p>
            ) : (
              slotGroups.map((g) => (
                <div className="stack-8" key={g.label}>
                  <strong className="small-text">{g.label}</strong>
                  <div className="chips">
                    {g.times.map((t) => (
                      <span className="chip plain" key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
