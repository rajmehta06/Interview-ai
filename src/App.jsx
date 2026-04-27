import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCENT = "#4F8EF7";
const PURPLE = "#A78BFA";
const TEAL = "#00C9A7";
const AMBER = "#F59E0B";
const PINK = "#F472B6";
const GREEN = "#34D399";

const FEATURES = [
  { icon: "🎙️", title: "Voice-Based Answer Input", desc: "Record or upload audio answers. Speech converted to text in real time.", accent: TEAL, id: "voice" },
  { icon: "📊", title: "Speech Analysis", desc: "Detect WPM, filler words, fluency, pauses, and rhythm in your delivery.", accent: ACCENT, id: "speech" },
  { icon: "🤖", title: "AI Answer Evaluation", desc: "Score out of 10 with strengths, weaknesses, and an improved answer.", accent: PURPLE, id: "eval" },
  { icon: "📄", title: "Resume Analyzer", desc: "Upload your PDF resume for missing skills, weak points, and suggestions.", accent: AMBER, id: "resume" },
  { icon: "🎯", title: "Resume vs JD Analyzer", desc: "Match resume against job description — keywords, gaps, and tailored fixes.", accent: PINK, id: "jd" },
  { icon: "📈", title: "Performance Dashboard", desc: "Track scores, feedback trends, and your improvement over time.", accent: GREEN, id: "dashboard" },
];

const STEPS = [
  { num: "01", title: "Create Profile", desc: "Tell us about yourself, your background, and your target roles." },
  { num: "02", title: "Upload or Record", desc: "Submit audio answers or upload your resume to get started." },
  { num: "03", title: "AI Analyzes", desc: "Our models dissect speech, content quality, and resume alignment." },
  { num: "04", title: "Track Progress", desc: "Monitor your improvement on your personal dashboard." },
];

// Demo walkthrough steps shown in the Watch Demo modal
const DEMO_SLIDES = [
  {
    icon: "👋",
    title: "Set Up Your Profile",
    desc: "Tell us your name, education, experience, and target job types. InterviewAI personalises every analysis to your specific background and goals.",
    accent: ACCENT,
  },
  {
    icon: "🎙️",
    title: "Record Your Answer",
    desc: "Hit 'Start Recording' and answer a real interview question out loud. Our live speech-to-text captures every word instantly — no uploads needed.",
    accent: TEAL,
  },
  {
    icon: "🤖",
    title: "Get AI Feedback",
    desc: "Receive a score out of 10, filler-word counts, estimated WPM, identified strengths and weaknesses, plus a fully rewritten model answer.",
    accent: PURPLE,
  },
  {
    icon: "📄",
    title: "Analyse Your Resume",
    desc: "Upload your PDF resume and get an overall score, ATS compatibility rating, missing skills, formatting feedback, and concrete improvement tips.",
    accent: AMBER,
  },
  {
    icon: "🎯",
    title: "Match Resume to JD",
    desc: "Paste any job description and see exactly which keywords you have, which you're missing, and a tailored improvement plan to maximise your match score.",
    accent: PINK,
  },
  {
    icon: "📈",
    title: "Track Your Progress",
    desc: "Your dashboard stores every session — watch your scores climb over time, see average and best scores, and stay motivated as you improve.",
    accent: GREEN,
  },
];

const JOB_TYPES = ["Software Engineer", "Data Scientist", "Product Manager", "Business Analyst", "Marketing", "Finance / Banking", "Design / UX", "Operations", "Sales", "Healthcare", "Law / Legal", "Other"];
const EDUCATION_LEVELS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD / Doctorate", "Other"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// Calls the local Express proxy — keeps the API key out of the browser
async function callClaude(prompt, systemPrompt = "") {
  const body = { prompt, systemPrompt };
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data.text || "No response.";
}

