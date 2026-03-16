const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function fetchUsers() {
  return request('/users')
}

export function fetchKickHistory() {
  return request('/kicks')
}

export function fetchStudentPlans() {
  return request('/plans')
}

export function signupUser(payload) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginUser(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function forgotPasswordUser(payload) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createKick(payload, token) {
  return request('/kicks', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function updateStudentPlan(studentEmail, payload, token) {
  return request(`/plans/${encodeURIComponent(studentEmail)}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function updateStudentCoachPreference(studentEmail, coachEmail, token) {
  return request(`/students/${encodeURIComponent(studentEmail)}/coach`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ coachEmail }),
  })
}

export function updateStudentProfile(payload, token) {
  return request('/students/profile', {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function fetchCoachTodaySessions(token) {
  return request('/sessions/today', {
    method: 'GET',
    headers: getAuthHeaders(token),
  })
}

export function createCoachSession(payload, token) {
  return request('/sessions', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function fetchPendingReviews(token) {
  return request('/reviews/pending', {
    method: 'GET',
    headers: getAuthHeaders(token),
  })
}

export function createReview(payload, token) {
  return request('/reviews', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function fetchBootstrap() {
  return Promise.all([fetchUsers(), fetchKickHistory(), fetchStudentPlans()]).then(
    ([users, kicks, plans]) => ({
      users,
      kicks,
      plans,
    }),
  )
}
