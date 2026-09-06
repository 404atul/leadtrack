import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "agency_admin" | "client_user";
      clientId: string | null;
      agencyId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "agency_admin" | "client_user";
    clientId: string | null;
    agencyId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "agency_admin" | "client_user";
    clientId: string | null;
    agencyId: string | null;
  }
}
