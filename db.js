// Node ichki SQLite moduli (Node 22.5+) — native kompilyatsiya kerak emas
const { DatabaseSync } = require("node:sqlite");
const cfg = require("./config");

const db = new DatabaseSync(cfg.DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS subscriptions (
  chat_id TEXT PRIMARY KEY,
  emp_id  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pending (
  chat_id TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS attendance (
  emp_id    TEXT NOT NULL,
  work_date TEXT NOT NULL,
  arrival   INTEGER,
  departure INTEGER,
  PRIMARY KEY (emp_id, work_date)
);
CREATE TABLE IF NOT EXISTS noshow (
  emp_id    TEXT NOT NULL,
  work_date TEXT NOT NULL,
  PRIMARY KEY (emp_id, work_date)
);
CREATE TABLE IF NOT EXISTS breaks (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id    TEXT NOT NULL,
  work_date TEXT NOT NULL,
  out_ts    INTEGER NOT NULL,
  in_ts     INTEGER,
  warned    INTEGER DEFAULT 0
);
`);

module.exports = {
  // --- obunalar ---
  setPending: (chatId) => db.prepare("INSERT OR REPLACE INTO pending (chat_id) VALUES (?)").run(String(chatId)),
  isPending: (chatId) => !!db.prepare("SELECT 1 AS x FROM pending WHERE chat_id=?").get(String(chatId)),
  clearPending: (chatId) => db.prepare("DELETE FROM pending WHERE chat_id=?").run(String(chatId)),

  subscribe: (chatId, empId) =>
    db.prepare("INSERT OR REPLACE INTO subscriptions (chat_id, emp_id) VALUES (?, ?)").run(String(chatId), String(empId)),
  unsubscribe: (chatId) => db.prepare("DELETE FROM subscriptions WHERE chat_id=?").run(String(chatId)),
  chatsForEmployee: (empId) =>
    db.prepare("SELECT chat_id FROM subscriptions WHERE emp_id=?").all(String(empId)).map(r => r.chat_id),

  // --- davomat ---
  getAttendance: (empId, workDate) =>
    db.prepare("SELECT * FROM attendance WHERE emp_id=? AND work_date=?").get(String(empId), workDate),
  setArrival: (empId, workDate, ts) =>
    db.prepare("INSERT OR REPLACE INTO attendance (emp_id, work_date, arrival, departure) VALUES (?, ?, ?, NULL)")
      .run(String(empId), workDate, ts),
  setDeparture: (empId, workDate, ts) =>
    db.prepare("UPDATE attendance SET departure=? WHERE emp_id=? AND work_date=?").run(ts, String(empId), workDate),
  activeSession: (empId) =>
    db.prepare("SELECT * FROM attendance WHERE emp_id=? AND arrival IS NOT NULL AND departure IS NULL ORDER BY work_date DESC LIMIT 1")
      .get(String(empId)),

  // --- tanaffuslar ---
  openBreak: (empId) =>
    db.prepare("SELECT * FROM breaks WHERE emp_id=? AND in_ts IS NULL ORDER BY out_ts DESC LIMIT 1").get(String(empId)),
  lastClosedBreak: (empId) =>
    db.prepare("SELECT * FROM breaks WHERE emp_id=? AND in_ts IS NOT NULL ORDER BY in_ts DESC LIMIT 1").get(String(empId)),
  startBreak: (empId, workDate, ts) =>
    db.prepare("INSERT INTO breaks (emp_id, work_date, out_ts) VALUES (?, ?, ?)").run(String(empId), workDate, ts),
  endBreak: (id, ts) => db.prepare("UPDATE breaks SET in_ts=? WHERE id=?").run(ts, Number(id)),
  markWarned: (id) => db.prepare("UPDATE breaks SET warned=1 WHERE id=?").run(Number(id)),
  noShowSent: (empId, workDate) =>
    !!db.prepare("SELECT 1 AS x FROM noshow WHERE emp_id=? AND work_date=?").get(String(empId), workDate),
  markNoShow: (empId, workDate) =>
    db.prepare("INSERT OR IGNORE INTO noshow (emp_id, work_date) VALUES (?, ?)").run(String(empId), workDate),

  overdueBreaks: (limitMs, now) =>
    db.prepare("SELECT * FROM breaks WHERE in_ts IS NULL AND warned=0 AND ? - out_ts > ?").all(now, limitMs),
};
