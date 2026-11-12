import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createInvite, listInvites } from "../api";

const linkFor = (inviteToken) =>
  `${window.location.origin}/join?token=${inviteToken}`;

export default function Invites({ token, me }) {
  const [invites, setInvites] = useState([]);
  const [role, setRole] = useState("teacher");
  const [newLink, setNewLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canInvite = me && (me.role === "admin" || me.role === "teacher");

  function load() {
    listInvites(token).then(setInvites).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (canInvite) load();
  }, [canInvite]);

  async function handleCreate() {
    setError("");
    setCopied(false);
    setLoading(true);
    try {
      // admins choose a role; teachers always make student links
      const body = me.role === "admin" ? { role } : {};
      const invite = await createInvite(token, body);
      setNewLink(linkFor(invite.token));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  if (!me) {
    return (
      <div className="page">
        <main className="main center">
          <p className="lead">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <main className="main center">
        <section className="card wide">
          <div className="stack-12">
            <Link to="/" className="hint">← Back</Link>
            <h1>Invite links</h1>
            <p className="lead">
              {me.role === "admin"
                ? "Create a single-use link to invite a teacher or a mentor."
                : "Create a link to invite students. Share it with your class."}
            </p>
          </div>

          {!canInvite ? (
            <p className="lead">Your account can’t create invites.</p>
          ) : (
            <>
              <div className="stack-12">
                {me.role === "admin" && (
                  <div className="stack-8">
                    <label htmlFor="role">Invite a</label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="teacher">Teacher</option>
                      <option value="mentor">Mentor</option>
                    </select>
                  </div>
                )}
                <button onClick={handleCreate} disabled={loading}>
                  {loading ? "Creating…" : "Create invite link"}
                </button>
                {error && <p className="error">{error}</p>}
              </div>

              {newLink && (
                <div className="stack-8">
                  <label>New link</label>
                  <div className="linkbox">{newLink}</div>
                  <button className="secondary" onClick={() => copy(newLink)}>
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                </div>
              )}

              <div className="stack-8">
                <label>Your invites</label>
                {invites.length === 0 && (
                  <p className="hint">No invites yet.</p>
                )}
                {invites.map((inv) => (
                  <div className="invite-row" key={inv.token}>
                    <span className="mono">{inv.role}</span>
                    <span className="hint">
                      {inv.use_count}
                      {inv.max_uses ? ` / ${inv.max_uses}` : ""} used · expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </span>
                    <button
                      className="link"
                      onClick={() => copy(linkFor(inv.token))}
                    >
                      Copy link
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
