// Users who sign up within the first N accounts get a permanent "early
// adopter" badge — set once at signup and never recomputed, so it stays
// true for that user even as the site grows well past this threshold.
export const EARLY_ADOPTER_THRESHOLD = 350;

// Whether magic-link emails actually get sent (Resend) or just printed to
// the server console (local dev, or prod if the key is ever unset).
export const EMAIL_DELIVERY_ENABLED = Boolean(process.env.RESEND_API_KEY);
