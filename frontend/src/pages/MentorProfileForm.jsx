import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteMentorPhoto,
  getMentorPhoto,
  photoSrc,
  saveMentorProfile,
  uploadMentorPhoto,
} from "../api";
import logo from "../assets/logo.png";

const EXPERTISE = [
  { value: "research_design", label: "Research & experimental design" },
  { value: "lab_safety", label: "Lab techniques & safety" },
  { value: "data_analysis", label: "Data analysis & statistics" },
  { value: "coding", label: "Coding & computational modeling" },
  { value: "engineering", label: "Engineering & prototyping" },
  { value: "other", label: "Other" },
];

const INTERESTS = [
  { value: "biology", label: "Biology & health" },
  { value: "chemistry", label: "Chemistry" },
  { value: "physics", label: "Physics & astronomy" },
  { value: "environmental", label: "Environmental science" },
  { value: "engineering", label: "Engineering & robotics" },
  { value: "computer_science", label: "Computer science & AI" },
  { value: "math_data", label: "Math & data science" },
  { value: "earth_science", label: "Earth science" },
  { value: "other", label: "Other" },
];

const EMPTY = {
  first_name: "",
  last_name: "",
  profession: "",
  organization: "",
  expertise: [],
  other_expertise: "",
  bio: "",
  interests: [],
  other_interests: "",
};

