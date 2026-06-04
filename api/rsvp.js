const { sql } = require("@vercel/postgres");

const ALLOWED_ORIGINS = new Set([
  "https://wedding-gilt-ten.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
]);

String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .forEach((origin) => ALLOWED_ORIGINS.add(origin));

const MAX_BODY_BYTES = 10 * 1024;
const MAX_NAME_LENGTH = 30;
const MAX_GROUP_LENGTH = 50;
const MAX_GUEST_COUNT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const rateLimitStore = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let isTooLarge = false;

    req.on("data", (chunk) => {
      if (isTooLarge) {
        return;
      }

      body += chunk;

      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        isTooLarge = true;
        const error = new Error("Request body too large");
        error.statusCode = 413;
        reject(error);
      }
    });

    req.on("end", () => {
      if (isTooLarge) {
        return;
      }

      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function isAllowedOrigin(origin) {
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  record.count += 1;
  rateLimitStore.set(ip, record);

  return record.count > RATE_LIMIT_MAX_REQUESTS;
}

function validateRsvp(payload) {
  const errors = [];

  if (payload.website) {
    errors.push("website");
  }

  if (!["groom", "bride"].includes(payload.side)) {
    errors.push("side");
  }

  if (
    !payload.name ||
    typeof payload.name !== "string" ||
    !payload.name.trim() ||
    payload.name.trim().length > MAX_NAME_LENGTH
  ) {
    errors.push("name");
  }

  if (payload.group && String(payload.group).trim().length > MAX_GROUP_LENGTH) {
    errors.push("group");
  }

  if (!["attend", "absent"].includes(payload.attendance)) {
    errors.push("attendance");
  }

  const count = Number(payload.count || 1);

  if (!Number.isInteger(count) || count < 1 || count > MAX_GUEST_COUNT) {
    errors.push("count");
  }

  return errors;
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      side TEXT NOT NULL,
      name TEXT NOT NULL,
      guest_group TEXT NOT NULL DEFAULT '',
      count INTEGER NOT NULL,
      attendance TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function saveRsvp(payload) {
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    side: payload.side,
    name: payload.name.trim(),
    group: String(payload.group || "").trim(),
    count: Number(payload.count || 1),
    attendance: payload.attendance,
    submittedAt: payload.submittedAt || new Date().toISOString()
  };

  await ensureTable();

  await sql`
    INSERT INTO rsvps (id, side, name, guest_group, count, attendance, submitted_at)
    VALUES (
      ${record.id},
      ${record.side},
      ${record.name},
      ${record.group},
      ${record.count},
      ${record.attendance},
      ${record.submittedAt}
    )
  `;

  return record;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;

  if (!isAllowedOrigin(origin)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (isRateLimited(req)) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Too many requests" }));
    return;
  }

  try {
    const payload = await readBody(req);
    const errors = validateRsvp(payload);

    if (errors.length > 0) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Validation failed", fields: errors }));
      return;
    }

    const record = await saveRsvp(payload);
    res.statusCode = 201;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, id: record.id }));
  } catch (error) {
    res.statusCode = error && error.statusCode ? error.statusCode : 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Unable to save RSVP" }));
  }
};
