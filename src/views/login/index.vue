<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2 class="title">{{ appTitle }}</h2>
        <p class="subtitle">基于 Vue 3.5 + Vite 6 + Element Plus</p>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="formRef" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" prefix-icon="Lock" />
        </el-form-item>

        <el-button :loading="loading" type="primary" class="login-btn" @click="handleLogin">
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { encryptPassword, setPublicKey } from '@/utils/rsa';
import { getPublicKeyApi } from '@/api/modules/authApi';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const appTitle = import.meta.env.VITE_APP_TITLE || 'AGY 工具集成系统';
const formRef = ref<FormInstance>();
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

onMounted(async () => {
  try {
    const key = await getPublicKeyApi();
    if (key) {
      setPublicKey(key);
    }
  } catch (e) {
    // 自动降级使用内置默认 RSA 密钥
  }
});

async function handleLogin() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      try {
        const key = await getPublicKeyApi();
        if (key) {
          setPublicKey(key);
        }
      } catch (keyErr) {
        console.warn('获取最新 RSA 公钥失败，将使用本地保底配置:', keyErr);
      }

      const encryptedPassword = await encryptPassword(loginForm.password);
      await userStore.login({
        username: loginForm.username,
        password: encryptedPassword,
      });
      ElMessage.success('登录成功！');
      const redirect = (route.query.redirect as string) || '/';
      router.push(redirect);
    } catch (e: any) {
      ElMessage.error(e.message || '登录失败，请检查账号密码');
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
}
.title {
  font-size: 24px;
  color: #1e3c72;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 13px;
  color: #666;
}
.login-btn {
  width: 100%;
  margin-top: 10px;
  font-weight: bold;
}
</style>