function CheckGroup({ options, selected, onToggle }) {
  return (
    <div className="choices">
      {options.map((o) => (
        <label key={o.value} className={`choice${selected.includes(o.value) ? " on" : ""}`}>
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={() => onToggle(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function MentorProfileForm({ token, me, profile, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() =>
    profile
      ? {
          ...EMPTY,
          ...profile,
          organization: profile.organization ?? "",
          other_expertise: profile.other_expertise ?? "",
          other_interests: profile.other_interests ?? "",
        }
      : EMPTY
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // profile photo (saved the moment it's chosen, separately from the form)
  const fileRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    getMentorPhoto(token)
      .then((r) => setPhotoUrl(r.photo_url))
      .catch(() => {});
  }, [token]);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    e.target.value = ""; // lets the same file be chosen again later
    if (!file) return;
    setPhotoError("");
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("That photo is over 5 MB. Please choose a smaller one.");
      return;
    }
    setPhotoBusy(true);
    try {
      const r = await uploadMentorPhoto(token, file);
      setPhotoUrl(r.photo_url);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoError("");
    setPhotoBusy(true);
    try {
      await deleteMentorPhoto(token);
      setPhotoUrl(null);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggle = (field) => (value) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.expertise.length === 0) {
      setError("Choose at least one area of expertise.");
      return;
    }
    if (form.interests.length === 0) {
      setError("Choose at least one STEM interest.");
      return;
    }
    setLoading(true);
    try {
      const saved = await saveMentorProfile(token, {
        first_name: form.first_name,
        last_name: form.last_name,
        profession: form.profession,
        organization: form.organization || null,
        expertise: form.expertise,
        other_expertise: form.other_expertise || null,
        bio: form.bio,
        interests: form.interests,
        other_interests: form.other_interests || null,
      });
      onSaved(saved);
      navigate("/");
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
        <span className="mono muted">Mentor workspace</span>
      </header>

      <main className="main form-page">
        <div className="intro stack-12">
          <span className="mono muted">Share your experience</span>
          <h1>{profile ? "Your mentor profile" : "Create your mentor profile"}</h1>
          <p className="lead">
            Help young scientists see what’s possible. Share your background and
            interests so we can connect you with high school science fair students.
          </p>
        </div>

        <form className="card form" onSubmit={handleSubmit}>
          <div className="form-top">
            <strong>A little guidance starts with you.</strong>
            <span className="muted">* Required</span>
          </div>

          <section className="form-section">
            <div className="stack-8">
              <div className="section-title">
                <span className="mono accent-text">01</span>
                <h2>About you</h2>
              </div>
              <p className="hint">Introduce yourself to the MSEF community.</p>
            </div>

            <div className="photo-row">
              <div className="avatar">
                {photoUrl ? (
                  <img src={photoSrc(photoUrl)} alt="Your profile" />
                ) : (
                  <span>No photo available</span>
                )}
              </div>
              <div className="stack-8">
                <label>Profile photo (optional)</label>
                <p className="hint">
                  JPG or PNG, up to 5 MB. A clear, professional photo helps
                  students get to know you.
                </p>
                <div className="photo-actions">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    ref={fileRef}
                    onChange={handlePhoto}
                  />
                  <button
                    type="button"
                    className="secondary small"
                    disabled={photoBusy}
                    onClick={() => fileRef.current.click()}
                  >
                    {photoBusy ? "Working…" : photoUrl ? "Replace photo" : "Upload photo"}
                  </button>
                  {photoUrl && !photoBusy && (
                    <button type="button" className="link" onClick={removePhoto}>
                      Remove
                    </button>
                  )}
                </div>
                {photoError && <p className="error">{photoError}</p>}
              </div>
            </div>

            <div className="grid-2">
              <div className="stack-8">
                <label htmlFor="first_name">First name *</label>
                <input id="first_name" placeholder="Your first name" value={form.first_name} onChange={set("first_name")} required />
              </div>
              <div className="stack-8">
                <label htmlFor="last_name">Last name *</label>
                <input id="last_name" placeholder="Your last name" value={form.last_name} onChange={set("last_name")} required />
              </div>
            </div>
            <div className="stack-8">
              <label htmlFor="email">Email address</label>
              <input id="email" value={me.email} readOnly />
              <p className="hint">
                For mentorship updates. Your email won’t appear on your public profile.
              </p>
            </div>
          </section>

          <section className="form-section">
            <div className="stack-8">
              <div className="section-title">
                <span className="mono accent-text">02</span>
                <h2>Your professional background</h2>
              </div>
              <p className="hint">Tell students about your work and the experience you can share.</p>
            </div>
            <div className="stack-8">
              <label htmlFor="profession">Profession / current role *</label>
              <input id="profession" placeholder="e.g., Biomedical engineer, researcher, science educator" value={form.profession} onChange={set("profession")} required />
            </div>
            <div className="stack-8">
              <label htmlFor="organization">Organization or institution (optional)</label>
              <input id="organization" placeholder="e.g., Your company, university, or school" value={form.organization} onChange={set("organization")} />
            </div>
            <div className="stack-8">
              <label>Areas of expertise *</label>
              <p className="hint">Where can you offer hands-on guidance? Select all that apply.</p>
              <CheckGroup options={EXPERTISE} selected={form.expertise} onToggle={toggle("expertise")} />
            </div>
            <div className="stack-8">
              <label htmlFor="other_expertise">Other expertise (optional)</label>
              <input id="other_expertise" placeholder="e.g., Field research, microscopy, scientific communication" value={form.other_expertise} onChange={set("other_expertise")} />
            </div>
            <div className="stack-8">
              <label htmlFor="bio">Short professional bio *</label>
              <textarea id="bio" placeholder="Share your background, what you work on, and how you’d like to help students explore their ideas." value={form.bio} onChange={set("bio")} required />
              <p className="hint">2–4 sentences is a great start. Keep it student-friendly and avoid private details.</p>
            </div>
          </section>

          <section className="form-section">
            <div className="stack-8">
              <div className="section-title">
                <span className="mono accent-text">03</span>
                <h2>Your STEM interests</h2>
              </div>
              <p className="hint">
                Which topics would you enjoy exploring with students? Select all that apply. *
              </p>
            </div>
            <CheckGroup options={INTERESTS} selected={form.interests} onToggle={toggle("interests")} />
            <div className="stack-8">
              <label htmlFor="other_interests">Other STEM interests (optional)</label>
              <input id="other_interests" placeholder="e.g., Materials science, oceanography, renewable energy" value={form.other_interests} onChange={set("other_interests")} />
            </div>
          </section>

          <div className="form-actions">
            <div className="stack-8">
              <p className="hint">
                You can update your background and interests as your experience grows.
              </p>
              {error && <p className="error">{error}</p>}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
