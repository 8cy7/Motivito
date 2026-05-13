// validation helpers extracted from ParentAuthScreen

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.trim().length >= 8;
}

export function isValidPin(pin: string): boolean {
  return pin.length === 4 && /^\d{4}$/.test(pin);
}
