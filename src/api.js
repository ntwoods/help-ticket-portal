const API_URL = import.meta.env.VITE_GAS_WEBAPP_URL || "";

// GAS Web App sometimes returns a redirect; fetch follows by default.
// Avoid custom headers to keep request "simple" and reduce CORS preflight.
export async function apiCall(action, data = {}) {
  if (!API_URL) {
    throw new Error("VITE_GAS_WEBAPP_URL missing. Please set it in .env");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action, data }),
      redirect: "follow",
      signal: controller.signal,
    });

    const txt = await res.text();
    let json;
    try {
      json = JSON.parse(txt);
    } catch {
      // Sometimes GAS wraps JSON with leading HTML in error cases
      throw new Error("Non-JSON response from server. Check Web App deployment + permissions.");
    }

    if (!json?.ok) {
      const msg = json?.error?.message || "API error";
      throw new Error(msg);
    }

    return json.data;
  } finally {
    clearTimeout(t);
  }
}
