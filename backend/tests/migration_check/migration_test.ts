import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHECK_FILES = [
  'src/prisma/schema.prisma',
  'src/server.ts',
];

const SQLITE_KEYWORDS = ['sqlite', 'dev.db', '.db'];
const POSTGRES_KEYWORDS = ['postgresql', 'neon.tech', 'DATABASE_URL'];

console.log('🚀 Starting migration check test...');

let allPassed = true;

CHECK_FILES.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${file}`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for SQLite leftovers
  SQLITE_KEYWORDS.forEach(keyword => {
    if (content.includes(keyword)) {
      console.error(`❌ Found SQLite leftover "${keyword}" in ${file}`);
      allPassed = false;
    }
  });

  // Check for Postgres presence in schema
  if (file.endsWith('.prisma')) {
    if (!content.includes('postgresql')) {
      console.error(`❌ PostgreSQL provider not found in ${file}`);
      allPassed = false;
    }
  }
});

if (allPassed) {
  console.log('✅ All migration checks passed! No SQLite leftovers found.');
  process.exit(0);
} else {
  console.log('❌ Migration check failed. Please fix the errors above.');
  process.exit(1);
}
