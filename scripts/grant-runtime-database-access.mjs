import { PrismaClient } from "@prisma/client";

const runtimeUser = process.env.RUNTIME_DATABASE_USER;

if (!runtimeUser || !/^[a-z_][a-z0-9_]{0,62}$/.test(runtimeUser)) {
  throw new Error(
    "RUNTIME_DATABASE_USER must be a valid lowercase PostgreSQL role name.",
  );
}

const database = new PrismaClient();
const quotedRuntimeUser = `"${runtimeUser}"`;

try {
  await database.$executeRawUnsafe(
    `GRANT USAGE ON SCHEMA public TO ${quotedRuntimeUser}`,
  );
  await database.$executeRawUnsafe(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quotedRuntimeUser}`,
  );
  await database.$executeRawUnsafe(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quotedRuntimeUser}`,
  );
  await database.$executeRawUnsafe(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${quotedRuntimeUser}`,
  );
  await database.$executeRawUnsafe(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${quotedRuntimeUser}`,
  );
} finally {
  await database.$disconnect();
}
