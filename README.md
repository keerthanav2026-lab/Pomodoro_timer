# Pomodoro Timer (Node + Express)

## Run
1. Install Node.js (v18+): https://nodejs.org
2. Open this folder in your editor, then in the terminal:
   npm install
   npm start
3. Visit http://localhost:3000

## Structure
- server.js        Express backend + REST API (data saved in data.json)
- public/          Frontend (index.html, style.css, app.js)

## API
GET  /api/settings    -> {focus, short, long}
PUT  /api/settings    -> update durations
POST /api/sessions    -> log a completed session {mode, minutes}
GET  /api/stats       -> {todaySessions, todayMinutes, totalSessions}
