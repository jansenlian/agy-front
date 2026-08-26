<template>
  <div class="login-container" ref="containerRef">
    <!-- Antigravity 反重力星空引力场粒子画布 -->
    <canvas ref="canvasRef" class="gravity-canvas"></canvas>

    <!-- 暗黑玻璃拟态登录卡片 -->
    <div class="login-box">
      <div class="login-header">
        <div class="logo-badge">
          <span class="logo-pulse"></span>
          <span class="logo-text">AGY</span>
        </div>
        <h2 class="title">{{ appTitle }}</h2>
        <p class="subtitle">Antigravity 极客智能空间与工程集成系统</p>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="formRef" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            show-password
            placeholder="请输入登录密码"
            prefix-icon="Lock"
            autocomplete="off"
          />
        </el-form-item>

        <el-button
          :loading="loading"
          type="primary"
          class="login-btn"
          @click="handleLogin"
        >
          <span v-if="!loading">进 入 系 统</span>
          <span v-else>正在鉴权验证...</span>
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>© 2026 Antigravity Platform · All Rights Reserved</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
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

const containerRef = ref<HTMLElement>();
const canvasRef = ref<HTMLCanvasElement>();

const loginForm = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
};

/* =========================================================================
 * Antigravity (AGY) 60FPS 丝滑高帧率星空引力场物理引擎
 * ========================================================================= */

interface StarParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulseAngle: number;
  color: string;
}

let animationFrameId: number | null = null;
const mouse = {
  x: -9999,
  y: -9999,
  isActive: false,
  radius: 180, // 鼠标引力捕获半径
};

const STAR_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#67e8f9', '#ffffff', '#93c5fd'];

function initAntigravityCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 适配 Retina 高清屏 (DevicePixelRatio)
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = window.innerWidth;
  let height = window.innerHeight;

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();

  // 最佳平衡密度 (180 ~ 240 颗),保证极致 60/120 FPS 满帧丝滑
  const particleCount = Math.min(Math.max(Math.floor((width * height) / 8000), 160), 240);
  const particles: StarParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    const radius = Math.random() * 1.8 + 0.8;
    const baseAlpha = Math.random() * 0.5 + 0.4;

    particles.push({
      x,
      y,
      originX: x,
      originY: y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius,
      baseAlpha,
      alpha: baseAlpha,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulseAngle: Math.random() * Math.PI * 2,
      color,
    });
  }

  function handleResize() {
    resizeCanvas();
  }

  function handleMouseMove(e: MouseEvent) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.isActive = true;
  }

  function handleMouseLeave() {
    mouse.isActive = false;
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      mouse.isActive = true;
    }
  }

  function handleTouchEnd() {
    handleMouseLeave();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd);

  function render() {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. 物理计算与粒子更新
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 自然微光呼吸
      p.pulseAngle += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.2;

      // 基础漂移
      p.x += p.vx;
      p.y += p.vy;

      // 边界反弹/循环
      if (p.x < 0 || p.x > width) p.vx = -p.vx;
      if (p.y < 0 || p.y > height) p.vy = -p.vy;

      // 鼠标引力场强力吸附与轨道跟随
      if (mouse.isActive) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 1) {
          const force = (mouse.radius - dist) / mouse.radius;
          const pullSpeed = force * 2.6;

          // 向心引力
          p.x += (dx / dist) * pullSpeed;
          p.y += (dy / dist) * pullSpeed;

          // 核心微弱自旋
          p.x += (-dy / dist) * force * 1.2;
          p.y += (dx / dist) * force * 1.2;

          p.alpha = Math.min(1, p.baseAlpha + force * 0.5);
        }
      }

      // 绘制星星本体 (极速原生绘制,零卡顿)
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
      ctx.fill();
    }

    // 2. 绘制星网微光连线 (粒子与粒子之间)
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 90) {
          const lineAlpha = (1 - dist / 90) * 0.28 * Math.min(p1.alpha, p2.alpha);
          ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // 3. 绘制鼠标引力光索连线 (鼠标光标与周围被吸附的星星之间)
    if (mouse.isActive) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const mouseLineAlpha = (1 - dist / mouse.radius) * 0.55;
          ctx.strokeStyle = `rgba(56, 189, 248, ${mouseLineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };
}

let cleanupCanvas: (() => void) | null = null;

onMounted(async () => {
  cleanupCanvas = initAntigravityCanvas() || null;
  try {
    const key = await getPublicKeyApi();
    if (key) {
      setPublicKey(key);
    }
  } catch (e) {
    // 降级使用本地默认 RSA 公钥
  }
});

onUnmounted(() => {
  if (cleanupCanvas) {
    cleanupCanvas();
    cleanupCanvas = null;
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
        console.warn('获取最新 RSA 公钥失败,将使用本地保底配置:', keyErr);
      }

      const encryptedPassword = await encryptPassword(loginForm.password);
      await userStore.login({
        username: loginForm.username,
        password: encryptedPassword,
      });
      ElMessage.success('登录成功!');
      const redirect = (route.query.redirect as string) || '/';
      router.push(redirect);
    } catch (e: any) {
      ElMessage.error(e.message || '登录失败,请检查账号密码');
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 30%, #0f172a 0%, #060913 70%, #020408 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}

.gravity-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.login-box {
  position: relative;
  z-index: 2;
  width: 420px;
  padding: 40px 36px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(56, 189, 248, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-box:hover {
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.7),
    0 0 50px rgba(99, 102, 241, 0.18),
    inset 0 1px 1px rgba(255, 255, 255, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 20px;
  margin-bottom: 14px;
}

.logo-pulse {
  width: 8px;
  height: 8px;
  background: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 10px #38bdf8;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

.logo-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #38bdf8;
}

.title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  letter-spacing: 0.5px;
}

:deep(.el-input__wrapper) {
  background-color: rgba(30, 41, 59, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  padding: 4px 14px !important;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(56, 189, 248, 0.5) !important;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.2) !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.35) !important;
  background-color: rgba(30, 41, 59, 0.95) !important;
}

:deep(.el-input__inner) {
  color: #f8fafc !important;
  font-size: 14px;
}

:deep(.el-input__inner::placeholder) {
  color: #64748b;
}

:deep(.el-input__prefix-inner) {
  color: #38bdf8;
  font-size: 16px;
}

.login-btn {
  width: 100%;
  height: 44px;
  margin-top: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(2, 132, 199, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.55);
}

.login-btn:active {
  transform: translateY(0);
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: #64748b;
  letter-spacing: 0.5px;
}
</style>
