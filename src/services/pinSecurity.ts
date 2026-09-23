/**
 * PIN Security Service for School Media Vault
 * Implements Salted SHA-256 Hashing for Album PIN Protection.
 * Plaintext PINs are NEVER stored in Firestore or exposed to public clients.
 */

export function generatePinSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`school_vault_salt_${salt}_pin_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(enteredPin: string, salt?: string, expectedHash?: string): Promise<boolean> {
  if (!enteredPin || !salt || !expectedHash) return false;
  try {
    const candidateHash = await hashPin(enteredPin.trim(), salt);
    return candidateHash === expectedHash;
  } catch (e) {
    console.error('PIN verification error:', e);
    return false;
  }
}
