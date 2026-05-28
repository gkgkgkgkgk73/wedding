const memoryStore = [];

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function validateRsvp(payload) {
  const errors = [];

  if (!["groom", "bride"].includes(payload.side)) {
    errors.push("side");
  }

  if (!payload.name || typeof payload.name !== "string") {
    errors.push("name");
  }

  if (!["attend", "absent"].includes(payload.attendance)) {
    errors.push("attendance");
  }

  return errors;
}

async function saveRsvp(payload) {
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    side: payload.side,
    name: payload.name.trim(),
    group: payload.group || "",
    count: Number(payload.count || 1),
    attendance: payload.attendance,
    submittedAt: payload.submittedAt || new Date().toISOString()
  };

  memoryStore.push(record);

  return record;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
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
  } catch {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Unable to save RSVP" }));
  }
};
