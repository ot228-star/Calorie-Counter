import * as ExpoCrypto from "expo-crypto";

/**
 * Supabase PKCE uses crypto.subtle.digest("SHA-256", ...). Hermes / RN often have no Web Crypto.
 * expo-crypto provides digest(); we expose minimal subtle.digest so auth-js uses S256, not plain.
 */
function bufferSourceToUint8(data: BufferSource): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export function installCryptoSubtlePolyfill(): void {
  const g = globalThis as typeof globalThis & { crypto?: Crypto & { subtle?: SubtleCrypto } };
  if (typeof g.crypto === "undefined") {
    g.crypto = {} as Crypto;
  }
  const c = g.crypto;

  if (typeof c.getRandomValues !== "function") {
    c.getRandomValues = ((array: ArrayBufferView) =>
      ExpoCrypto.getRandomValues(array as Parameters<typeof ExpoCrypto.getRandomValues>[0])) as Crypto["getRandomValues"];
  }

  if (typeof c.subtle !== "undefined") {
    return;
  }

  c.subtle = {
    digest: async (algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> => {
      const name = typeof algorithm === "string" ? algorithm : algorithm?.name;
      if (name !== "SHA-256") {
        throw new Error(`Unsupported digest algorithm: ${String(name)}`);
      }
      return ExpoCrypto.digest(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        bufferSourceToUint8(data) as Parameters<typeof ExpoCrypto.digest>[1]
      );
    }
  } as SubtleCrypto;
}

installCryptoSubtlePolyfill();
