import { useState } from "react";
import Authority from "./Authority";

const API = "http://localhost:8081/api/complaints";
const STEPS = ["SUBMITTED", "UNDER_REVIEW", "RESOLVED"];
const STEP_LABELS = ["Received", "Under review", "Resolved"];

const EMPTY_FORM = {
  harassmentType: "Verbal",
  incidentDate: "",
  location: "",
  description: "",
  personInvolved: "",
};

function Public() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submittedId, setSubmittedId] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadOk, setUploadOk] = useState(false);

  const [checkId, setCheckId] = useState("");
  const [found, setFound] = useState(null);
  const [checkError, setCheckError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmittedId("");
    setUploadMsg("");
    setFile(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setSubmittedId(data.complaintId);
      setForm(EMPTY_FORM);
    } catch {
      setError("We could not send your complaint. Check your connection and try again.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadOk(false);
      setUploadMsg("Choose a file first.");
      return;
    }
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch(`${API}/${submittedId}/evidence`, {
        method: "POST",
        body: data,
      });
      const result = await res.json().catch(() => ({}));
      setUploadOk(res.ok);
      setUploadMsg(res.ok ? "Evidence uploaded." : result.message || "The upload failed. Try again.");
    } catch {
      setUploadOk(false);
      setUploadMsg("We could not reach the server. Try again.");
    }
  };

  const handleCheck = async () => {
    setFound(null);
    setCheckError("");
    try {
      const res = await fetch(`${API}/${checkId.trim()}`);
      if (res.status === 404) {
        setCheckError("No complaint matches that ID. Check it and try again.");
        return;
      }
      setFound(await res.json());
    } catch {
      setCheckError("We could not reach the server. Try again.");
    }
  };

  const reached = found ? STEPS.indexOf(found.status) : -1;

  return (
    <main className="page">
      <div className="hero">
        <h1>You can report this safely</h1>
        <p>
          No name and no account. Tell us what happened, and you will get a
          private complaint ID to follow it up.
        </p>
      </div>

      <div className="layout">
        <section className="panel">
          <h2>Report an incident</h2>
          <p className="sub">Share only what you are comfortable with.</p>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label>Type of harassment</label>
                <select name="harassmentType" value={form.harassmentType}
                  onChange={handleChange} className="input">
                  <option>Verbal</option>
                  <option>Physical</option>
                  <option>Cyber</option>
                  <option>Sexual</option>
                  <option>Discrimination</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Date of incident</label>
                <input type="date" name="incidentDate" value={form.incidentDate}
                  max={new Date().toLocaleDateString("en-CA")}
                  onChange={handleChange} required className="input" />
              </div>
            </div>

            <div className="field">
              <label>Location</label>
              <input type="text" name="location" value={form.location}
                onChange={handleChange} required className="input"
                placeholder="e.g. Library, Block B" />
            </div>

            <div className="field">
              <label>What happened?</label>
              <textarea name="description" value={form.description}
                onChange={handleChange} required rows={5} className="input" />
            </div>

            <div className="field">
              <label>Person involved <span className="hint">(optional)</span></label>
              <input type="text" name="personInvolved" value={form.personInvolved}
                onChange={handleChange} className="input" />
            </div>

            <button type="submit" className="btn">Submit complaint</button>
          </form>

          {error && <div className="msg-error">{error}</div>}

          {submittedId && (
            <div className="success">
              <strong>Your complaint was received.</strong>
              <div>Save this ID. It is the only way to check your status.</div>
              <div className="id">{submittedId}</div>

              <div className="upload">
                <div className="field">
                  <label>Add evidence <span className="hint">(optional, JPG, PNG or PDF, up to 5 MB)</span></label>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="input"
                    onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <button type="button" className="btn btn-green" onClick={handleUpload}>
                  Upload evidence
                </button>
                {uploadMsg && (
                  uploadOk
                    ? <p className="msg-ok">{uploadMsg}</p>
                    : <div className="msg-error">{uploadMsg}</div>
                )}
              </div>
            </div>
          )}
        </section>

        <aside>
          <section className="panel panel-soft">
            <h2>Check your status</h2>
            <p className="sub">Enter the ID you received when you reported.</p>
            <div className="field">
              <input type="text" className="input" value={checkId}
                onChange={(e) => setCheckId(e.target.value)}
                placeholder="e.g. SS-3FBE49EB" />
            </div>
            <button onClick={handleCheck} className="btn">Check status</button>

            {checkError && <div className="msg-error">{checkError}</div>}

            {found && (
              <div style={{ marginTop: "20px" }}>
                <span className={`badge s-${found.status}`}>{STEP_LABELS[reached]}</span>
                <div className="steps">
                  {STEPS.map((s, i) => (
                    <div key={s} className={`step ${i <= reached ? "done" : ""}`}>
                      {STEP_LABELS[i]}
                    </div>
                  ))}
                </div>
                <dl className="detail">
                  <dt>ID</dt><dd>{found.complaintId}</dd>
                  <dt>Type</dt><dd>{found.harassmentType}</dd>
                  <dt>Date</dt><dd>{found.incidentDate}</dd>
                  <dt>Location</dt><dd>{found.location}</dd>
                </dl>
              </div>
            )}
          </section>

          <section className="panel panel-green">
            <h3>Your privacy</h3>
            <ul className="points">
              <li>We never ask for your name, email or phone number.</li>
              <li>Only authorised officers can read complaints.</li>
              <li>Keep your complaint ID safe, because anyone with it can see the status.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("public");
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" />
            SafeStep
          </div>
          <nav className="nav">
            <button className={page === "public" ? "active" : ""}
              onClick={() => setPage("public")}>
              Report or check status
            </button>
            <button className={page === "authority" ? "active" : ""}
              onClick={() => setPage("authority")}>
              Officer login
            </button>
          </nav>
        </div>
      </header>

      {page === "public" ? <Public /> : <Authority />}

      <footer className="footer">SafeStep. A safer way to speak up.</footer>
    </>
  );
}