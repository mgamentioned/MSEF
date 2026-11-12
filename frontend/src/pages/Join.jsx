import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { checkInvite, joinWithInvite } from "../api";
import logo from "../assets/logo.png";

export default function Join() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState("checking"); // checking | valid | invalid | done
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    checkInvite(token)
      .then((invite) => {
        setRole(invite.role);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await joinWithInvite(token, email.trim());
      setStatus("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <img src={logo} alt="Massachusetts Science + Engineering Fair" />
      </header>

      <main className="main center">
        <section className="card">
          {status === "checking" && <p className="lead">Checking your invite…</p>}

          {status === "invalid" && (
            <>
              <h1>This link isn’t valid</h1>
              <p className="lead">
                The invite may have expired or already been used. Ask the person
                who invited you for a new link.
              </p>
            </>
          )}

          {status === "valid" && (
            <form className="stack-24" onSubmit={handleSubmit}>
              <div className="stack-12">
                <span className="mono muted">You’re invited</span>
                <h1>Join as a {role}</h1>
                <p className="lead">
                  Enter your email to create your MSEF account. You’ll log in
                  with a 6-digit code sent to this email.
                </p>
              </div>
              <div className="stack-8">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="stack-12">
                <button type="submit" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </button>
                {error && <p className="error">{error}</p>}
              </div>
            </form>
          )}

          {status === "done" && (
            <>
              <h1>You’re all set</h1>
              <p className="lead">
                Your account is ready. Log in with {email} to get started.
              </p>
              <Link to="/" className="button-link">Go to sign in</Link>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
