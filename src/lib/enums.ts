export const REGION_FREE_VALUES = ["REGION_FREE", "REGION_LOCKED", "UNKNOWN"] as const;
export type RegionFree = (typeof REGION_FREE_VALUES)[number];

export const CART_REGION_VALUES = ["US", "EU", "JP", "ASIA", "OTHER"] as const;
export type CartRegion = (typeof CART_REGION_VALUES)[number];

export const DATA_SOURCE_VALUES = [
  "SCRAPED",
  "COMMUNITY_VERIFIED",
  "UNVERIFIED_SUBMISSION",
] as const;
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

export const CARTRIDGE_FORMAT_VALUES = ["FULL_CARTRIDGE", "GAME_KEY_CARD", "DIGITAL_ONLY"] as const;
export type CartridgeFormat = (typeof CARTRIDGE_FORMAT_VALUES)[number];

export const PLATFORM_VALUES = ["SWITCH_1", "SWITCH_2", "SWITCH_2_EDITION"] as const;
export type Platform = (typeof PLATFORM_VALUES)[number];

export const CART_REGION_LABELS: Record<CartRegion, string> = {
  US: "US",
  EU: "EU",
  JP: "JP",
  ASIA: "Asia",
  OTHER: "Other",
};

export const REGION_FREE_LABELS: Record<RegionFree, string> = {
  REGION_FREE: "Region-free",
  REGION_LOCKED: "Region-locked",
  UNKNOWN: "Unknown",
};

export const CARTRIDGE_FORMAT_LABELS: Record<CartridgeFormat, string> = {
  FULL_CARTRIDGE: "Full cartridge",
  GAME_KEY_CARD: "Game-Key Card",
  DIGITAL_ONLY: "Digital only",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  SWITCH_1: "Switch",
  SWITCH_2: "Switch 2",
  SWITCH_2_EDITION: "Switch 2 Edition",
};

export function parseLanguages(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
