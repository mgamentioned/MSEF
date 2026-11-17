const API = "http://127.0.0.1:8000";

async function request(path, { method = "GET", body, form, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
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

// login
export const requestCode = (email) =>
  request("/auth/request-code", { method: "POST", body: { email } });

export const verifyCode = (email, code) =>
  request("/auth/verify", { method: "POST", body: { email, code } });

export const getMe = (token) => request("/auth/me", { token });

// invites
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

// student profile
export const getProfile = (token) => request("/profile/me", { token });

export const saveProfile = (token, body) =>
  request("/profile/me", { method: "PUT", body, token });

// mentor profile
export const getMentorProfile = (token) => request("/mentor-profile/me", { token });

export const saveMentorProfile = (token, body) =>
  request("/mentor-profile/me", { method: "PUT", body, token });

// mentor photo
export const photoSrc = (path) => (path ? API + path : null);

export const getMentorPhoto = (token) =>
  request("/mentor-profile/me/photo", { token });

export const uploadMentorPhoto = (token, file) => {
  const form = new FormData();
  form.append("file", file);
  return request("/mentor-profile/me/photo", { method: "PUT", form, token });
};

export const deleteMentorPhoto = (token) =>
  request("/mentor-profile/me/photo", { method: "DELETE", token });

// mentor availability
export const getAvailability = (token) => request("/availability/me", { token });

export const saveAvailability = (token, body) =>
  request("/availability/me", { method: "PUT", body, token });

export const getMentorSlots = (token, mentorId) =>
  request(`/availability/mentors/${mentorId}/slots`, { token });
