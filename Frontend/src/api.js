const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const getToken = () => localStorage.getItem("token");

export const api = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.[0]?.msg || data.message || "Request failed";
    throw new Error(message);
  }
  return data;
};

export { API_URL };
