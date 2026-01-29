import express from "express";
import Application from "../models/Application.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All routes here require auth
router.use(auth);

// GET /api/apps?status=Applied
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const apps = await Application.find(filter).sort({
      appliedDate: -1,
      createdAt: -1,
    });

    return res.json({ applications: apps });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
});

// POST /api/apps
router.post("/", async (req, res) => {
  try {
    const { company, roleTitle, status, location, jobUrl, notes, appliedDate } = req.body;

    if (!company || !roleTitle) {
      return res.status(400).json({ error: "company and roleTitle are required" });
    }

    const app = await Application.create({
      userId: req.user.id,
      company,
      roleTitle,
      status,
      location,
      jobUrl,
      notes,
      appliedDate,
    });

    return res.status(201).json({ application: app });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
});

// GET /api/apps/:id
router.get("/:id", async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user.id });
    if (!app) return res.status(404).json({ error: "not found" });
    return res.json({ application: app });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
});

// PUT /api/apps/:id
router.put("/:id", async (req, res) => {
  try {
    const updates = {};
    const allowed = ["company", "roleTitle", "status", "location", "jobUrl", "notes", "appliedDate"];
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true }
    );

    if (!app) return res.status(404).json({ error: "not found" });
    return res.json({ application: app });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
});

// DELETE /api/apps/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: "not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
});

export default router;

