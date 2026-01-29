import express from "express";
import Job from "../models/Job.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const allowedStatuses = new Set(["applied", "interview", "offer", "rejected"]);

const isMongooseValidationError = (err) =>
  err?.name === "ValidationError" || err?.name === "CastError";

// POST /api/jobs
router.post("/", authMiddleware, async (req, res) => {
  try {
    // IMPORTANT: some auth middlewares use req.user._id instead of req.user.id
    const userId = req?.user?.id || req?.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user id" });
    }

    const company = (req.body?.company ?? "").toString().trim();
    const position = (req.body?.position ?? "").toString().trim();
    const notes = (req.body?.notes ?? "").toString().trim();
    const statusRaw = (req.body?.status ?? "applied").toString().trim().toLowerCase();

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

    // If mongoose validation error, return 400 with details
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

// GET /api/jobs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req?.user?.id || req?.user?._id;

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

// PUT /api/jobs/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req?.user?.id || req?.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: missing user id" });

    const { id } = req.params;

    // whitelist updates
    const updates = {};
    if (typeof req.body?.company === "string") updates.company = req.body.company.trim();
    if (typeof req.body?.position === "string") updates.position = req.body.position.trim();
    if (typeof req.body?.notes === "string") updates.notes = req.body.notes.trim();
    if (typeof req.body?.status === "string") {
      const s = req.body.status.trim().toLowerCase();
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

// DELETE /api/jobs/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req?.user?.id || req?.user?._id;
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

