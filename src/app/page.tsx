import { BrowseToolbar } from "@/components/BrowseToolbar";
import { GameCard } from "@/components/GameCard";
import { getBrowseGames, getPublishers } from "@/lib/games";
import { auth } from "@/auth";

function parseListParam(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw.split(",").filter(Boolean) : [];
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const publisher = Array.isArray(params.publisher) ? params.publisher[0] : params.publisher;

  const [games, publishers, session] = await Promise.all([
    getBrowseGames({
      q,
      publisher,
      regions: parseListParam(params.region),
      langs: parseListParam(params.lang),
    }),
    getPublishers(),
    auth(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Switch Region &amp; Language Database</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Region-free status and language support, per regional print.
        </p>
      </div>

      <BrowseToolbar publishers={publishers} isSignedIn={!!session?.user} />

      {games.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No games match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
