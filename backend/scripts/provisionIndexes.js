// Explicitly create schema-declared indexes in production without dropping data.
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const modelDir = path.resolve(here, '../models');

try {
  const files = (await readdir(modelDir)).filter((file) => file.endsWith('Model.js'));
  await Promise.all(files.map((file) => import(pathToFileURL(path.join(modelDir, file)))));
  await mongoose.connect(env.dbUrl);
  for (const name of mongoose.modelNames()) {
    await mongoose.model(name).createIndexes();
    const keys = (await mongoose.model(name).collection.indexes()).map((idx) => idx.name);
    console.log(`Indexes ensured: ${name} [${keys.join(', ')}]`);
  }
} catch (error) {
  console.error(`Index provisioning failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
