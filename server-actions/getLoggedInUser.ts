import { getServerSession } from "next-auth/next";
import { authOptions } from "@/hooks/useAuth";

export async function getLoggedInUser() {
  // Get the current session
  const session = await getServerSession(authOptions);

  console.log("session in getLoggedInUser", session);
  if (!session?.user?.id) {
    return null;
  }

  // Ensure userId is a number
  const userId = typeof session.user.id === 'string'
    ? parseInt(session.user.id, 10)
    : Number(session.user.id);

  return {
    id: userId,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}