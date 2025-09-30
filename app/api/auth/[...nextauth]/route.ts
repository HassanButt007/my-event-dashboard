import NextAuth from "next-auth";
import { authOptions } from "@/hooks/useAuth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };