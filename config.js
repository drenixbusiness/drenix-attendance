require("dotenv").config();

const splitList = (s) => (s || "").split(",").map(x => x.trim()).filter(Boolean);

module.exports = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  GROUP_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  COMPANY_NAME: process.env.COMPANY_NAME || "Drenix",

  PORT: +(process.env.PORT || 8090),
  EVENT_PATH: "/hikvision/event",

  OUTSIDE_IPS: splitList(process.env.OUTSIDE_DEVICE_IPS),
  INSIDE_IPS: splitList(process.env.INSIDE_DEVICE_IPS),

  // Device admin credentials — required for the real-time alertStream connection
  DEVICE_USERNAME: process.env.DEVICE_USERNAME || "admin",
  DEVICE_HTTP_PORT: +(process.env.DEVICE_HTTP_PORT || 80),
  DEVICE_PASSWORD: process.env.DEVICE_PASSWORD || "",

  FORWARD_URLS: splitList(process.env.FORWARD_BOT_URLS),
  PERSONAL_BOT_URL: (process.env.PERSONAL_BOT_URL || "").trim(),

  DB_PATH: process.env.DB_PATH || "./attendance.db",

  SHEET: {
    id: process.env.GOOGLE_SHEET_ID || "",
    name: process.env.GOOGLE_SHEET_NAME || "Sheet1",
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },

  BREAK_LIMIT_MIN: 30,          // break limit (minutes)
  DEDUP_SECONDS: 180,           // window for ignoring repeated face scans

  // Hikvision subEventType codes — verify via events.log on first test
  FP_CODES: [38, 76],           // fingerprint authentication passed
  FACE_CODES: [75, 1, 21],      // face authentication passed

  TZ: "Asia/Tashkent",
};
