import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { StateError } from './errors.js';
import { parsePetState } from './pet/pet.js';
import type { PetState } from './pet/types.js';

/** Returns undefined when no pet has hatched yet; throws StateError if the file is corrupt. */
export async function readState(path: string): Promise<PetState | undefined> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw new StateError(`Could not read ${path}: ${(error as Error).message}`);
  }
  try {
    return parsePetState(JSON.parse(text));
  } catch (error) {
    if (error instanceof StateError) throw new StateError(`${path}: ${error.message}`);
    throw new StateError(
      `${path} is not valid JSON. Fix it by hand or delete it to hatch a new pet.`,
    );
  }
}

/** Writes only when content changed so unchanged runs leave the git tree clean. */
export async function writeIfChanged(path: string, content: string): Promise<boolean> {
  try {
    if ((await readFile(path, 'utf8')) === content) return false;
  } catch {
    // missing file: fall through and create it
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  return true;
}
