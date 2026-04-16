import express from "express";
import Job from "../models/Job.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const ALLOWED_STATUSES = new Set(["applied", "interview", "offer", "rejected"]);

const isValidationLikeError = (err) =>
  err?.name === "ValidationError" || err?.name === "CastError";

const getUserId = (req) => req?.user?.id || req?.user?._id || null;

const normalizeStatus = (value) => (value ?? "applied").toString().trim().toLowerCase();

const trimString = (value) => (typeof value === "string" ? value.trim() : "");

const csvEscape = (value) => {
  const stringValue = (value ?? "").toString();
  const escaped = stringValue.replace(/"/g, '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
};

const ensureAuthorizedUser = (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
};

const buildJobUpdates = (body, requireAllFields = false) => {
  const updates = {};

  if (requireAllFields || typeof body?.company === "string") {
    updates.company = trimString(body?.company);
  }

  if (requireAllFields || typeof body?.position === "string") {
    updates.position = trimString(body?.position);
  }

  if (typeof body?.notes === "string") {
    updates.notes = trimString(body.notes);
  }

  if (typeof body?.status === "string") {
    const normalized = normalizeStatus(body.status);

    if (!ALLOWED_STATUSES.has(normalized)) {
      return {
        error: `Invalid status. Must be one of: ${Array.from(ALLOWED_STATUSES).join(", ")}`,
      };
    }

    updates.status = normalized;
  }

  if (requireAllFields) {
    if (!updates.company || !updates.position) {
      return { error: "Company and position are required" };
    }

    if (!updates.status) {
      updates.status = "applied";
    }
  }

  return { updates };
};

const handleServerError = (res, context, err, fallbackMessage) => {
  console.error(`❌ ${context}:`, err);

  if (isValidationLikeError(err)) {
    return res.status(400).json({
      error: err.message,
      details: err.errors || null,
    });
  }

  return res.status(500).json({
    error: err?.message || fallbackMessage,
  });
};

// -------------------- CSV EXPORT --------------------
// GET /api/jobs/export.csv
router.get("/export.csv", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const jobs = await Job.find({ user: userId }).sort({ createdAt: -1 });

    const headers = ["company", "position", "status", "notes", "createdAt", "updatedAt"];
    const rows = jobs.map((job) =>
      [
        csvEscape(job.company),
        csvEscape(job.position),
        csvEscape(job.status),
        csvEscape(job.notes),
        csvEscape(job.createdAt ? new Date(job.createdAt).toISOString() : ""),
        csvEscape(job.updatedAt ? new Date(job.updatedAt).toISOString() : ""),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="job-tracker-export.csv"');

    return res.status(200).send(csv);
  } catch (err) {
    return handleServerError(res, "EXPORT CSV ERROR", err, "Failed to export jobs");
  }
});

// -------------------- STATS --------------------
// GET /api/jobs/stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const jobs = await Job.find({ user: userId }).select("status createdAt updatedAt");

    const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 };

    for (const job of jobs) {
      const status = normalizeStatus(job.status);
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
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
    return handleServerError(res, "JOB STATS ERROR", err, "Failed to fetch job stats");
  }
});

// -------------------- CREATE --------------------
// POST /api/jobs
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const { updates, error } = buildJobUpdates(req.body, true);

    if (error) {
      return res.status(400).json({ error });
    }

    const job = await Job.create({
      user: userId,
      company: updates.company,
      position: updates.position,
      status: updates.status,
      notes: updates.notes || "",
    });

    return res.status(201).json(job);
  } catch (err) {
    return handleServerError(res, "CREATE JOB ERROR", err, "Failed to create job");
  }
});

// -------------------- LIST --------------------
// GET /api/jobs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const jobs = await Job.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (err) {
    return handleServerError(res, "FETCH JOBS ERROR", err, "Failed to fetch jobs");
  }
});

// -------------------- READ ONE --------------------
// GET /api/jobs/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const { id } = req.params;
    const job = await Job.findOne({ _id: id, user: userId });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(job);
  } catch (err) {
    return handleServerError(res, "FETCH JOB ERROR", err, "Failed to fetch job");
  }
});

// -------------------- UPDATE (PUT) --------------------
// PUT /api/jobs/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const { id } = req.params;
    const { updates, error } = buildJobUpdates(req.body, true);

    if (error) {
      return res.status(400).json({ error });
    }

    const updated = await Job.findOneAndUpdate(
      { _id: id, user: userId },
      {
        $set: {
          company: updates.company,
          position: updates.position,
          status: updates.status,
          notes: updates.notes || "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(updated);
  } catch (err) {
    return handleServerError(res, "UPDATE JOB ERROR", err, "Failed to update job");
  }
});

// -------------------- UPDATE (PATCH) --------------------
// PATCH /api/jobs/:id
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const { id } = req.params;
    const { updates, error } = buildJobUpdates(req.body, false);

    if (error) {
      return res.status(400).json({ error });
    }

    if (Object.keys(updates).length === 0) {
      const existingJob = await Job.findOne({ _id: id, user: userId });

      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      return res.json(existingJob);
    }

    const updated = await Job.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(updated);
  } catch (err) {
    return handleServerError(res, "PATCH JOB ERROR", err, "Failed to update job");
  }
});

// -------------------- DELETE --------------------
// DELETE /api/jobs/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = ensureAuthorizedUser(req, res);
    if (!userId) return;

    const { id } = req.params;
    const deleted = await Job.findOneAndDelete({ _id: id, user: userId });

    if (!deleted) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({
      ok: true,
      message: "Job deleted",
    });
  } catch (err) {
    return handleServerError(res, "DELETE JOB ERROR", err, "Failed to delete job");
  }
});

export default router;