import { seedDatabase } from "../src/services/seedService";

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed database:", err);
    process.exit(1);
  }
}

main();
