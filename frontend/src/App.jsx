import { useEffect, useState } from "react";
import { getMe } from "./api";
import Login from "./pages/Login";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [me, setMe] = useState(null);

  function handleLoggedIn(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setMe(null);
  }

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(setMe)
      .catch((err) => {
        if (err.status === 401) logout(); // token expired or invalid
      });
  }, [token]);

  if (!token) return <Login onLoggedIn={handleLoggedIn} />;

  return (
    <div className="page">
      <main className="main">
        <section className="card">
          <h1>You’re logged in</h1>
          {me ? (
            <p className="lead">
              {me.email} · {me.role}
            </p>
          ) : (
            <p className="lead">Loading…</p>
          )}
          <button onClick={logout}>Log out</button>
        </section>
      </main>
    </div>
  );
}
