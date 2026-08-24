<template>
  <div class="app-container">
    <el-card shadow="never" class="crypto-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">🔐 在线国密与通用加解密工具箱</span>
            <el-tag type="success" effect="light" class="tag">Java 9202 后端 Hutool/BouncyCastle 驱动</el-tag>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="crypto-tabs" type="border-card">
        <!-- 标签 1：对称加解密 (SM4 / AES) -->
        <el-tab-pane label="对称加解密 (SM4 / AES)" name="symmetric">
          <el-form :model="symForm" label-width="130px" style="max-width: 850px; margin-top: 16px">
            <el-form-item label="加密算法">
              <el-radio-group v-model="symForm.algorithm">
                <el-radio value="SM4-CBC">国密 SM4-CBC</el-radio>
                <el-radio value="SM4-ECB">国密 SM4-ECB</el-radio>
                <el-radio value="AES-CBC">AES-CBC (128/256位)</el-radio>
                <el-radio value="AES-ECB">AES-ECB</el-radio>
                <el-radio value="AES-CTR">AES-CTR</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="输出/输入格式">
              <el-radio-group v-model="symForm.format">
                <el-radio value="BASE64">Base64 字符串</el-radio>
                <el-radio value="HEX">16进制 Hex</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="密钥 (Key)">
              <el-input v-model="symForm.key" placeholder="请输入 16 或 32 位加解密密钥" clearable />
            </el-form-item>

            <el-form-item v-if="symForm.algorithm.includes('CBC') || symForm.algorithm.includes('CTR')" label="向量 (IV)">
              <el-input v-model="symForm.iv" placeholder="CBC / CTR 模式可选向量 IV (留空则复用密钥)" clearable />
            </el-form-item>

            <el-form-item label="输入文本">
              <el-input v-model="symForm.text" type="textarea" :rows="4" placeholder="请输入待加密明文或待解密密文" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="Lock" :loading="symLoading" @click="doSymEncrypt">调用后端加密</el-button>
              <el-button type="success" icon="Unlock" :loading="symLoading" @click="doSymDecrypt">调用后端解密</el-button>
              <el-button icon="Delete" @click="clearSym">清空</el-button>
            </el-form-item>

            <el-form-item label="后端计算结果">
              <el-input v-model="symResult" type="textarea" :rows="4" readonly placeholder="计算结果将在此处展示" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 标签 2：哈希与摘要计算 (MD5 / SHA / SM3) -->
        <el-tab-pane label="哈希与摘要计算 (MD5 / SHA / SM3)" name="hash">
          <el-form :model="hashForm" label-width="130px" style="max-width: 850px; margin-top: 16px">
            <el-form-item label="原始数据">
              <el-input v-model="hashForm.text" type="textarea" :rows="3" placeholder="请输入待计算哈希的原始文本" @input="doHashCalc" />
            </el-form-item>

            <el-form-item label="可选加盐 (Salt)">
              <el-input v-model="hashForm.salt" placeholder="可选 Salt 字符串" @input="doHashCalc" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="hashLoading" @click="doHashCalc">重新计算全部摘要</el-button>
            </el-form-item>

            <el-form-item label="国密 SM3 (64位)">
              <el-input v-model="hashResult.sm3" readonly />
            </el-form-item>
            <el-form-item label="MD5 (32位)">
              <el-input v-model="hashResult.md5" readonly />
            </el-form-item>
            <el-form-item label="SHA-256 (64位)">
              <el-input v-model="hashResult.sha256" readonly />
            </el-form-item>
            <el-form-item label="SHA-1 (40位)">
              <el-input v-model="hashResult.sha1" readonly />
            </el-form-item>
            <el-form-item label="SHA-512 (128位)">
              <el-input v-model="hashResult.sha512" readonly />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 标签 3：非对称加解密与签名 (SM2 / RSA) -->
        <el-tab-pane label="非对称与数字签名 (SM2 / RSA)" name="asymmetric">
          <el-form :model="asymForm" label-width="130px" style="max-width: 850px; margin-top: 16px">
            <el-form-item label="算法类型">
              <el-radio-group v-model="asymForm.algorithm" @change="fetchKeyPair">
                <el-radio value="SM2">国密 SM2 椭圆曲线</el-radio>
                <el-radio value="RSA">RSA (2048位)</el-radio>
              </el-radio-group>
              <el-button type="warning" link style="margin-left: 20px" :loading="asymLoading" @click="fetchKeyPair">
                🔄 生成全新密钥对
              </el-button>
            </el-form-item>

            <el-form-item label="公钥 (Public Key)">
              <el-input v-model="asymForm.publicKey" type="textarea" :rows="3" placeholder="Base64 格式公钥 (用于加密或验签)" />
            </el-form-item>

            <el-form-item label="私钥 (Private Key)">
              <el-input v-model="asymForm.privateKey" type="textarea" :rows="3" placeholder="Base64 格式私钥 (用于解密或签名)" />
            </el-form-item>

            <el-form-item label="操作文本">
              <el-input v-model="asymForm.text" type="textarea" :rows="3" placeholder="请输入明文、密文或待签名文本" />
            </el-form-item>

            <el-form-item label="签名值 (Signature)">
              <el-input v-model="asymForm.signature" type="textarea" :rows="2" placeholder="签名计算输出或验签输入值" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="Lock" :loading="asymLoading" @click="doAsymEncrypt">公钥加密</el-button>
              <el-button type="success" icon="Unlock" :loading="asymLoading" @click="doAsymDecrypt">私钥解密</el-button>
              <el-button type="warning" icon="DocumentChecked" :loading="asymLoading" @click="doAsymSign">私钥签名</el-button>
              <el-button type="info" icon="CircleCheck" :loading="asymLoading" @click="doAsymVerify">公钥验签</el-button>
            </el-form-item>

            <el-form-item label="后端处理结果">
              <el-input v-model="asymResult" type="textarea" :rows="3" readonly placeholder="非对称操作结果展示" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  encryptSymmetricApi,
  decryptSymmetricApi,
  calculateHashApi,
  generateKeyPairApi,
  encryptAsymmetricApi,
  decryptAsymmetricApi,
  signApi,
  verifyApi,
} from '@/api/modules/cryptoApi';