// Calls the proxy for requests that need a PDF document attached
async function callClaudeWithDoc(base64, mimeType, userText, systemPrompt = "") {
  const body = { base64, mimeType, userText, systemPrompt };
  const res = await fetch("/api/claude-doc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data.text || "No response.";
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  btn: (gradient = `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, extra = {}) => ({
    background: gradient, border: "none", borderRadius: 100,
    padding: "13px 30px", color: "#fff", fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.2s",
    ...extra,
  }),
  card: (extra = {}) => ({
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: 24, ...extra,
  }),
  input: (extra = {}) => ({
    width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, padding: "12px 16px", color: "#fff", fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, outline: "none", ...extra,
  }),
  label: { fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 6, display: "block" },
  tag: (color) => ({
    background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 100,
    padding: "4px 12px", color, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
  }),
};

// ─── DEMO MODAL ───────────────────────────────────────────────────────────────
function DemoModal({ onClose }) {
  const [slide, setSlide] = useState(0);
  const current = DEMO_SLIDES[slide];
  const isLast = slide === DEMO_SLIDES.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(4,4,12,0.94)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "linear-gradient(145deg, #0d0d20, #111128)",
        border: `1px solid ${current.accent}40`,
        borderRadius: 28, padding: "48px 44px", maxWidth: 520, width: "100%",
        boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 80px ${current.accent}18`,
        transition: "border-color 0.4s, box-shadow 0.4s",
      }} onClick={e => e.stopPropagation()}>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 36, justifyContent: "center" }}>
          {DEMO_SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 24 : 8, height: 8, borderRadius: 99,
              background: i === slide ? current.accent : "rgba(255,255,255,0.15)",
              transition: "all 0.4s ease", cursor: "pointer",
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, marginBottom: 24,
          background: `${current.accent}18`, border: `1px solid ${current.accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
          transition: "background 0.4s, border-color 0.4s",
        }}>
          {current.icon}
        </div>

        <div style={{ ...S.tag(current.accent), display: "inline-block", marginBottom: 14, transition: "all 0.3s" }}>
          Step {slide + 1} of {DEMO_SLIDES.length}
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(1.4rem, 3vw, 1.9rem)", color: "#fff",
          marginBottom: 14, marginTop: 10, letterSpacing: "-0.5px", lineHeight: 1.15,
        }}>
          {current.title}
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.5)",
          fontSize: 15, lineHeight: 1.75, marginBottom: 36,
        }}>
          {current.desc}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          {slide > 0 ? (
            <button onClick={() => setSlide(s => s - 1)} style={S.btn("rgba(255,255,255,0.08)", { padding: "11px 22px", fontSize: 14 })}>← Back</button>
          ) : <div />}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={S.btn("rgba(255,255,255,0.06)", { border: "1px solid rgba(255,255,255,0.1)", padding: "11px 22px", fontSize: 14 })}>
              Close
            </button>
            {!isLast ? (
              <button onClick={() => setSlide(s => s + 1)} style={S.btn(`linear-gradient(135deg, ${current.accent}, ${PURPLE})`, { padding: "11px 22px", fontSize: 14 })}>
                Next →
              </button>
            ) : (
              <button onClick={onClose} style={S.btn(`linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, { padding: "11px 22px", fontSize: 14 })}>
                🚀 Let's Go!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING MODAL ─────────────────────────────────────────────────────────
