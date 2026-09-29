import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** permanently deletes an account; caller must hold the admin role */
export const adminDeleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!ok) throw new Response("Forbidden", { status: 403 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("id", data.profileId)
      .maybeSingle();
    if (prof?.user_id === context.userId) throw new Error("can't delete yourself");
    await supabaseAdmin.from("profiles").delete().eq("id", data.profileId);
    if (prof?.user_id) await supabaseAdmin.auth.admin.deleteUser(prof.user_id);
    return { ok: true };
  });
