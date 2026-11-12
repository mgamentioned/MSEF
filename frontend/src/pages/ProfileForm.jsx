import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProfile } from "../api";
import logo from "../assets/logo.png";

const STAGES = [
  { value: "exploring", label: "Exploring ideas" },
  { value: "planning", label: "Planning" },
  { value: "testing", label: "Testing / building" },
  { value: "sharing", label: "Sharing results" },
];

const SUPPORT = [
  { value: "research_question", label: "Research question", hint: "Narrow an idea or shape a hypothesis." },
  { value: "experimental_design", label: "Experimental design", hint: "Plan methods, variables, and fair tests." },
  { value: "data_analysis", label: "Data analysis", hint: "Make sense of results and graphs." },
  { value: "presentation", label: "Presentation & poster", hint: "Tell your story and prepare for judging." },
  { value: "general", label: "General guidance", hint: "Talk through next steps with a mentor." },
  { value: "other", label: "Other support", hint: "Tell us what else would help below." },
];

const EMPTY = {
  first_name: "",
  last_name: "",
  school: "",
  grade: "",
  project_title: "",
  project_description: "",
  project_stage: "",
  support_needs: [],
  support_notes: "",
};

export default function ProfileForm({ token, me, profile, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() =>
    profile
      ? {
          ...EMPTY,
          ...profile,
          grade: String(profile.grade),
          support_notes: profile.support_notes ?? "",
        }
      : EMPTY
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function toggleSupport(value) {
    setForm((f) => ({
      ...f,
      support_needs: f.support_needs.includes(value)
        ? f.support_needs.filter((v) => v !== value)
        : [...f.support_needs, value],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.support_needs.length === 0) {
      setError("Choose at least one kind of support.");
      return;
    }
    setLoading(true);
    try {
      const saved = await saveProfile(token, {
        first_name: form.first_name,
        last_name: form.last_name,
        school: form.school,
        grade: Number(form.grade),
        project_title: form.project_title,
        project_description: form.project_description,
        project_stage: form.project_stage,
        support_needs: form.support_needs,
        support_notes: form.support_notes || null,
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
        <span className="mono muted">Student workspace</span>
      </header>

      <main className="main form-page">
        <div className="intro stack-12">
          <span className="mono muted">Student profile</span>
          <h1>{profile ? "Your profile" : "Create your profile"}</h1>
          <p className="lead">
            Tell us about you and your project so we can match you with a mentor.
          </p>
        </div>

        <form className="card form" onSubmit={handleSubmit}>
          <div className="form-top">
            <strong>Your next step starts here.</strong>
            <span className="muted">* Required</span>
          </div>

          <section className="form-section">
            <div className="section-title">
              <span className="mono accent-text">01</span>
              <h2>About you</h2>
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
              <label htmlFor="email">Email</label>
              <input id="email" value={me.email} readOnly />
              <p className="hint">This is the email you log in with.</p>
            </div>
            <div className="stack-8">
              <label htmlFor="school">School *</label>
              <input id="school" placeholder="Your high school’s name" value={form.school} onChange={set("school")} required />
            </div>
            <div className="stack-8">
              <label htmlFor="grade">Grade *</label>
              <select id="grade" value={form.grade} onChange={set("grade")} required>
                <option value="">Select your grade</option>
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="form-section">
            <div className="section-title">
              <span className="mono accent-text">02</span>
              <h2>Your science fair project</h2>
            </div>
            <p className="hint">An early idea is enough. Share what you’re curious about.</p>
            <div className="stack-8">
              <label htmlFor="project_title">Project title or working idea *</label>
              <input id="project_title" placeholder="e.g., How does light affect plant growth?" value={form.project_title} onChange={set("project_title")} required />
              <p className="hint">No final title yet? A short description of your idea works.</p>
            </div>
            <div className="stack-8">
              <label htmlFor="project_description">Tell us about your project *</label>
              <textarea id="project_description" placeholder="What question do you want to explore? What might you test, build, or investigate?" value={form.project_description} onChange={set("project_description")} required />
              <p className="hint">A few sentences is plenty. Include what you’ve tried so far, if anything.</p>
            </div>
            <div className="stack-8">
              <label>Where are you with your project? *</label>
              <div className="choices">
                {STAGES.map((s) => (
                  <label key={s.value} className={`choice${form.project_stage === s.value ? " on" : ""}`}>
                    <input
                      type="radio"
                      name="project_stage"
                      value={s.value}
                      checked={form.project_stage === s.value}
                      onChange={set("project_stage")}
                      required
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
              <p className="hint">Choose the one that feels closest. Every stage is welcome.</p>
            </div>
          </section>

          <section className="form-section">
            <div className="section-title">
              <span className="mono accent-text">03</span>
              <h2>Support you’re looking for</h2>
            </div>
            <p className="hint">Where could a mentor help? Select all that apply. *</p>
            <div className="choices">
              {SUPPORT.map((s) => (
                <label key={s.value} className={`choice${form.support_needs.includes(s.value) ? " on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.support_needs.includes(s.value)}
                    onChange={() => toggleSupport(s.value)}
                  />
                  <span>
                    {s.label}
                    <small>{s.hint}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="stack-8">
              <label htmlFor="support_notes">Anything specific you’d like help with? (optional)</label>
              <textarea id="support_notes" placeholder="e.g., I’m not sure which variables to measure, or how to get started with my experiment." value={form.support_notes} onChange={set("support_notes")} />
              <p className="hint">Share a question or challenge. Please leave out private personal information.</p>
            </div>
          </section>

          <div className="form-actions">
            <div className="stack-8">
              <p className="hint">
                Your ideas can change. You can update your profile as your project grows.
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
