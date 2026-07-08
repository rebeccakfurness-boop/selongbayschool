import { ensureSchema } from '../src/lib/db';

async function main() {
  await ensureSchema();
  console.log('Database schema is ready.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
