import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Real session-backed identity (replaces the step-4 demo-user stub). Every
// submission/vote/collection action now resolves to whoever is actually
// signed in — or null, which callers must handle as "not authenticated".
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
