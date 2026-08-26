import request from '@/utils/request';

export interface CryptoSymmetricDTO {
  algorithm: string;
  key: string;
  iv?: string;
  text: string;
  format?: string;
}

export interface CryptoHashDTO {
  text: string;
  salt?: string;
}

export interface CryptoHashVO {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  sm3: string;
}

export interface CryptoKeyPairVO {
  algorithm: string;
  publicKey: string;
  privateKey: string;
}

export interface CryptoAsymmetricDTO {
  algorithm: string;
  publicKey?: string;
  privateKey?: string;
  text: string;
  signature?: string;
}

/**
 * 对称加密 (AES / SM4)
 */
export function encryptSymmetricApi(data: CryptoSymmetricDTO): Promise<string> {
  return request.post<any, string>('/v1/crypto/symmetric/encrypt', data);
}

/**
 * 对称解密 (AES / SM4)
 */
export function decryptSymmetricApi(data: CryptoSymmetricDTO): Promise<string> {
  return request.post<any, string>('/v1/crypto/symmetric/decrypt', data);
}

/**
 * 散列哈希摘要计算 (MD5 / SHA / SM3)
 */
export function calculateHashApi(data: CryptoHashDTO): Promise<CryptoHashVO> {
  return request.post<any, CryptoHashVO>('/v1/crypto/hash', data);
}

/**
 * 生成非对称秘钥对 (SM2 / RSA)
 */
export function generateKeyPairApi(algorithm: string = 'SM2'): Promise<CryptoKeyPairVO> {
  return request.get<any, CryptoKeyPairVO>('/v1/crypto/keypair', {
    params: { algorithm },
  });
}

/**
 * 非对称加密 (公钥加密)
 */
export function encryptAsymmetricApi(data: CryptoAsymmetricDTO): Promise<string> {
  return request.post<any, string>('/v1/crypto/asymmetric/encrypt', data);
}

/**
 * 非对称解密 (私钥解密)
 */
export function decryptAsymmetricApi(data: CryptoAsymmetricDTO): Promise<string> {
  return request.post<any, string>('/v1/crypto/asymmetric/decrypt', data);
}

/**
 * 数字签名 (私钥签名)
 */
export function signApi(data: CryptoAsymmetricDTO): Promise<string> {
  return request.post<any, string>('/v1/crypto/asymmetric/sign', data);
}

/**
 * 验证数字签名 (公钥验签)
 */
export function verifyApi(data: CryptoAsymmetricDTO): Promise<boolean> {
  return request.post<any, boolean>('/v1/crypto/asymmetric/verify', data);
}
