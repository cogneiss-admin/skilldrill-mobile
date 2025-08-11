export function isValidEmail(value: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digitsOnly = value.trim().replace(/[^0-9+]/g, "");
  return /^\+?\d{10,15}$/.test(digitsOnly);
}

export type InputType = "email" | "phone" | "unknown";

export function detectInputType(value: string): InputType {
  const trimmed = value.trim();
  if (!trimmed) return "unknown";
  if (trimmed.includes("@")) return "email";
  if (/^[A-Za-z]/.test(trimmed)) return "email";
  if (/^[+0-9]/.test(trimmed)) return "phone";
  return "unknown";
}

export function validationMessageFor(value: string): string {
  const type = detectInputType(value);
  if (type === "email") return isValidEmail(value) ? "" : "Enter a valid email address";
  if (type === "phone") return isValidPhone(value) ? "" : "Enter a valid phone number";
  if (/^[A-Za-z]/.test(value.trim())) return "Enter a valid email address";
  if (value.trim().length > 0) return "Enter a valid phone number";
  return "";
}


