import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "https://applysmart-backend-oihx.onrender.com";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) setToken(saved);
  }, []);

  const handleAuth = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setAuthBusy(true);
    try {
      const endpoint = isSignup ? "/signup" : "/login";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await readResponse(response);
      if (isSignup) {
        setNotice("Account created. Sign in to continue.");
        setIsSignup(false);
      } else if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setPassword("");
      } else {
        throw new Error(data.error || "Could not sign in. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Unable to reach ApplySmart. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setAnalysis(null);
    setError("");
    setNotice("");
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setNotice("");
    setAnalysis(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file to extract your resume text.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    const request = new XMLHttpRequest();
    setUploading(true);
    setUploadProgress(0);
    request.open("POST", `${API_URL}/upload-resume`);
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.upload.addEventListener("progress", (progressEvent) => {
      if (progressEvent.lengthComputable) {
        setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      let data = {};
      try { data = JSON.parse(request.responseText); } catch { /* handled below */ }
      if (request.status >= 200 && request.status < 300 && typeof data.text === "string") {
        setResumeText(data.text);
        setNotice("Resume text extracted. Review and edit it before analysis.");
      } else {
        setError(data.error || `Resume upload failed (${request.status || "network error"}).`);
      }
      setUploading(false);
    });
    request.addEventListener("error", () => {
      setError("Could not reach the server. Check your connection and try again.");
      setUploading(false);
    });
    request.addEventListener("abort", () => {
      setError("The upload was cancelled.");
      setUploading(false);
    });
    request.send(formData);
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (analyzing || !resumeText.trim() || !jobDescription.trim()) return;
    setAnalyzing(true);
    setError("");
    setNotice("");
    setAnalysis(null);
    try {
      const response = await fetch(`${API_URL}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      setAnalysis(await readResponse(response));
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Clipboard access is unavailable. Select and copy the text manually.");
    }
  };

  const copyAll = () => {
    const text = analysis?.bullets?.map((bullet) => bullet.rewritten).join("\n");
    if (text) copyText(text, "all");
  };

  const canAnalyze = Boolean(token && resumeText.trim() && jobDescription.trim() && !analyzing && !uploading);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ApplySmart home">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ApplySmart</span>
        </a>
        {token ? (
          <button className="button button-quiet" type="button" onClick={handleLogout}>Sign out</button>
        ) : (
          <a className="topbar-link" href="#account">{isSignup ? "Have an account? Sign in" : "Your account"}</a>
        )}
      </header>

      <main id="top">
        {!token ? (
          <section className="auth-layout" id="account">
            <div className="auth-copy">
              <p className="eyebrow">Resume analysis, made practical</p>
              <h1>See how your experience fits the role.</h1>
              <p className="lead">Compare your resume with a job description and get focused, editable suggestions grounded in your experience.</p>
              <div className="auth-note"><span className="note-rule" />Your resume stays yours. Review every suggestion before using it.</div>
            </div>
            <form className="auth-panel" onSubmit={handleAuth}>
              <p className="eyebrow">{isSignup ? "Create an account" : "Welcome back"}</p>
              <h2>{isSignup ? "Get started" : "Sign in to continue"}</h2>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <label className="field-label" htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
              {error && <p className="message message-error" role="alert">{error}</p>}
              {notice && <p className="message message-success" role="status">{notice}</p>}
              <button className="button button-primary button-full" type="submit" disabled={authBusy}>
                {authBusy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              </button>
              <p className="auth-switch">
                {isSignup ? "Already registered?" : "New to ApplySmart?"}{" "}
                <button className="text-button" type="button" onClick={() => { setIsSignup(!isSignup); setError(""); setNotice(""); }}>
                  {isSignup ? "Sign in" : "Create an account"}
                </button>
              </p>
            </form>
          </section>
        ) : (
          <>
            <section className="page-intro">
              <p className="eyebrow">ApplySmart · Resume workspace</p>
              <h1>Find the fit. Strengthen your story.</h1>
              <p className="lead">Add your resume and a target job description to see relevant skills and clear, evidence-based rewrites.</p>
            </section>

            <form className="workspace" onSubmit={handleAnalyze}>
              <section className="input-section" aria-labelledby="resume-heading">
                <div className="section-heading">
                  <span className="step-number">01</span>
                  <div><h2 id="resume-heading">Your resume</h2><p>Upload a PDF or paste your text. You can edit it before analysis.</p></div>
                </div>
                <div className="upload-row">
                  <input ref={fileInput} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={handleUpload} aria-label="Choose a resume PDF" />
                  <button className="button button-outline" type="button" disabled={uploading} onClick={() => fileInput.current?.click()}>
                    {uploading ? "Uploading PDF…" : "Choose a PDF"}
                  </button>
                  <span className="helper-text">PDF only · up to 5 MB</span>
                </div>
                {uploading && (
                  <div className="progress-wrap" role="status" aria-live="polite">
                    <div className="progress-label"><span>Uploading and extracting text</span><span>{uploadProgress}%</span></div>
                    <progress value={uploadProgress} max="100" aria-label="PDF upload progress" />
                  </div>
                )}
                <label className="field-label" htmlFor="resume-text">Resume text</label>
                <textarea id="resume-text" className="large-textarea" rows="10" value={resumeText} onChange={(event) => { setResumeText(event.target.value); setAnalysis(null); }} placeholder="Paste your resume text here, or upload a PDF above…" />
                <div className="character-count">{resumeText.length.toLocaleString()} characters</div>
              </section>

              <section className="input-section" aria-labelledby="jd-heading">
                <div className="section-heading">
                  <span className="step-number">02</span>
                  <div><h2 id="jd-heading">Target job description</h2><p>Include the role requirements so the comparison stays specific.</p></div>
                </div>
                <label className="field-label" htmlFor="job-description">Job description</label>
                <textarea id="job-description" className="large-textarea jd-textarea" rows="10" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setAnalysis(null); }} placeholder="Paste the job description here…" />
                <div className="character-count">{jobDescription.length.toLocaleString()} characters</div>
              </section>

              {error && <p className="message message-error form-message" role="alert">{error}</p>}
              {notice && <p className="message message-success form-message" role="status">{notice}</p>}
              <div className="analyze-row">
                <p>We’ll compare the role requirements with details present in your resume.</p>
                <button className="button button-primary analyze-button" type="submit" disabled={!canAnalyze}>
                  {analyzing ? <><span className="spinner" aria-hidden="true" />Analyzing…</> : "Analyze match"}
                </button>
              </div>
            </form>

            {analysis && (
              <section className="results" aria-labelledby="results-heading" aria-live="polite">
                <div className="results-heading-row">
                  <div><p className="eyebrow">Your analysis</p><h2 id="results-heading">A closer look at the match</h2></div>
                  {analysis.bullets?.length > 0 && <button className="button button-outline" type="button" onClick={copyAll}>{copied === "all" ? "Copied all bullets" : "Copy all rewrites"}</button>}
                </div>
                <div className="score-panel">
                  <div className="score-value"><strong>{analysis.matchScore}</strong><span>/ 100</span></div>
                  <div className="score-copy"><h3>Resume match score</h3><p>A directional comparison of the skills and experience described in your resume and the role.</p></div>
                  <div className="score-meter" role="img" aria-label={`Match score ${analysis.matchScore} out of 100`}><span style={{ width: `${analysis.matchScore}%` }} /></div>
                </div>
                <div className="skills-grid">
                  <div className="skills-group"><h3>Matched skills</h3>
                    {analysis.matchedSkills?.length ? <div className="skill-list">{analysis.matchedSkills.map((skill, index) => <span className="skill-tag skill-matched" key={`${skill}-${index}`}>{skill}</span>)}</div> : <p className="empty-copy">No clear matches identified.</p>}
                  </div>
                  <div className="skills-group"><h3>Skills to address</h3>
                    {analysis.missingSkills?.length ? <div className="skill-list">{analysis.missingSkills.map((skill, index) => <span className="skill-tag skill-missing" key={`${skill}-${index}`}>{skill}</span>)}</div> : <p className="empty-copy">No missing skills identified.</p>}
                  </div>
                </div>
                <div className="bullet-results-heading"><div><p className="eyebrow">Resume edits</p><h3>Suggested bullet rewrites</h3></div><span>{analysis.bullets?.length || 0} suggestions</span></div>
                {analysis.bullets?.length ? (
                  <div className="bullet-list">{analysis.bullets.map((bullet, index) => (
                    <article className="bullet-card" key={`${bullet.original}-${index}`}>
                      <div className="bullet-card-top"><span className="bullet-index">Suggestion {String(index + 1).padStart(2, "0")}</span><button className="copy-button" type="button" onClick={() => copyText(bullet.rewritten, `bullet-${index}`)}>{copied === `bullet-${index}` ? "Copied" : "Copy rewrite"}</button></div>
                      <div className="bullet-comparison">
                        <div><p className="bullet-label">Original</p><p className="bullet-text original-text">{bullet.original}</p></div>
                        <div><p className="bullet-label">Suggested rewrite</p><p className="bullet-text rewritten-text">{bullet.rewritten}</p></div>
                      </div>
                      <p className="reason-text"><strong>Why this helps</strong>{bullet.reason}</p>
                      {bullet.flagged && <p className="number-warning" role="note">{bullet.flagReason || "Contains a number not in your original resume. Verify before using."}</p>}
                    </article>
                  ))}</div>
                ) : <p className="empty-state">No bullet rewrites were returned. Your resume may not contain bullet-style experience details.</p>}
              </section>
            )}
          </>
        )}
      </main>
      <footer className="footer"><span>ApplySmart</span><span>Thoughtful preparation for your next application.</span></footer>
    </div>
  );
}

export default App;
