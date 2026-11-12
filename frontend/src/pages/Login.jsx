import { useState } from "react";
import { requestCode, verifyCode } from "../api";
import logo from "../assets/logo.png";
import photo from "../assets/science-fair.png";

export default function Login({ onLoggedIn }) {
  const [step, setStep] = useState("email"); // "email" or "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await verifyCode(email.trim(), code.trim());
      onLoggedIn(data.access_token);
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
        <span className="mono muted">MSEF Workspace</span>
      </header>

      <main className="main">
        <section className="card">
          <div className="stack-12">
            <span className="mono muted">Welcome back</span>
            <h1>Sign in</h1>
            <p className="lead">
              Connect with your mentor and take your science fair project further.
            </p>
          </div>

          {step === "email" ? (
            <form className="stack-24" onSubmit={handleEmail}>
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
                <p className="hint">Use the email linked to your MSEF account.</p>
              </div>
              <div className="stack-12">
                <button type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send code"}
                </button>
                {error && <p className="error">{error}</p>}
                <p className="hint">
                  If your email is linked to an account, we’ll send you a
                  6-digit code. No password needed.
                </p>
              </div>
            </form>
          ) : (
            <form className="stack-24" onSubmit={handleCode}>
              <div className="stack-8">
                <label htmlFor="code">6-digit code</label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <p className="hint">
                  If {email} has an account, a code is on its way. It expires
                  in 10 minutes.
                </p>
              </div>
              <div className="stack-12">
                <button type="submit" disabled={loading}>
                  {loading ? "Checking…" : "Log in"}
                </button>
                {error && <p className="error">{error}</p>}
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}

          <div className="divider stack-8">
            <p className="hint">Need an account or help getting access?</p>
            <a href="mailto:">Contact the MSEF team</a>
          </div>
        </section>

        <section className="welcome">
          <div className="stack-16">
            <div className="accent" />
            <h2>
              A little guidance.
              <br />
              A world of possibility.
            </h2>
            <p className="welcome-text">
              Bring your questions, explore your ideas, and work with a mentor
              to share what you discover.
            </p>
          </div>
          <img src={photo} alt="Students and a mentor at a science fair" />
          <div className="stack-8">
            <span className="mono">Curiosity grows with connection.</span>
            <p className="hint">
              Support for your next step in science and engineering.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Massachusetts Science + Engineering Fair</span>
        <span>Inspiring inquiry. Supporting discovery.</span>
      </footer>
    </div>
  );
}
