/**
 * Firebase Functions SDK client — lazy + idempotent, same pattern as the
 * other Firebase service getters in this directory.
 *
 * Connects to the local emulator when VITE_USE_EMULATORS=true.
 */
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { getFirebaseApp } from '.';
import { env } from '@/config/env';

let functionsInstance: Functions | null = null;

export function getFirebaseFunctions(): Functions {
  if (functionsInstance) return functionsInstance;
  functionsInstance = getFunctions(getFirebaseApp(), 'europe-west1');
  if (env.useEmulators) {
    connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
  }
  return functionsInstance;
}
