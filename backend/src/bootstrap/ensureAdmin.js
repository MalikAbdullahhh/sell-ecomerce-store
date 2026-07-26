import Admin from "../models/Admin.js";

/**
 * Keep the primary admin in sync with ADMIN_* env vars.
 *
 * Seed only creates the admin once. Without this, changing Vercel/local env
 * would leave the old hashed password in MongoDB forever.
 *
 * Set ADMIN_SYNC_FROM_ENV=false to disable password/email refresh on boot
 * (useful if you manage admins only from the UI).
 */
export async function ensureAdminFromEnv() {
  const email = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = String(process.env.ADMIN_NAME || "Admin").trim();

  if (!email || !password) {
    console.warn("[admin] ADMIN_EMAIL / ADMIN_PASSWORD missing — skip sync");
    return null;
  }

  const sync = process.env.ADMIN_SYNC_FROM_ENV !== "false";

  let admin = await Admin.findOne({ email });

  if (!admin) {
    // Email changed in env: update the existing superadmin / first admin instead
    // of leaving a dead login and creating a second account.
    admin =
      (await Admin.findOne({ role: "superadmin" }).sort({ createdAt: 1 })) ||
      (await Admin.findOne().sort({ createdAt: 1 }));

    if (admin) {
      admin.email = email;
      admin.name = name;
      if (sync) admin.password = password;
      admin.isActive = true;
      await admin.save();
      console.log(`[admin] Updated existing admin → ${email}`);
      return admin;
    }

    admin = await Admin.create({
      name,
      email,
      password,
      role: "superadmin",
      isActive: true,
    });
    console.log(`[admin] Created ${email}`);
    return admin;
  }

  if (sync) {
    admin.name = name;
    admin.password = password; // pre-save hook re-hashes
    admin.isActive = true;
    await admin.save();
    console.log(`[admin] Synced credentials from env for ${email}`);
  }

  return admin;
}
