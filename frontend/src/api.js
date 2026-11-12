const API = "http://127.0.0.1:8000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const error = new Error(
      typeof detail === "string" ? detail : "Please check what you entered."
    );
    error.status = res.status;
    throw error;
  }
  return data;
}

export const requestCode = (email) =>
  request("/auth/request-code", { method: "POST", body: { email } });

export const verifyCode = (email, code) =>
  request("/auth/verify", { method: "POST", body: { email, code } });

export const getMe = (token) => request("/auth/me", { token });

export const listInvites = (token) => request("/invites", { token });

export const createInvite = (token, body) =>
  request("/invites", { method: "POST", body, token });

export const checkInvite = (inviteToken) =>
  request(`/invites/check/${encodeURIComponent(inviteToken)}`);

export const joinWithInvite = (inviteToken, email) =>
  request("/invites/join", {
    method: "POST",
    body: { token: inviteToken, email },
  });
