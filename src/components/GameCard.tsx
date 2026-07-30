import Link from "next/link";
import { IconHeart } from "@tabler/icons-react";
import { RegionBadge } from "./RegionBadge";
import { TrustBadge } from "./TrustBadge";
import { CartridgeFormatBadge } from "./CartridgeFormatBadge";
import { LanguageTags } from "./LanguageTags";
import { parseLanguages } from "@/lib/enums";
import type { Game, GameRevision } from "@/generated/prisma/client";

export function GameCard({ game }: { game: Game & { revisions: GameRevision[]; primary: GameRevision } }) {
  const primary = game.primary;
  const languages = parseLanguages(primary.languages);
  const year = game.releaseDate ? new Date(game.releaseDate).getUTCFullYear() : null;
  const otherRevisions = game.revisions.length - 1;

  return (
    <Link
      href={`/games/${game.id}`}
      className="block rounded-xl border p-4 transition hover:shadow-sm"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-medium">{game.title}</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {game.publisher}
            {year ? ` · ${year}` : ""}
          </p>
        </div>
        <IconHeart
          size={18}
          stroke={1.75}
          style={{ color: "var(--text-muted)" }}
          aria-label="Add to wishlist (coming in a later step)"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <CartridgeFormatBadge cartridgeFormat={primary.cartridgeFormat} />
        <RegionBadge
          regionFree={primary.regionFree}
          regionOfCart={primary.regionOfCart}
          languageLockedToRegion={primary.languageLockedToRegion}
          languageCount={languages.length}
        />
        <TrustBadge dataSource={primary.dataSource} />
      </div>

      {primary.notes ? (
        <p className="mt-2.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          {primary.notes}
        </p>
      ) : (
        <div className="mt-2.5">
          <LanguageTags languages={languages} max={6} />
        </div>
      )}

      {otherRevisions > 0 && (
        <p className="mt-2.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
          +{otherRevisions} more print{otherRevisions > 1 ? "s" : ""} — compare prints
        </p>
      )}
    </Link>
  );
}
