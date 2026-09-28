const hex = (a: Uint8Array) =>
  Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
export async function hashPin(
  pin: string,
  salt = hex(crypto.getRandomValues(new Uint8Array(16))),
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: Uint8Array.from(salt.match(/.{2}/g)!, (b) => parseInt(b, 16)),
      iterations: 200000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return { hash: hex(new Uint8Array(bits)), salt };
}
export async function verifyPin(pin: string, hash: string, salt: string) {
  const next = (await hashPin(pin, salt)).hash;
  let diff = next.length ^ hash.length;
  for (let i = 0; i < next.length; i++)
    diff |= next.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}
