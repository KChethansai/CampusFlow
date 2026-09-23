// email domain-pattern matching: plain suffix first, regex fallback.
export const emailMatchesPattern = (email, pattern) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPattern = String(pattern || '').trim();
  if (!normalizedEmail || !rawPattern) return false;

  const suffix = rawPattern.toLowerCase();
  const domain = normalizedEmail.split('@').at(-1);
  if (domain === suffix || domain.endsWith(`.${suffix}`)) return true; // plain suffix
  if (!/[^a-zA-Z0-9.\-]/.test(rawPattern)) return false; // no regex chars → no match
  try {
    return new RegExp(rawPattern, 'i').test(normalizedEmail);
  } catch {
    return false; // invalid regex never matches
  }
};
