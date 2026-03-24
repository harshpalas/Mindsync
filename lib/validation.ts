export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function emailLookupQuery(email: string): { email: { $regex: string; $options: string } } {
  const normalizedEmail = normalizeEmail(email)
  return {
    email: {
      $regex: `^${escapeRegex(normalizedEmail)}$`,
      $options: "i",
    },
  }
}

export function validateEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
}

export function validateName(name: string): { valid: boolean; message?: string } {
  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters" }
  }

  if (trimmedName.length > 80) {
    return { valid: false, message: "Name must be at most 80 characters" }
  }

  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must include at least one uppercase letter" }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must include at least one lowercase letter" }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one number" }
  }

  return { valid: true }
}
