import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve(process.cwd(), '../course-pack/fall2026');
const target = resolve(process.cwd(), 'course-pack/fall2026');
await rm(target, { recursive: true, force: true });
await mkdir(resolve(process.cwd(), 'course-pack'), { recursive: true });
await cp(source, target, { recursive: true });