function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", dob: "", phone: "", location: "", gender: "",
    education: "", field: "", experience: "", jobTypes: [],
    skills: "", linkedIn: "", goal: "", hearAbout: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleJob = (j) => set("jobTypes", form.jobTypes.includes(j) ? form.jobTypes.filter(x => x !== j) : [...form.jobTypes, j]);

  const steps = [
    {
      title: "Welcome! Let's get to know you 👋",
      subtitle: "Your personal profile helps us tailor every analysis to your goals.",
      fields: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Full Name *</label>
            <input style={S.input()} placeholder="e.g. Arjun Sharma" value={form.name} onChange={e => set("name", e.target.value)} />
            {errors.name && <span style={{ color: "#f87171", fontSize: 12 }}>{errors.name}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={S.label}>Date of Birth *</label>
              <input type="date" style={S.input()} value={form.dob} onChange={e => set("dob", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Gender</label>
              <select style={S.input()} value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option value="">Select</option>
                {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={S.label}>Phone Number</label>
              <input style={S.input()} placeholder="+91 9876543210" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Location / City</label>
              <input style={S.input()} placeholder="Bangalore, India" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        const e = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.dob) e.dob = "Date of birth is required";
        setErrors(e);
        return Object.keys(e).length === 0;
      },
    },
    {
      title: "Your Education & Experience 🎓",
      subtitle: "This helps us benchmark your answers to the right level.",
      fields: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Education Level *</label>
            <select style={S.input()} value={form.education} onChange={e => set("education", e.target.value)}>
              <option value="">Select your highest degree</option>
              {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.education && <span style={{ color: "#f87171", fontSize: 12 }}>{errors.education}</span>}
          </div>
          <div>
            <label style={S.label}>Field of Study / Major</label>
            <input style={S.input()} placeholder="e.g. Computer Science, MBA, Finance..." value={form.field} onChange={e => set("field", e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Years of Work Experience</label>
            <select style={S.input()} value={form.experience} onChange={e => set("experience", e.target.value)}>
              <option value="">Select</option>
              {["Fresher (0 years)", "1–2 years", "3–5 years", "6–10 years", "10+ years"].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Key Skills (comma separated)</label>
            <input style={S.input()} placeholder="e.g. Python, SQL, Communication, Leadership..." value={form.skills} onChange={e => set("skills", e.target.value)} />
          </div>
        </div>
      ),
      validate: () => {
        const e = {};
        if (!form.education) e.education = "Please select education level";
        setErrors(e);
        return Object.keys(e).length === 0;
      },
    },
    {
      title: "Your Career Goals 🎯",
      subtitle: "Tell us what kind of roles you're targeting so we can personalize feedback.",
      fields: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Target Job Types * (select all that apply)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {JOB_TYPES.map(j => (
                <button key={j} onClick={() => toggleJob(j)} style={{
                  background: form.jobTypes.includes(j) ? `${ACCENT}30` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${form.jobTypes.includes(j) ? ACCENT : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 100, padding: "7px 16px", color: form.jobTypes.includes(j) ? ACCENT : "rgba(255,255,255,0.5)",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                }}>{j}</button>
              ))}
            </div>
            {errors.jobTypes && <span style={{ color: "#f87171", fontSize: 12 }}>{errors.jobTypes}</span>}
          </div>
          <div>
            <label style={S.label}>LinkedIn Profile URL (optional)</label>
            <input style={S.input()} placeholder="https://linkedin.com/in/yourname" value={form.linkedIn} onChange={e => set("linkedIn", e.target.value)} />
          </div>
          <div>
            <label style={S.label}>What's your #1 interview goal?</label>
            <select style={S.input()} value={form.goal} onChange={e => set("goal", e.target.value)}>
              <option value="">Select</option>
              {["Land my first job", "Switch to a new field", "Get promoted", "Improve communication", "Ace a specific company interview", "Build long-term career skills"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>How did you hear about us?</label>
            <select style={S.input()} value={form.hearAbout} onChange={e => set("hearAbout", e.target.value)}>
              <option value="">Select</option>
              {["Google / Search", "LinkedIn", "Friend / Referral", "Twitter / X", "YouTube", "Other"].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
      ),
      validate: () => {
        const e = {};
        if (form.jobTypes.length === 0) e.jobTypes = "Please select at least one job type";
        setErrors(e);
        return Object.keys(e).length === 0;
      },
    },
  ];

  const next = () => {
    if (!steps[step].validate()) return;
    if (step < steps.length - 1) setStep(s => s + 1);
    else onComplete(form);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(4,4,12,0.92)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "linear-gradient(145deg, #0d0d20, #111128)",
        border: "1px solid rgba(79,142,247,0.2)",
        borderRadius: 28, padding: "44px 40px", maxWidth: 580, width: "100%",
        boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(79,142,247,0.08)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: i <= step ? `linear-gradient(90deg, ${ACCENT}, ${PURPLE})` : "rgba(255,255,255,0.1)",
              transition: "all 0.4s ease",
            }} />
          ))}
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={S.tag(ACCENT)}>{`Step ${step + 1} of ${steps.length}`}</span>
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#fff", marginBottom: 8, marginTop: 14, letterSpacing: "-0.5px" }}>
          {steps[step].title}
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {steps[step].subtitle}
        </p>

        {steps[step].fields}

        <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "space-between" }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={S.btn("rgba(255,255,255,0.08)")}>← Back</button>
          ) : <div />}
          <button onClick={next} style={S.btn()}>
            {step === steps.length - 1 ? "🚀 Launch My Dashboard" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function Navbar({ user, onNav }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(8,8,18,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "all 0.3s ease", padding: "0 5vw",
      display: "flex", alignItems: "center", justifyContent: "space-between", height: 68,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
          Interview<span style={{ color: ACCENT }}>AI</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {user && (
          <>
            {[["voice", "🎙️ Voice"], ["resume", "📄 Resume"], ["jd", "🎯 JD Match"], ["dashboard", "📈 Dashboard"]].map(([id, label]) => (
              <button key={id} onClick={() => onNav(id)} style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.6)",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer",
                padding: "6px 12px", borderRadius: 8, transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = "none"; }}
              >{label}</button>
            ))}
            <div style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, borderRadius: "50%",
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff",
            }}>{user.name?.[0]?.toUpperCase()}</div>
          </>
        )}
        {!user && (
          <button onClick={() => onNav("onboard")} style={S.btn()}>Get Started</button>
        )}
      </div>
    </nav>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function Landing({ onGetStarted, onWatchDemo }) {
  const [ref1, iv1] = useInView();
  const [ref2, iv2] = useInView();

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 5vw 80px", position: "relative", overflow: "hidden", textAlign: "center",
      }}>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)", top: "0%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)", bottom: "10%", right: "5%", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 100, padding: "6px 18px", marginBottom: 32, animation: "fadeUp 0.6s ease both" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", color: ACCENT, fontSize: 13, fontWeight: 600 }}>AI-Powered Interview Coaching</span>
        </div>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 1.08, color: "#fff", marginBottom: 24, maxWidth: 820, animation: "fadeUp 0.7s 0.1s ease both", letterSpacing: "-2px" }}>
          Speak Better.{" "}
          <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${PURPLE} 50%, ${TEAL} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Interview Smarter.
          </span>{" "}
          Land the Job.
        </h1>

        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "clamp(1rem, 2vw, 1.18rem)", lineHeight: 1.75, maxWidth: 560, marginBottom: 44, animation: "fadeUp 0.7s 0.2s ease both" }}>
          Analyze your voice, evaluate your answers, and optimize your resume — all powered by AI. Real feedback. Real scores. Real improvement.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.7s 0.3s ease both" }}>
          <button onClick={onGetStarted} style={S.btn(`linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, { padding: "15px 38px", fontSize: 16, boxShadow: `0 0 50px rgba(79,142,247,0.35)` })}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 60px rgba(79,142,247,0.5)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 0 50px rgba(79,142,247,0.35)`; }}
          >🚀 Get Started Free</button>

          {/* FIX: Watch Demo now opens the DemoModal */}
          <button onClick={onWatchDemo} style={S.btn("rgba(255,255,255,0.06)", { border: "1px solid rgba(255,255,255,0.12)", padding: "15px 38px", fontSize: 16 })}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >▶ Watch Demo</button>
        </div>

        {/* Stats — labelled as illustrative in README */}
        <div style={{ display: "flex", gap: 48, marginTop: 70, animation: "fadeUp 0.7s 0.4s ease both", flexWrap: "wrap", justifyContent: "center" }}>
          {[["10K+", "Users Coached"], ["94%", "Interview Success Rate"], ["6", "AI-Powered Tools"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="Features" style={{ padding: "100px 5vw" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }} ref={ref1}>
            <div style={{ display: "inline-block", background: `rgba(79,142,247,0.1)`, border: `1px solid rgba(79,142,247,0.3)`, borderRadius: 100, padding: "5px 16px", marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", color: ACCENT, fontSize: 13, fontWeight: 600 }}>Everything You Need</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", letterSpacing: "-1.5px", marginBottom: 14 }}>
              6 Powerful AI Features
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              From speech coaching to resume optimization — every tool you need to walk into any interview with confidence.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.id} feature={f} delay={i * 0.07} onClick={onGetStarted} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="HowItWorks" style={{ padding: "80px 5vw" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }} ref={ref2}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", letterSpacing: "-1.5px", marginBottom: 12 }}>
              How It Works
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ ...S.card(), transition: `all 0.5s ${i * 0.1}s ease`, cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.border = `1px solid rgba(79,142,247,0.3)`; e.currentTarget.style.background = "rgba(79,142,247,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 38, background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>{s.num}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 5vw 120px" }}>
        <div style={{
          maxWidth: 860, margin: "0 auto",
          background: `linear-gradient(135deg, rgba(79,142,247,0.1), rgba(167,139,250,0.1))`,
          border: "1px solid rgba(79,142,247,0.2)", borderRadius: 28, padding: "70px 44px", textAlign: "center",
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#fff", letterSpacing: "-1.5px", marginBottom: 14 }}>
            Ready to Transform Your Interview Game?
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: 16, marginBottom: 36 }}>
            Join thousands of candidates who landed their dream jobs using AI-powered coaching.
          </p>
          <button onClick={onGetStarted} style={S.btn(`linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, { padding: "16px 44px", fontSize: 17, boxShadow: `0 0 50px rgba(79,142,247,0.4)` })}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
          >🚀 Start for Free Today</button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "30px 5vw", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>Interview<span style={{ color: ACCENT }}>AI</span></span>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>© 2026 AI Interview Analyzer. Built to help you succeed.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ feature, delay, onClick }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} onClick={onClick} style={{
      ...S.card(),
      transform: inView ? "translateY(0)" : "translateY(30px)",
      opacity: inView ? 1 : 0,
      transition: `all 0.6s ${delay}s ease`,
      cursor: "pointer",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${feature.accent}40`; e.currentTarget.style.boxShadow = `0 0 40px ${feature.accent}15`; }}
      onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ fontSize: 36, marginBottom: 16 }}>{feature.icon}</div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 10 }}>{feature.title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7 }}>{feature.desc}</p>
      <div style={{ marginTop: 18 }}>
        <span style={S.tag(feature.accent)}>Try it →</span>
      </div>
    </div>
  );
}

