import { useState, useEffect } from "react";

const BASE = "http://localhost:8081/api";
const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "RESOLVED"];
const STATUS_LABELS = {
  SUBMITTED: "Received",
  UNDER_REVIEW: "Under review",
  RESOLVED: "Resolved",
};

export default function Authority() {
  const [officer, setOfficer] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loadError, setLoadError] = useState("");

  const loadComplaints = async () => {
    setLoadError("");
    try {
      const res = await fetch(`${BASE}/complaints`, {
        headers: { Authorization: `Bearer ${officer.token}` },
      });
      if (res.status === 401) {
        setOfficer(null);
        return;
      }
      const data = await res.json();
      setComplaints(
        [...data].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      );
    } catch {
      setLoadError("We could not load the complaints. Check that the backend is running.");
    }
  };

  useEffect(() => {
    if (officer) loadComplaints();
  }, [officer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${BASE}/authority/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      if (res.status === 401) {
        setLoginError("The username or password is incorrect.");
        return;
      }
      setOfficer(await res.json());
    } catch {
      setLoginError("We could not reach the server. Try again.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${BASE}/complaints/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${officer.token}`,
        },
        body: JSON.stringify({ status }),
      });
      loadComplaints();
    } catch {
      setLoadError("The status could not be updated. Try again.");
    }
  };

  const viewEvidence = async (id) => {
    try {
      const res = await fetch(`${BASE}/complaints/${id}/evidence`, {
        headers: { Authorization: `Bearer ${officer.token}` },
      });
      if (!res.ok) {
        alert("No evidence was found for this complaint.");
        return;
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      alert("The evidence could not be loaded.");
    }
  };

  const count = (s) => complaints.filter((c) => c.status === s).length;

  if (!officer) {
    return (
      <main className="login-wrap">
        <section className="panel">
          <h2>Officer login</h2>
          <p className="sub">Sign in to review complaints.</p>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Username</label>
              <input type="text" className="input" value={login.username} required
                onChange={(e) => setLogin({ ...login, username: e.target.value })} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" className="input" value={login.password} required
                onChange={(e) => setLogin({ ...login, password: e.target.value })} />
            </div>
            <button type="submit" className="btn">Sign in</button>
          </form>
          {loginError && <div className="msg-error">{loginError}</div>}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="dash-head">
        <div>
          <h1>Complaints</h1>
          <p>
            {officer.name}
            {officer.department ? `, ${officer.department}` : ""}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => { setOfficer(null); setComplaints([]); }}>
          Sign out
        </button>
      </div>

      <div className="stats">
        <div className="stat"><b>{complaints.length}</b><span>Total</span></div>
        <div className="stat pink"><b>{count("SUBMITTED")}</b><span>Received</span></div>
        <div className="stat green"><b>{count("UNDER_REVIEW")}</b><span>Under review</span></div>
        <div className="stat green"><b>{count("RESOLVED")}</b><span>Resolved</span></div>
      </div>

      <section className="panel">
        {loadError && <div className="msg-error" style={{ marginBottom: "14px" }}>{loadError}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Date</th>
                <th>Location</th>
                <th>Description</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.complaintId}>
                  <td className="cid">{c.complaintId}</td>
                  <td>{c.harassmentType}</td>
                  <td>{c.incidentDate}</td>
                  <td>{c.location}</td>
                  <td className="desc">{c.description}</td>
                  <td>
                    <select className={`select s-${c.status}`} value={c.status}
                      onChange={(e) => updateStatus(c.complaintId, e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {c.evidencePath ? (
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => viewEvidence(c.complaintId)}>
                        View
                      </button>
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {complaints.length === 0 && !loadError && (
          <div className="empty">No complaints yet. New reports will appear here.</div>
        )}
      </section>
    </main>
  );
}