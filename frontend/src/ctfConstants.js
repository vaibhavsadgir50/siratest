/** Exact trigger (case-insensitive) opens the challenge; not sent as a normal chat line. */
export const CTF_ARM_PHRASE = 'capture the flag'

export function isCtfArmPhrase(text) {
  return String(text || '').trim().toLowerCase() === CTF_ARM_PHRASE
}
