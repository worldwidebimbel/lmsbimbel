import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      defaultBranchId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    defaultBranchId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    defaultBranchId?: string | null;
  }
}
