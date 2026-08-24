/**
 * RSA 前端端到端密码非对称加密工具 (采用 W3C 原生 Web Crypto API，零外部依赖，硬件加速)
 */

// 默认 RSA 2048 位公钥 (优先读取环境变量 VITE_APP_RSA_PUBLIC_KEY，也可通过 /api/auth/public-key 动态覆盖)
let currentPublicKeyBase64 =
  import.meta.env.VITE_APP_RSA_PUBLIC_KEY ||
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy/mKqHqV11hE3JzX5X2E' +
  '7rZ3g2g7YlU3m9v2Y5j2U5n1x4a5d8f7e6c5b4a3Z2Y1x0w9v8u7t6s5r4q3p2o1' +
  'n0m9l8k7j6h5g4f3e2d1c0b9a8Z7Y6X5W4V3U2T1S0R9Q8P7O6N5M4L3K2J1I0H9' +
  'G8F7E6D5C4B3A2z1y0x9w8v7u6t5s4r3q2p1o0n9m8l7k6j5h4g3f2e1d0c9b8a7' +
  'Z6Y5X4W3V2U1T0S9R8Q7P6O5N4M3L2K1J0I9H8G7F6E5D4C3B2A1z0y9x8w7v6u5' +
  't4r3q2p1o0n9m8l7k6j5h4g3f2e1d0c9b8a7Z6Y5X4W3V2U1T0S9R8Q7P6O5N4wIDAQAB';

let cachedCryptoKey: CryptoKey | null = null;

export function setPublicKey(key: string) {
  if (key && key !== currentPublicKeyBase64) {
    currentPublicKeyBase64 = key;
    cachedCryptoKey = null;
  }
}

/**
 * 将 Base64 格式的 SPKI 公钥转换为 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * ArrayBuffer 转 Base64 密文
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * 获取导入的 CryptoKey 公钥对象
 */
async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }
  const binaryDer = base64ToArrayBuffer(currentPublicKeyBase64);
  cachedCryptoKey = await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
  return cachedCryptoKey;
}

/**
 * 对明文密码执行 RSA 非对称加密 (严格 Fail-Closed 故障关闭模式，加密失败抛出异常阻止提交)
 */
export async function encryptPassword(plainPassword: string): Promise<string> {
  if (!plainPassword) {
    throw new Error('密码不能为空');
  }
  try {
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      key,
      data
    );
    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('[RSA] 前端密码加密失败 (拒绝明文降级):', error);
    throw new Error('密码安全加密失败，请刷新页面重试');
  }
}
