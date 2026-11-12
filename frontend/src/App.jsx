import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { getMe, getProfile } from "./api";
import Invites from "./pages/Invites";
import Join from "./pages/Join";
import Login from "./pages/Login";
import ProfileForm from "./pages/ProfileForm";

function Loading() {
  return (
    <div className="page">
      <main className="main center">
        <p className="lead">Loading…</p>
      </main>
    </div>
  );
}

function Home({ me, profile, onLogout }) {
  const canInvite = me.role === "admin" || me.role === "teacher";
  return (
    <div className="page">
      <main className="main center">
        <section className="card">
          <h1>
            {profile ? `Welcome, ${profile.first_name}` : "You’re logged in"}
          </h1>
          <p className="lead">
            {me.email} · {me.role}
          </p>
          {me.role === "student" && (
            <Link to="/profile" className="button-link">Edit my profile</Link>
          )}
          {canInvite && (
            <Link to="/invites" className="button-link">Manage invite links</Link>
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
  // undefined = still loading, null = no profile (yet, or not needed)
  const [profile, setProfile] = useState(undefined);

  function handleLoggedIn(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setMe(null);
    setProfile(undefined);
  }

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(setMe)
      .catch((err) => {
        if (err.status === 401) logout(); // token expired or invalid
      });
  }, [token]);

  useEffect(() => {
    if (!me) return;
    if (me.role !== "student") {
      setProfile(null);
      return;
    }
    getProfile(token)
      .then(setProfile)
      .catch((err) => {
        if (err.status === 404) setProfile(null);
        else if (err.status === 401) logout();
      });
  }, [me]);

  const ready = Boolean(token && me && profile !== undefined);
  const needsProfile = ready && me.role === "student" && profile === null;

  let home;
  if (!token) home = <Login onLoggedIn={handleLoggedIn} />;
  else if (!ready) home = <Loading />;
  else if (needsProfile) home = <Navigate to="/profile" replace />;
  else home = <Home me={me} profile={profile} onLogout={logout} />;

  let profilePage;
  if (!token) profilePage = <Navigate to="/" replace />;
  else if (!ready) profilePage = <Loading />;
  else if (me.role !== "student") profilePage = <Navigate to="/" replace />;
  else
    profilePage = (
      <ProfileForm token={token} me={me} profile={profile} onSaved={setProfile} />
    );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/join" element={<Join />} />
        <Route
          path="/invites"
          element={token ? <Invites token={token} me={me} /> : <Navigate to="/" />}
        />
        <Route path="/profile" element={profilePage} />
        <Route path="*" element={home} />
      </Routes>
    </BrowserRouter>
  );
}
