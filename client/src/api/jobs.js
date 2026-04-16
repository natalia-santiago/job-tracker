import api from "./api";

/*
  Jobs API layer
  - Keeps all job-related requests in one place
  - Returns response.data directly for cleaner usage in components
*/

// GET /jobs (supports optional query params)
export const getJobs = async (params = {}) => {
  const res = await api.get("/jobs", { params });
  return res.data;
};

// POST /jobs
export const createJob = async (data) => {
  const res = await api.post("/jobs", data);
  return res.data;
};

// PATCH /jobs/:id (partial update)
export const updateJob = async (id, data) => {
  const res = await api.patch(`/jobs/${id}`, data);
  return res.data;
};

// DELETE /jobs/:id
export const deleteJob = async (id) => {
  const res = await api.delete(`/jobs/${id}`);
  return res.data;
};