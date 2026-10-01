#!/usr/bin/env node
// Regenerates assets/profile.svg from live GitHub data.
// Usage: GITHUB_TOKEN=... node scripts/generate.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderProfileCard } from './cards/profile-card.mjs';
import { fetchProfileData } from './lib/github.mjs';
import { profile } from './profile.mjs';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const data = await fetchProfileData(profile.login);
const svg = renderProfileCard({ profile, data });

await mkdir(ASSETS_DIR, { recursive: true });
await writeFile(join(ASSETS_DIR, 'profile.svg'), svg);
console.log(`wrote assets/profile.svg (${(svg.length / 1024).toFixed(1)} KB)`);