// ─── VOICE / SPEECH / EVAL TOOL ───────────────────────────────────────────────
// FIX: Added `onResult` to the destructured props so sessions are saved to dashboard
function VoiceEvalTool({ user, onResult }) {
  const [question, setQuestion] = useState("Tell me about yourself.");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t + " ";
        else interim += t;
      }
      setTranscript(finalTranscript + interim);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
    setTranscript("");
    setResult(null);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const analyze = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const words = transcript.trim().split(/\s+/).length;
      const durationEstimate = words / 130;
      const fillerWords = ["uh", "um", "like", "you know", "basically", "actually", "literally", "right", "so"];
      const fillerCounts = {};
      fillerWords.forEach(fw => {
        const matches = transcript.toLowerCase().match(new RegExp(`\\b${fw}\\b`, "g"));
        if (matches && matches.length > 0) fillerCounts[fw] = matches.length;
      });

      const systemPrompt = `You are an expert interview coach. The user is a ${form_profile(user)} applying for ${user.jobTypes?.join(", ")} roles.
Analyze the interview answer with:
1. SCORE (number 1-10)
2. STRENGTHS (2-3 bullet points)
3. WEAKNESSES (2-3 bullet points)  
4. IMPROVED ANSWER (rewrite the answer better)
5. TIPS (2 specific tips)

Respond in this EXACT JSON format:
{
  "score": 7,
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["point 1", "point 2"],
  "improvedAnswer": "...",
  "tips": ["tip 1", "tip 2"]
}`;

      const raw = await callClaude(
        `Interview Question: "${question}"\n\nCandidate Answer: "${transcript}"`,
        systemPrompt
      );

      let parsed;
      try {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { score: "N/A", strengths: ["Good attempt"], weaknesses: ["Try again"], improvedAnswer: raw, tips: [] };
      }

      const finalResult = {
        ...parsed,
        question,
        wpm: Math.round(words / Math.max(durationEstimate, 1)),
        wordCount: words,
        fillers: fillerCounts,
        transcript,
      };

      setResult(finalResult);

      // FIX: call onResult so App can persist the session to dashboard
      if (onResult && parsed.score && parsed.score !== "N/A") {
        onResult(finalResult);
      }
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#fff", marginBottom: 8, letterSpacing: "-1px" }}>🎙️ Voice Answer Analyzer</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 32 }}>Record your answer and get instant AI feedback on speech quality and content.</p>

      <div style={{ ...S.card(), marginBottom: 20 }}>
        <label style={S.label}>Interview Question</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input style={{ ...S.input(), flex: 1 }} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type your interview question..." />
          <button onClick={() => {
            const qs = ["Tell me about yourself.", "Why do you want this role?", "What is your greatest strength?", "Describe a challenge you overcame.", "Where do you see yourself in 5 years?"];
            setQuestion(qs[Math.floor(Math.random() * qs.length)]);
          }} style={S.btn("rgba(255,255,255,0.06)", { padding: "12px 18px", fontSize: 13 })}>Random Q</button>
        </div>
      </div>

      <div style={{ ...S.card(), marginBottom: 20, textAlign: "center" }}>
        <div style={{ marginBottom: 20 }}>
          <button onClick={recording ? stopRecording : startRecording} style={S.btn(
            recording ? "linear-gradient(135deg, #ef4444, #dc2626)" : `linear-gradient(135deg, ${TEAL}, ${ACCENT})`,
            { padding: "16px 36px", fontSize: 16, boxShadow: recording ? "0 0 40px rgba(239,68,68,0.4)" : `0 0 40px rgba(0,201,167,0.3)` }
          )}>
            {recording ? "⏹️ Stop Recording" : "🎙️ Start Recording"}
          </button>
        </div>
        {recording && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#ef4444", fontSize: 13 }}>Recording... speak now</span>
          </div>
        )}
        {transcript && (
          <div style={{ ...S.card({ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }), textAlign: "left", marginTop: 12 }}>
            <label style={{ ...S.label, marginBottom: 8 }}>Transcript</label>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7 }}>{transcript}</p>
          </div>
        )}
      </div>

      {/* Manual text input */}
      <div style={{ ...S.card(), marginBottom: 20 }}>
        <label style={S.label}>Or type your answer manually</label>
        <textarea style={{ ...S.input(), minHeight: 100, resize: "vertical" }} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste or type your answer here..." />
      </div>

      <button onClick={analyze} disabled={loading || !transcript.trim()} style={S.btn(`linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, {
        width: "100%", padding: "16px", fontSize: 16,
        opacity: (!transcript.trim() || loading) ? 0.5 : 1,
        cursor: (!transcript.trim() || loading) ? "not-allowed" : "pointer",
      })}>
        {loading ? "⏳ Analyzing..." : "🤖 Analyze Answer"}
      </button>

      {result && !result.error && (
        <div style={{ marginTop: 28 }}>
          {/* Score + Speech Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard label="AI Score" value={`${result.score}/10`} color={ACCENT} />
            <StatCard label="Word Count" value={result.wordCount} color={TEAL} />
            <StatCard label="Est. WPM" value={result.wpm} color={PURPLE} />
            <StatCard label="Filler Words" value={Object.values(result.fillers || {}).reduce((a, b) => a + b, 0)} color={AMBER} />
          </div>

          {Object.keys(result.fillers || {}).length > 0 && (
            <div style={{ ...S.card(), marginBottom: 16 }}>
              <label style={{ ...S.label, marginBottom: 12 }}>Filler Word Breakdown</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(result.fillers).map(([w, c]) => (
                  <span key={w} style={{ ...S.tag(AMBER) }}>"{w}" × {c}</span>
                ))}
              </div>
            </div>
          )}

          {/* FIX: mobile responsive — switch to 1 column on small screens */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={S.card()}>
              <label style={{ ...S.label, color: GREEN, marginBottom: 10 }}>✅ Strengths</label>
              {result.strengths?.map((s, i) => <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>• {s}</p>)}
            </div>
            <div style={S.card()}>
              <label style={{ ...S.label, color: "#f87171", marginBottom: 10 }}>⚠️ Weaknesses</label>
              {result.weaknesses?.map((w, i) => <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>• {w}</p>)}
            </div>
          </div>

          <div style={{ ...S.card({ border: `1px solid ${PURPLE}30`, background: `${PURPLE}08` }), marginBottom: 16 }}>
            <label style={{ ...S.label, color: PURPLE, marginBottom: 10 }}>💡 Improved Answer</label>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.75 }}>{result.improvedAnswer}</p>
          </div>

          {result.tips?.length > 0 && (
            <div style={S.card()}>
              <label style={{ ...S.label, color: TEAL, marginBottom: 10 }}>🎯 Quick Tips</label>
              {result.tips.map((t, i) => <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>→ {t}</p>)}
            </div>
          )}
        </div>
      )}
      {result?.error && <div style={{ ...S.card({ border: "1px solid #f87171" }), color: "#f87171", fontFamily: "'DM Sans', sans-serif", fontSize: 14, marginTop: 20 }}>Error: {result.error}</div>}
    </div>
  );
}

// ─── RESUME ANALYZER ──────────────────────────────────────────────────────────
function ResumeAnalyzer({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const systemPrompt = `You are a professional resume reviewer and career coach. The user is a ${form_profile(user)} targeting ${user.jobTypes?.join(", ")} roles.
Analyze the resume and respond ONLY in this JSON format:
{
  "overallScore": 7,
  "summary": "Brief 2 sentence summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "missingSkills": ["skill 1", "skill 2", "skill 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "atsScore": 65,
  "formatFeedback": "Brief feedback on formatting"
}`;

      const raw = await callClaudeWithDoc(base64, "application/pdf", "Analyze this resume thoroughly.", systemPrompt);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#fff", marginBottom: 8, letterSpacing: "-1px" }}>📄 Resume Analyzer</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 32 }}>Upload your PDF resume for an instant AI-powered review and improvement suggestions.</p>

      <div style={{ ...S.card(), marginBottom: 20 }}>
        <label style={S.label}>Upload Resume (PDF)</label>
        <div
          style={{ border: "2px dashed rgba(255,255,255,0.12)", borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setFile(f); }}
          onClick={() => document.getElementById("resume-upload").click()}
          onMouseEnter={e => e.currentTarget.style.borderColor = AMBER}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            {file ? file.name : "Drag & drop your PDF or click to browse"}
          </p>
          <input id="resume-upload" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
        </div>
      </div>

      <button onClick={analyze} disabled={!file || loading} style={S.btn(`linear-gradient(135deg, ${AMBER}, #f97316)`, {
        width: "100%", padding: "16px", fontSize: 16, opacity: (!file || loading) ? 0.5 : 1, cursor: (!file || loading) ? "not-allowed" : "pointer"
      })}>
        {loading ? "⏳ Analyzing Resume..." : "🔍 Analyze My Resume"}
      </button>

      {result && !result.error && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard label="Overall Score" value={`${result.overallScore}/10`} color={AMBER} />
            <StatCard label="ATS Score" value={`${result.atsScore}%`} color={ACCENT} />
          </div>

          {result.summary && (
            <div style={{ ...S.card(), marginBottom: 16 }}>
              <label style={{ ...S.label, marginBottom: 8 }}>Summary</label>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.7 }}>{result.summary}</p>
            </div>
          )}

          {/* FIX: mobile responsive minmax */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={S.card()}>
              <label style={{ ...S.label, color: GREEN, marginBottom: 10 }}>✅ Strengths</label>
              {result.strengths?.map((s, i) => <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>• {s}</p>)}
            </div>
            <div style={S.card()}>
              <label style={{ ...S.label, color: "#f87171", marginBottom: 10 }}>⚠️ Weaknesses</label>
              {result.weaknesses?.map((w, i) => <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>• {w}</p>)}
            </div>
          </div>

          <div style={{ ...S.card({ border: `1px solid ${AMBER}30` }), marginBottom: 16 }}>
            <label style={{ ...S.label, color: AMBER, marginBottom: 10 }}>🎯 Missing Skills to Add</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.missingSkills?.map((s, i) => <span key={i} style={S.tag(AMBER)}>{s}</span>)}
            </div>
          </div>

          <div style={S.card()}>
            <label style={{ ...S.label, color: PURPLE, marginBottom: 10 }}>💡 Improvement Suggestions</label>
            {result.improvements?.map((imp, i) => <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{i + 1}. {imp}</p>)}
          </div>

          {result.formatFeedback && (
            <div style={{ ...S.card({ border: `1px solid ${TEAL}30` }), marginTop: 14 }}>
              <label style={{ ...S.label, color: TEAL, marginBottom: 8 }}>📐 Format Feedback</label>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6 }}>{result.formatFeedback}</p>
            </div>
          )}
        </div>
      )}
      {result?.error && <div style={{ ...S.card({ border: "1px solid #f87171" }), color: "#f87171", fontFamily: "'DM Sans', sans-serif", fontSize: 14, marginTop: 20 }}>Error: {result.error}</div>}
    </div>
  );
}

