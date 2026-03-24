const credentialFailures = new Map<string, { count: number; lockUntil: number }>()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000

export function isCredentialsTemporarilyLocked(email: string): boolean {
  const state = credentialFailures.get(email)
  if (!state) {
    return false
  }

  const now = Date.now()
  if (now > state.lockUntil) {
    credentialFailures.delete(email)
    return false
  }

  return state.count >= MAX_FAILED_ATTEMPTS
}

export function recordCredentialFailure(email: string): void {
  const now = Date.now()
  const state = credentialFailures.get(email)

  if (!state || now > state.lockUntil) {
    credentialFailures.set(email, {
      count: 1,
      lockUntil: now + LOCKOUT_WINDOW_MS,
    })
    return
  }

  credentialFailures.set(email, {
    count: state.count + 1,
    lockUntil: now + LOCKOUT_WINDOW_MS,
  })
}

export function clearCredentialFailures(email: string): void {
  credentialFailures.delete(email)
}
