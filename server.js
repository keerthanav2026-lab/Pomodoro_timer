const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return { settings: { focus: 25, short: 5, long: 15 }, sessions: [] }; }
}
function save(d) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

// Get timer settings
app.get("/api/settings", (req, res) => res.json(load().settings));

// Update timer settings
app.put("/api/settings", (req, res) => {
  const d = load();
  for (const k of ["focus", "short", "long"]) {
    const v = parseInt(req.body[k]);
    if (v >= 1 && v <= 120) d.settings[k] = v;
  }
  save(d);
  res.json(d.settings);
});

// Log a completed session
app.post("/api/sessions", (req, res) => {
  const { mode, minutes } = req.body;
  if (!["focus", "short", "long"].includes(mode))
    return res.status(400).json({ error: "Invalid mode" });
  const d = load();
  d.sessions.push({ mode, minutes: Number(minutes) || 0, at: new Date().toISOString() });
  save(d);
  res.status(201).json({ ok: true });
});

// Stats for today and overall
app.get("/api/stats", (req, res) => {
  const d = load();
  const today = new Date().toISOString().slice(0, 10);
  const focus = d.sessions.filter(s => s.mode === "focus");
  const t = focus.filter(s => s.at.slice(0, 10) === today);
  res.json({
    todaySessions: t.length,
    todayMinutes: t.reduce((a, s) => a + s.minutes, 0),
    totalSessions: focus.length
  });
});

app.listen(PORT, () => console.log(`Pomodoro running at http://localhost:${PORT}`));
