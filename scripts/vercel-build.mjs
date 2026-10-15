import { execFileSync } from "node:child_process";
import process from "node:process";

const directDatabaseUrl = process.env.DATABASE_POSTGRES_URL_NON_POOLING;
if (!directDatabaseUrl) {
  throw new Error(
    "DATABASE_POSTGRES_URL_NON_POOLING is required to safely apply PostgreSQL migrations during Vercel builds.",
  );
}

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error("Run this script with npm so the project dependencies are available.");
}

execFileSync(
  process.execPath,
  [npmCli, "exec", "--", "prisma", "migrate", "deploy"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directDatabaseUrl },
  },
);

execFileSync(process.execPath, [npmCli, "run", "build"], {
  stdio: "inherit",
  env: process.env,
});
