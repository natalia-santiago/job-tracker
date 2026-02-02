import express from "express";
import Job from "../models/Job.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const allowedStatuses = new Set(["applied", "interview", "offer", "rejected"]);

const isMongooseValidationError = (err) =>
  err?.name === "ValidationError" || err?.name === "CastError";

const getUserId = (req) => req?.user?.id || req?.user?._id;

const normalizeStatus = (val) => (val ?? "applied").toString().trim().toLowerCase();

const csvEscape = (value) => {
  const s = (value ?? "").toString();
  // Escape double quotes by doubling them
  const escaped = s.replace(/"/g, '""');
  // Wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(escaped)) return `"${escaped}"`;
  return escaped;
};

// -------------------- CSV EXPORT --------------------
// GET /api/jobs/export.csv
router.get("/export.csv", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user id" });
    }

    const jobs = await Job.find({ user: userId }).sort({ createdAt: -1 });

    const headers = ["company", "position", "status", "notes", "createdAt", "updatedAt"];
    const lines = [headers.join(",")];

    for (const j of jobs) {
      lines.push(
        [
          csvEscape(j.company),
          csvEscape(j.position),
          csvEscape(j.status),
          csvEscape(j.notes),
          csvEscape(j.createdAt ? new Date(j.createdAt).toISOString() : ""),
          csvEscape(j.updatedAt ? new Date(j.updatedAt).toISOString() : ""),
        ].join(",")
      );
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="job-tracker-export.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error("❌ EXPORT CSV ERROR:", err);
    return res.status(500).json({
      error: err?.message || "Failed to export jobs",
    });
  }
});

// -------------------- STATS (OPTIONAL, NICE FOR REAL PRODUCT) --------------------
// GET /api/jobs/stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user id" });
    }

    const jobs = await Job.find({ user: userId }).select("status createdAt updatedAt");

    const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const j of jobs) {
      const s = normalizeStatus(j.status);
      if (counts[s] !== undefined) counts[s] += 1;
    }

    const total = jobs.length;
    const active = counts.applied + counts.interview + counts.offer;
    const offerRate = total ? Math.round((counts.offer / total) * 100) : 0;

    return res.json({
      total,
      active,
      offerRate,
      counts,
    });
  } catch (err) {
    console.error("❌ JOB STATS ERROR:", err);
    return res.status(500).json({
      error: err?.message || "Failed to fetch job stats",
    });
  }
});

// -------------------- CREATE --------------------
// POST /api/jobs
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user id" });
    }

    const company = (req.body?.company ?? "").toString().trim();
    const position = (req.body?.position ?? "").toString().trim();
    const notes = (req.body?.notes ?? "").toString().trim();
    const statusRaw = normalizeStatus(req.body?.status);

    if (!company || !position) {
      return res.status(400).json({ error: "company and position are required" });
    }

    if (!allowedStatuses.has(statusRaw)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${Array.from(allowedStatuses).join(", ")}`,
      });
    }

    const job = await Job.create({
      user: userId,
      company,
      position,
      status: statusRaw,
      notes,
    });

    return res.status(201).json(job);
  } catch (err) {
    console.error("❌ CREATE JOB ERROR:", err);

    if (isMongooseValidationError(err)) {
      return res.status(400).json({
        error: err.message,
        details: err.errors || null,
      });
    }

    return res.status(500).json({
      error: err?.message || "Failed to create job",
    });
  }
});

// -------------------- LIST --------------------
// GET /api/jobs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user id" });
    }

    const jobs = await Job.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (err) {
    console.error("❌ FETCH JOBS ERROR:", err);
    return res.status(500).json({
      error: err?.message || "Failed to fetch jobs",
    });
  }
});

// -------------------- READ ONE (OPTIONAL) --------------------
// GET /api/jobs/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized: missing user id" });

    const { id } = req.params;

    const job = await Job.findOne({ _id: id, user: userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    return res.json(job);
  } catch (err) {
    console.error("❌ FETCH JOB ERROR:", err);

    if (isMongooseValidationError(err)) {
      return res.status(400).json({ error: err.message, details: err.errors || null });
    }

    return res.status(500).json({ error: err?.message || "Failed to fetch job" });
  }
});

// -------------------- UPDATE (PUT) --------------------
// PUT /api/jobs/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized: missing user id" });

    const { id } = req.params;

    // whitelist updates
    const updates = {};
    if (typeof req.body?.company === "string") updates.company = req.body.company.trim();
    if (typeof req.body?.position === "string") updates.position = req.body.position.trim();
    if (typeof req.body?.notes === "string") updates.notes = req.body.notes.trim();
    if (typeof req.body?.status === "string") {
      const s = normalizeStatus(req.body.status);
      if (!allowedStatuses.has(s)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Array.from(allowedStatuses).join(", ")}`,
        });
      }
      updates.status = s;
    }

    const updated = await Job.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Job not found" });
    return res.json(updated);
  } catch (err) {
    console.error("❌ UPDATE JOB ERROR:", err);

    if (isMongooseValidationError(err)) {
      return res.status(400).json({ error: err.message, details: err.errors || null });
    }

    return res.status(500).json({ error: err?.message || "Failed to update job" });
  }
});

// -------------------- UPDATE (PATCH) --------------------
// PATCH /api/jobs/:id
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized: missing user id" });

    const { id } = req.params;

    // whitelist updates (same as PUT)
    const updates = {};
    if (typeof req.body?.company === "string") updates.company = req.body.company.trim();
    if (typeof req.body?.position === "string") updates.position = req.body.position.trim();
    if (typeof req.body?.notes === "string") updates.notes = req.body.notes.trim();

    if (typeof req.body?.status === "string") {
      const s = normalizeStatus(req.body.status);
      if (!allowedStatuses.has(s)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Array.from(allowedStatuses).join(", ")}`,
        });
      }
      updates.status = s;
    }

    // If nothing to update, return the existing job (or 400)
    if (Object.keys(updates).length === 0) {
      const job = await Job.findOne({ _id: id, user: userId });
      if (!job) return res.status(404).json({ error: "Job not found" });
      return res.json(job);
    }

    const updated = await Job.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Job not found" });
    return res.json(updated);
  } catch (err) {
    console.error("❌ PATCH JOB ERROR:", err);

    if (isMongooseValidationError(err)) {
      return res.status(400).json({ error: err.message, details: err.errors || null });
    }

    return res.status(500).json({ error: err?.message || "Failed to update job" });
  }
});

// -------------------- DELETE --------------------
// DELETE /api/jobs/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized: missing user id" });

    const { id } = req.params;

    const deleted = await Job.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) return res.status(404).json({ error: "Job not found" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ DELETE JOB ERROR:", err);
    return res.status(500).json({ error: err?.message || "Failed to delete job" });
  }
});

export default router;