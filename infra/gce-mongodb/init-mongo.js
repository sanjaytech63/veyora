/**
 * MongoDB Initialization Script
 * Runs only on the very first initialization of the database directory.
 * Creates an unprivileged application user with least-privilege readWrite roles.
 */
const dbName = process.env.MONGO_DATABASE || "veyora_prod";
const appUser = process.env.MONGO_APP_USER || "veyora_app_user";
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!appPassword) {
  throw new Error("FATAL: MONGO_APP_PASSWORD environment variable must be specified.");
}

const db = db.getSiblingDB(dbName);

db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: "readWrite", db: dbName }],
});

print(`[SUCCESS] Initialized dedicated application user '${appUser}' on database '${dbName}'.`);