const activeTab = ref('symmetric');
const symLoading = ref(false);
const hashLoading = ref(false);
const asymLoading = ref(false);

const symResult = ref('');
const asymResult = ref('');

const symForm = reactive({
  algorithm: 'SM4-CBC',
  format: 'BASE64',
  key: 'AGY_SECRET_KEY26',
  iv: 'AGY_IV_VECTOR_26',
  text: 'Hello GreatMap AGY 2026',
});

const hashForm = reactive({
  text: 'agy-util-service-2026',
  salt: '',
});

const hashResult = reactive({
  md5: '',
  sha1: '',
  sha256: '',
  sha512: '',
  sm3: '',
});

const asymForm = reactive({
  algorithm: 'SM2',
  publicKey: '',
  privateKey: '',
  text: 'GreatMap AGY Platform Signature Demo',
  signature: '',
});

async function doSymEncrypt() {
  if (!symForm.text) {
    ElMessage.warning('请输入待加密文本！');
    return;
  }
  symLoading.value = true;
  try {
    const res = await encryptSymmetricApi(symForm);
    symResult.value = (res as any)?.data || (res as any);
    ElMessage.success('后端对称加密成功！');
  } catch (e: any) {
    ElMessage.error(e.message || '加密失败');
  } finally {
    symLoading.value = false;
  }
}

async function doSymDecrypt() {
  if (!symForm.text) {
    ElMessage.warning('请输入待解密密文！');
    return;
  }
  symLoading.value = true;
  try {
    const res = await decryptSymmetricApi(symForm);
    symResult.value = (res as any)?.data || (res as any);
    ElMessage.success('后端对称解密成功！');
  } catch (e: any) {
    ElMessage.error(e.message || '解密失败，请检查密钥与密文');
  } finally {
    symLoading.value = false;
  }
}

