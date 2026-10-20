const labels = { focus: "Time to focus", short: "Take a short break", long: "Take a long break" };
let cfg = { focus: 25, short: 5, long: 15 };
let stats = { todaySessions: 0, todayMinutes: 0, totalSessions: 0 };
let done = 0, mode = "focus", left = 0, end = 0, timer = null;

const $ = id => document.getElementById(id);
const C = 2 * Math.PI * 54;
$("bar").style.strokeDasharray = C;

// ---------- API helpers ----------
async function api(url, method = "GET", body) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    return await res.json();
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

async function loadAll() {
  cfg = (await api("/api/settings")) || cfg;
  stats = (await api("/api/stats")) || stats;
  done = stats.todaySessions;
  ["focus", "short", "long"].forEach(k => ($("s-" + k).value = cfg[k]));
  setMode("focus");
}

// ---------- Timer ----------
const total = () => cfg[mode] * 60;

function render() {
  const m = Math.floor(left / 60), s = left % 60;
  const t = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  $("time").textContent = t;
  document.title = (timer ? t + " · " : "") + "Pomodoro";
  $("bar").style.strokeDashoffset = C * (1 - left / total());
  $("label").textContent = labels[mode];
  $("go").textContent = timer ? "Pause" : "Start";
  document.querySelectorAll("#tabs button").forEach(b =>
    b.classList.toggle("on", b.dataset.m === mode));
  $("dots").innerHTML =
    "Today: " + stats.todaySessions + " sessions (" + stats.todayMinutes + " min) " +
    "🍅".repeat(Math.min(stats.todaySessions, 8)) +
    "<br>All time: " + stats.totalSessions + " focus sessions";
}

function stop() { clearInterval(timer); timer = null; }
function setMode(m) { stop(); mode = m; left = total(); render(); }

function beep() {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach(d => {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.frequency.value = 880; g.gain.value = 0.15;
      o.start(a.currentTime + d); o.stop(a.currentTime + d + 0.15);
    });
  } catch (e) {}
}

async function finish() {
  stop(); beep();
  await api("/api/sessions", "POST", { mode, minutes: cfg[mode] });
  stats = (await api("/api/stats")) || stats;
  if (mode === "focus") {
    done++;
    setMode(done % 4 === 0 ? "long" : "short");
  } else {
    setMode("focus");
  }
}

function tick() {
  left = Math.max(0, Math.round((end - Date.now()) / 1000));
  render();
  if (left <= 0) finish();
}

// ---------- Events ----------
$("go").onclick = () => {
  if (timer) { stop(); render(); return; }
  end = Date.now() + left * 1000;
  timer = setInterval(tick, 250);
  render();
};
$("reset").onclick = () => setMode(mode);
$("skip").onclick = () => {
  stop();
  setMode(mode === "focus" ? ((done + 1) % 4 === 0 ? "long" : "short") : "focus");
};
document.querySelectorAll("#tabs button").forEach(b => (b.onclick = () => setMode(b.dataset.m)));

["focus", "short", "long"].forEach(k => {
  const el = $("s-" + k);
  el.onchange = async () => {
    const v = Math.min(+el.max, Math.max(1, parseInt(el.value) || cfg[k]));
    el.value = v;
    cfg[k] = v;
    await api("/api/settings", "PUT", cfg);
    if (!timer && k === mode) { left = total(); render(); }
  };
});

loadAll();
