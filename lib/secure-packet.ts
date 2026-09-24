// Ephemeral packet scrambler for network obscurity, payload privacy & anti-inspection.
// Works identically across Node.js (API routes) and Browser (Client components).

const SALT_MASK = "ChateloSecNet_v2_9f7a8b3c1d4e";

export function packPayload(data: unknown): string {
  try {
    const jsonStr = JSON.stringify(data);
    const salt = Math.random().toString(36).slice(2, 8);
    const combinedKey = salt + SALT_MASK;

    // Convert string to UTF-8 bytes
    const utf8Bytes: number[] = [];
    for (let i = 0; i < jsonStr.length; i++) {
      let charCode = jsonStr.charCodeAt(i);
      if (charCode < 0x80) {
        utf8Bytes.push(charCode);
      } else if (charCode < 0x800) {
        utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
      } else if (charCode < 0xd800 || charCode >= 0xe000) {
        utf8Bytes.push(
          0xe0 | (charCode >> 12),
          0x80 | ((charCode >> 6) & 0x3f),
          0x80 | (charCode & 0x3f)
        );
      } else {
        // Surrogate pair
        i++;
        charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (jsonStr.charCodeAt(i) & 0x3ff));
        utf8Bytes.push(
          0xf0 | (charCode >> 18),
          0x80 | ((charCode >> 12) & 0x3f),
          0x80 | ((charCode >> 6) & 0x3f),
          0x80 | (charCode & 0x3f)
        );
      }
    }

    // XOR with dynamic combined key
    const scrambled = utf8Bytes.map((byte, idx) => {
      const k = combinedKey.charCodeAt(idx % combinedKey.length);
      return byte ^ k;
    });

    // Convert to binary string
    let binary = "";
    for (let i = 0; i < scrambled.length; i++) {
      binary += String.fromCharCode(scrambled[i]);
    }

    // Base64 encode
    const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
    return `${salt}.${b64}`;
  } catch {
    return "";
  }
}

export function unpackPayload<T>(packet: string): T | null {
  try {
    if (!packet || typeof packet !== "string") return null;
    const parts = packet.split(".");
    if (parts.length !== 2) return null;
    const [salt, b64] = parts;
    const combinedKey = salt + SALT_MASK;

    const binary = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i++) {
      const k = combinedKey.charCodeAt(i % combinedKey.length);
      bytes.push(binary.charCodeAt(i) ^ k);
    }

    // Decode UTF-8 bytes to string
    let jsonStr = "";
    let i = 0;
    while (i < bytes.length) {
      const b1 = bytes[i++];
      if (b1 < 0x80) {
        jsonStr += String.fromCharCode(b1);
      } else if (b1 > 0xbf && b1 < 0xe0) {
        const b2 = bytes[i++];
        jsonStr += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
      } else if (b1 > 0xdf && b1 < 0xf0) {
        const b2 = bytes[i++];
        const b3 = bytes[i++];
        jsonStr += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
      } else {
        const b2 = bytes[i++];
        const b3 = bytes[i++];
        const b4 = bytes[i++];
        const code = (((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f)) - 0x10000;
        jsonStr += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
      }
    }

    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