function clearSym() {
  symForm.text = '';
  symResult.value = '';
}

async function doHashCalc() {
  if (!hashForm.text) {
    Object.assign(hashResult, { md5: '', sha1: '', sha256: '', sha512: '', sm3: '' });
    return;
  }
  hashLoading.value = true;
  try {
    const res = await calculateHashApi(hashForm);
    const data = (res as any)?.data || (res as any);
    Object.assign(hashResult, data);
  } catch (e: any) {
    console.error('哈希计算失败', e);
  } finally {
    hashLoading.value = false;
  }
}

async function fetchKeyPair() {
  asymLoading.value = true;
  try {
    const res = await generateKeyPairApi(asymForm.algorithm);
    const data = (res as any)?.data || (res as any);
    asymForm.publicKey = data.publicKey;
    asymForm.privateKey = data.privateKey;
    ElMessage.success(`生成全新 ${asymForm.algorithm} 密钥对成功！`);
  } catch (e: any) {
    ElMessage.error(e.message || '密钥对生成失败');
  } finally {
    asymLoading.value = false;
  }
}

async function doAsymEncrypt() {
  if (!asymForm.text || !asymForm.publicKey) {
    ElMessage.warning('请输入明文并提供公钥！');
    return;
  }
  asymLoading.value = true;
  try {
    const res = await encryptAsymmetricApi(asymForm);
    asymResult.value = (res as any)?.data || (res as any);
    ElMessage.success('非对称加密成功！');
  } catch (e: any) {
    ElMessage.error(e.message || '非对称加密失败');
  } finally {
    asymLoading.value = false;
  }
}

async function doAsymDecrypt() {
  if (!asymForm.text || !asymForm.privateKey) {
    ElMessage.warning('请输入密文并提供私钥！');
    return;
  }
  asymLoading.value = true;
  try {
    const res = await decryptAsymmetricApi(asymForm);
    asymResult.value = (res as any)?.data || (res as any);
    ElMessage.success('非对称解密成功！');
  } catch (e: any) {
    ElMessage.error(e.message || '非对称解密失败，请检查私钥');
  } finally {
    asymLoading.value = false;
  }
}

async function doAsymSign() {
  if (!asymForm.text || !asymForm.privateKey) {
    ElMessage.warning('请输入签名文本并提供私钥！');
    return;
  }
  asymLoading.value = true;
  try {
    const res = await signApi(asymForm);
    const signature = (res as any)?.data || (res as any);
    asymForm.signature = signature;
    asymResult.value = `[签名值 Signature]:\n${signature}`;
    ElMessage.success('数字签名生成成功！');
  } catch (e: any) {
    ElMessage.error(e.message || '签名失败');
  } finally {
    asymLoading.value = false;
  }
}

async function doAsymVerify() {
  if (!asymForm.text || !asymForm.publicKey || !asymForm.signature) {
    ElMessage.warning('验签需要输入原始文本、公钥与签名值！');
    return;
  }
  asymLoading.value = true;
  try {
    const res = await verifyApi(asymForm);
    const passed = (res as any)?.data ?? (res as any);
    if (passed) {
      asymResult.value = '✅ 验签通过 (Signature Valid): 签名真实合法且数据未被篡改！';
      ElMessage.success('签名校验通过！');
    } else {
      asymResult.value = '❌ 验签未通过 (Signature Invalid): 签名不匹配或数据已被篡改！';
      ElMessage.error('签名校验未通过！');
    }
  } catch (e: any) {
    ElMessage.error(e.message || '验签执行失败');
  } finally {
    asymLoading.value = false;
  }
}

onMounted(() => {
  doHashCalc();
  fetchKeyPair();
});
</script>

<style scoped>
.app-container {
  padding: 16px;
}
.crypto-card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title {
  font-size: 16px;
  font-weight: bold;
}
.crypto-tabs {
  margin-top: 10px;
}
</style>
