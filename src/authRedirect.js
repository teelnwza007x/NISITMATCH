// Use the same-origin callback; the hosting platform must serve index.html for this route.
export const authRedirectUrl = () => `${window.location.origin}/auth/callback`
export const isAuthCallbackPath = () => window.location.pathname.replace(/\/$/, '') === '/auth/callback'
export const clearAuthCallbackUrl = () => window.history.replaceState({}, '', '/')
