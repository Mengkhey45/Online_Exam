import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { db } from "@/db/client";
import { users } from "@/db/schema";

/**
 * Link a real Google login to the seeded teacher account.
 *
 * The seed inserts usr_demo with `onConflictDoNothing`, so it can't RE-link an
 * existing row — this script does the explicit update. Finds the Supabase auth
 * user by email (service-role admin API) and points usr_demo at that UID, so the
 * backend recognises your login (auth.ts matches on supabaseUserId).
 *
 * Usage: tsx src/scripts/link-login.ts <your-login-email>
 * You must have signed in with Google at least once first.
 */
async function main() {
  const email = (process.argv[2] ?? process.env.LINK_EMAIL ?? "").trim();
  if (!email) {
    console.error("Usage: tsx src/scripts/link-login.ts <your-login-email>");
    process.exit(1);
  }

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Find the auth user by email, paging through if there are many.
  let uid: string | undefined;
  for (let page = 1; page <= 20 && !uid; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) uid = found.id;
    if (data.users.length < 200) break;
  }

  if (!uid) {
    console.error(
      `No Supabase auth user for ${email}. Sign in with Google once, then re-run.`,
    );
    process.exit(1);
  }

  const updated = await db
    .update(users)
    .set({ supabaseUserId: uid })
    .where(eq(users.id, "usr_demo"))
    .returning({ id: users.id });

  if (updated.length === 0) {
    console.error("No usr_demo row found — run `npm run seed` first.");
    process.exit(1);
  }

  console.log(`✅ Linked ${email} (uid ${uid}) → usr_demo. Refresh the dashboard.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("LINK ERROR:", e instanceof Error ? e.message : e);
  process.exit(1);
});