// ─── JD MATCHER ───────────────────────────────────────────────────────────────
function JDMatcher({ user }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!resumeFile || !jdText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const base64 = await fileToBase64(resumeFile);
      const systemPrompt = `You are an expert ATS and career coach. Analyze this resume against the job description.
Respond ONLY in this JSON format:
{
  "matchScore": 72,
  "summary": "2 sentence summary",
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "missingSkills": ["skill1", "skill2"],
  "tailoredImprovements": ["improvement 1", "improvement 2", "improvement 3"],
  "coverLetterTip": "One key tip for the cover letter"
}`;

      const raw = await callClaudeWithDoc(
        base64,
        "application/pdf",
        `Job Description:\n${jdText}\n\nAnalyze the match between this resume and job description.`,
        systemPrompt
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(cleaned));
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const score = result?.matchScore || 0;
  const scoreColor = score >= 75 ? GREEN : score >= 50 ? AMBER : "#f87171";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#fff", marginBottom: 8, letterSpacing: "-1px" }}>🎯 Resume vs Job Description</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 32 }}>Upload your resume and paste a job description to see how well you match.</p>

      {/* FIX: mobile responsive minmax */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div style={S.card()}>
          <label style={S.label}>Upload Resume (PDF)</label>
          <div
            style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", marginTop: 8 }}
            onClick={() => document.getElementById("jd-resume").click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = PINK}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{resumeFile ? resumeFile.name : "Click to upload"}</p>
            <input id="jd-resume" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setResumeFile(e.target.files[0])} />
          </div>
        </div>
        <div style={S.card()}>
          <label style={S.label}>Job Description</label>
          <textarea style={{ ...S.input({ marginTop: 8 }), minHeight: 110, resize: "vertical" }} value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the full job description here..." />
        </div>
      </div>

      <button onClick={analyze} disabled={!resumeFile || !jdText.trim() || loading} style={S.btn(`linear-gradient(135deg, ${PINK}, ${PURPLE})`, {
        width: "100%", padding: "16px", fontSize: 16, opacity: (!resumeFile || !jdText.trim() || loading) ? 0.5 : 1, cursor: (!resumeFile || !jdText.trim() || loading) ? "not-allowed" : "pointer"
      })}>
        {loading ? "⏳ Matching..." : "🎯 Analyze Match"}
      </button>

      {result && !result.error && (
        <div style={{ marginTop: 28 }}>
          <div style={{ ...S.card({ border: `1px solid ${scoreColor}30`, background: `${scoreColor}08` }), textAlign: "center", marginBottom: 20, padding: 32 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 72, color: scoreColor, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 15, marginTop: 8 }}>Resume Match Score</div>
            <div style={{ marginTop: 12, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`, borderRadius: 99, transition: "width 1s ease" }} />
            </div>
            {result.summary && <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 16, lineHeight: 1.6 }}>{result.summary}</p>}
          </div>

          {/* FIX: mobile responsive minmax */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={{ ...S.card({ border: `1px solid ${GREEN}30` }) }}>
              <label style={{ ...S.label, color: GREEN, marginBottom: 10 }}>✅ Matched Keywords</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.matchedKeywords?.map((k, i) => <span key={i} style={S.tag(GREEN)}>{k}</span>)}
              </div>
            </div>
            <div style={{ ...S.card({ border: "1px solid rgba(248,113,113,0.3)" }) }}>
              <label style={{ ...S.label, color: "#f87171", marginBottom: 10 }}>❌ Missing Keywords</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.missingKeywords?.map((k, i) => <span key={i} style={S.tag("#f87171")}>{k}</span>)}
              </div>
            </div>
          </div>

          <div style={{ ...S.card({ border: `1px solid ${PINK}30` }), marginBottom: 16 }}>
            <label style={{ ...S.label, color: PINK, marginBottom: 10 }}>🛠️ Tailored Improvements</label>
            {result.tailoredImprovements?.map((imp, i) => (
              <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{i + 1}. {imp}</p>
            ))}
          </div>

          {result.coverLetterTip && (
            <div style={{ ...S.card({ border: `1px solid ${ACCENT}30`, background: `${ACCENT}08` }) }}>
              <label style={{ ...S.label, color: ACCENT, marginBottom: 8 }}>✉️ Cover Letter Tip</label>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6 }}>{result.coverLetterTip}</p>
            </div>
          )}
        </div>
      )}
      {result?.error && <div style={{ ...S.card({ border: "1px solid #f87171" }), color: "#f87171", fontFamily: "'DM Sans', sans-serif", fontSize: 14, marginTop: 20 }}>Error: {result.error}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, sessions }) {
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.score || 0), 0) / sessions.length) : 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#fff", letterSpacing: "-0.5px" }}>
            Welcome back, {user.name?.split(" ")[0]}! 👋
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            {user.education} • {user.experience} • {user.jobTypes?.slice(0, 2).join(", ")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Sessions Done" value={sessions.length} color={ACCENT} />
        <StatCard label="Avg AI Score" value={sessions.length ? `${avgScore}/10` : "—"} color={PURPLE} />
        <StatCard label="Best Score" value={sessions.length ? `${Math.max(...sessions.map(s => s.score || 0))}/10` : "—"} color={GREEN} />
        <StatCard label="Target Roles" value={user.jobTypes?.length || 0} color={PINK} />
      </div>

      {/* Profile summary — FIX: mobile responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={S.card()}>
          <label style={{ ...S.label, marginBottom: 12, fontSize: 14 }}>👤 Your Profile</label>
          {[
            ["Name", user.name],
            ["Education", user.education],
            ["Experience", user.experience],
            ["Location", user.location || "—"],
            ["Goal", user.goal || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{k}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={S.card()}>
          <label style={{ ...S.label, marginBottom: 12, fontSize: 14 }}>🎯 Target Roles</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {user.jobTypes?.map(j => <span key={j} style={S.tag(ACCENT)}>{j}</span>)}
          </div>
          {user.skills && (
            <>
              <label style={{ ...S.label, marginTop: 16, marginBottom: 8, fontSize: 14 }}>🛠️ Your Skills</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.skills.split(",").map(s => s.trim()).filter(Boolean).map(s => <span key={s} style={S.tag(TEAL)}>{s}</span>)}
              </div>
            </>
          )}
        </div>
      </div>

      {sessions.length > 0 ? (
        <div style={S.card()}>
          <label style={{ ...S.label, marginBottom: 16, fontSize: 14 }}>📊 Session History</label>
          {sessions.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500 }}>{s.question || "Voice Analysis"}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 2 }}>{s.date}</p>
              </div>
              <div style={{ ...S.tag(s.score >= 7 ? GREEN : s.score >= 5 ? AMBER : "#f87171"), fontSize: 14, fontWeight: 700 }}>
                {s.score}/10
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...S.card({ textAlign: "center", padding: 48 }) }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>No sessions yet</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Use the Voice or Resume tools to start building your performance history.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...S.card({ border: `1px solid ${color}20`, background: `${color}08` }), textAlign: "center" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{label}</div>
    </div>
  );
}

function form_profile(user) {
  if (!user) return "job seeker";
  return `${user.education || ""} graduate with ${user.experience || "some experience"}`.trim();
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // FIX: Persist user + sessions in localStorage so data survives page refresh
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("interviewai_user")) || null; } catch { return null; }
  });
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("interviewai_sessions")) || []; } catch { return []; }
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [activeView, setActiveView] = useState(user ? "dashboard" : "landing");

  // Keep localStorage in sync
  useEffect(() => {
    if (user) localStorage.setItem("interviewai_user", JSON.stringify(user));
  }, [user]);
  useEffect(() => {
    localStorage.setItem("interviewai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const handleGetStarted = () => setShowOnboarding(true);
  const handleWatchDemo = () => setShowDemo(true);

  const handleOnboardComplete = (form) => {
    setUser(form);
    setShowOnboarding(false);
    setActiveView("dashboard");
  };

  const handleNav = (view) => {
    if (!user && view !== "landing") {
      setShowOnboarding(true);
      return;
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080812; }
        select option { background: #1a1a2e; color: #fff; }
        textarea, input, select { color: #fff !important; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080812; }
        ::-webkit-scrollbar-thumb { background: rgba(79,142,247,0.3); border-radius: 99px; }
        @media (max-width: 480px) {
          .two-col-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: "#080812", minHeight: "100vh", color: "#fff" }}>
        <Navbar user={user} onNav={handleNav} />

        {showOnboarding && <OnboardingModal onComplete={handleOnboardComplete} />}
        {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

        <div style={{ paddingTop: activeView === "landing" ? 0 : 68 }}>
          {activeView === "landing" && (
            <Landing onGetStarted={handleGetStarted} onWatchDemo={handleWatchDemo} />
          )}
          {activeView === "dashboard" && user && <Dashboard user={user} sessions={sessions} />}
          {activeView === "voice" && user && (
            <VoiceEvalTool user={user} onResult={(r) => {
              if (r?.score) setSessions(prev => [...prev, { question: r.question, score: r.score, date: new Date().toLocaleDateString() }]);
            }} />
          )}
          {activeView === "resume" && user && <ResumeAnalyzer user={user} />}
          {activeView === "jd" && user && <JDMatcher user={user} />}
        </div>
      </div>
    </>
  );
}
