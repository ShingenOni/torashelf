import { parseLanguages } from "@/lib/enums";

export type ImportAssessment = { safe: boolean; reason: string };

// Powers the collection dashboard's "safe to import" vs "language-locked to
// my region" call-out for owned prints — the whole reason this app exists.
export function assessOwnedRevision(
  revision: { regionFree: string; regionOfCart: string; languages: string },
  user: { homeRegion: string; preferredLanguages: string },
): ImportAssessment {
  const languages = parseLanguages(revision.languages);
  const preferred = parseLanguages(user.preferredLanguages);
  const hasPreferredLanguage = languages.some((l) => preferred.includes(l));

  if (revision.regionFree === "REGION_LOCKED" && revision.regionOfCart !== user.homeRegion) {
    return {
      safe: false,
      reason: `Region-locked ${revision.regionOfCart} cart — may not boot on a console bought in ${user.homeRegion}.`,
    };
  }
  if (revision.regionFree === "UNKNOWN") {
    return { safe: false, reason: "Region-free status isn't confirmed yet — treat this as a risky import." };
  }
  if (!hasPreferredLanguage) {
    return {
      safe: false,
      reason: `Only supports ${languages.join(", ") || "unconfirmed languages"} — none of your preferred languages.`,
    };
  }
  return { safe: true, reason: "Region-free (or matches your region) and includes a language you read." };
}
