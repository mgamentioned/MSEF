import { Link } from "react-router-dom";
import { CalendarDays, Info } from "lucide-react";

export default function Meetings() {
  return (
    <div className="meetings">
      <div className="stack-8">
        <h1>Meetings</h1>
        <p className="hint">
          Your science fair mentoring sessions, from the first conversation to
          judging day.
        </p>
      </div>

      <section className="stack-12">
        <h2 className="mono-h">Upcoming meetings</h2>
        <div className="empty-card">
          <div className="empty-icon">
            <CalendarDays size={22} strokeWidth={1.75} />
          </div>
          <div className="stack-8">
            <strong>No upcoming meetings yet</strong>
            <p className="hint">
              When a student requests a time and you confirm it, the meeting will
              appear here. Make sure your availability is up to date so students
              can find a time.
            </p>
          </div>
          <Link to="/availability" className="button-link inline-button">
            Set your availability
          </Link>
        </div>
      </section>

      <p className="note">
        <Info size={14} />
        Rescheduling or cancelling a meeting notifies the student. Zoom links are
        only available for confirmed sessions.
      </p>
    </div>
  );
}
