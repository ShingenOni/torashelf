"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ComponentProps } from "react";
import { VotePanel } from "@/components/VotePanel";
import { CollectionControl } from "@/components/CollectionControl";
import { ReportButton } from "@/components/ReportButton";

type Vote = "CONFIRM" | "DISPUTE";
type Status = "OWNED" | "WISHLIST" | "CONSIDERING_IMPORT";

type ViewerState = {
  ready: boolean;
  signedIn: boolean;
  votes: Record<string, Vote>;
  collection: Record<string, Status>;
};

const initialState: ViewerState = { ready: false, signedIn: false, votes: {}, collection: {} };

const ViewerContext = createContext<{ state: ViewerState; refresh: () => void }>({
  state: initialState,
  refresh: () => {},
});

// Loads the viewer's own votes/collection for this game in the browser, so
// the game page itself stays a cached copy shared by every visitor.
export function GameViewerProvider({ gameId, children }: { gameId: string; children: React.ReactNode }) {
  const [state, setState] = useState<ViewerState>(initialState);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${encodeURIComponent(gameId)}/viewer`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setState(
          data
            ? { ready: true, signedIn: !!data.signedIn, votes: data.votes ?? {}, collection: data.collection ?? {} }
            : { ...initialState, ready: true },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ ...initialState, ready: true });
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, version]);

  return <ViewerContext.Provider value={{ state, refresh }}>{children}</ViewerContext.Provider>;
}

type VoteProps = Omit<ComponentProps<typeof VotePanel>, "currentVote" | "isSignedIn" | "onChange">;

export function ViewerVotePanel(props: VoteProps) {
  const { state, refresh } = useContext(ViewerContext);

  // Counts only until we know who's viewing, so signed-in users don't see a
  // brief "Sign in to vote" flash.
  if (!state.ready) {
    return (
      <div className="mt-3 border-t pt-3 text-[12px]" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        {props.confirms} confirm{props.confirms === 1 ? "" : "s"} · {props.disputes} dispute
        {props.disputes === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <VotePanel
      {...props}
      currentVote={state.votes[props.gameRevisionId] ?? null}
      isSignedIn={state.signedIn}
      onChange={refresh}
    />
  );
}

export function ViewerCollectionControl({ gameRevisionId }: { gameRevisionId: string }) {
  const { state, refresh } = useContext(ViewerContext);
  if (!state.ready) return null;
  return (
    <CollectionControl
      gameRevisionId={gameRevisionId}
      status={state.collection[gameRevisionId] ?? null}
      isSignedIn={state.signedIn}
      onChange={refresh}
    />
  );
}

export function ViewerReportButton({ gameRevisionId }: { gameRevisionId: string }) {
  const { state } = useContext(ViewerContext);
  if (!state.ready) return null;
  return <ReportButton gameRevisionId={gameRevisionId} isSignedIn={state.signedIn} />;
}
