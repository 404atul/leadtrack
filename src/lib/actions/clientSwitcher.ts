"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAgencyAdmin } from "@/lib/session";
import { SELECTED_CLIENT_COOKIE } from "@/lib/constants";

export async function setSelectedClient(clientId: string | null) {
  await requireAgencyAdmin();

  const store = cookies();
  if (clientId) {
    store.set(SELECTED_CLIENT_COOKIE, clientId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
  } else {
    store.delete(SELECTED_CLIENT_COOKIE);
  }

  revalidatePath("/admin", "layout");
}
