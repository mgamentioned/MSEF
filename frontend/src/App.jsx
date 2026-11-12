import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { getMe } from "./api";
import Invites from "./pages/Invites";
import Join from "./pages/Join";
import Login from "./pages/Login";

function Home({ me, onLogout }) {
  const canInvite = me && (me.role === "admin" || me.role === "teacher");
  return (
    <div className="page">
      <main className="main center">
        <section className="card">
          <h1>You’re logged in</h1>
          {me ? (
            <p className="lead">
              {me.email} · {me.role}
            </p>
          ) : (
            <p className="lead">Loading…</p>
          )}
          {canInvite && (
            <Link to="/invites" className="button-link">
              Manage invite links
            </Link>
          )}
          <button className="secondary" onClick={onLogout}>Log out</button>
        </section>
      </main>
    </div>
  );
}

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/join" element={<Join />} />
        <Route
          path="/invites"
          element={
            token ? <Invites token={token} me={me} /> : <Navigate to="/" />
          }
        />
        <Route
          path="*"
          element={
            token ? (
              <Home me={me} onLogout={logout} />
            ) : (
              <Login onLoggedIn={handleLoggedIn} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
