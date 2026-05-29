import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

/**
 * Upload a document file for extraction.
 * @param {File} file
 * @returns {Promise<{job_id: string, status: string}>}
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Poll for extraction result.
 * @param {string} jobId
 * @returns {Promise<ExtractionResult>}
 */
export async function getResult(jobId) {
  const response = await api.get(`/result/${jobId}`);
  return response.data;
}

export default api;
