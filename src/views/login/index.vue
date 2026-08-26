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
 * Antigravity 反重力星空引力场物理仿真引擎 (Canvas 2D Particle Engine)
 * ========================================================================= */

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulseAngle: number;
  color: string;
  glowColor: string;
}

let animationFrameId: number | null = null;
const mouse = {
  x: -9999,
  y: -9999,
  isActive: false,
  targetRadius: 240,
};

const STAR_COLORS = [
  { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' },
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.8)' },
  { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.8)' },
  { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.8)' },
  { color: '#34d399', glow: 'rgba(52, 211, 153, 0.8)' },
];

function initAntigravityCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particleCount = Math.min(Math.floor((width * height) / 7500), 220);
  const particles: StarParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const palette = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    const size = Math.random() * 2.2 + 0.8;
    const baseAlpha = Math.random() * 0.6 + 0.3;

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: size,
      baseAlpha,
      alpha: baseAlpha,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulseAngle: Math.random() * Math.PI * 2,
      color: palette.color,
      glowColor: palette.glow,
    });
  }

  function handleResize() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
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
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
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

    // 1. 如果鼠标在屏幕上,绘制微弱的引力场光晕与引力涟漪
    if (mouse.isActive) {
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.targetRadius
      );
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
      gradient.addColorStop(0.5, 'rgba(129, 140, 248, 0.05)');
      gradient.addColorStop(1, 'rgba(10, 15, 30, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.targetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. 物理受力计算与粒子移动
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 自然微光呼吸闪烁
      p.pulseAngle += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.2;

      // 引力场物理演算
      if (mouse.isActive) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.targetRadius && dist > 1) {
          const force = (1 - dist / mouse.targetRadius) * 0.8;
          const angle = Math.atan2(dy, dx);

          // 向心引力吸附加速度
          p.vx += Math.cos(angle) * force * 0.45;
          p.vy += Math.sin(angle) * force * 0.45;

          // 核心反重力切向自旋 (Vortex Orbiting: 粒子靠近时围绕鼠标做星轨旋转)
          p.vx += -Math.sin(angle) * force * 0.35;
          p.vy += Math.cos(angle) * force * 0.35;

          // 靠近引力中心时粒子亮度增强
          p.alpha = Math.min(1, p.alpha + force * 0.5);
        }
      }

      // 摩擦阻尼与位移更新
      p.vx *= 0.95;
      p.vy *= 0.95;

      // 补充微弱随机漂移力,确保脱离引力后维持宇宙失重漂浮
      p.vx += (Math.random() - 0.5) * 0.04;
      p.vy += (Math.random() - 0.5) * 0.04;

      p.x += p.vx;
      p.y += p.vy;

      // 边界循环回弹穿透
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // 绘制单个星星与发光阴影
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
      ctx.shadowBlur = p.radius * 4;
      ctx.shadowColor = p.glowColor;
      ctx.fill();
      ctx.restore();
    }

    // 3. 星图微光星座连线 (Constellation Links)
    ctx.save();
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (dist < 85) {
          const lineAlpha = (1 - dist / 85) * 0.22 * Math.min(p1.alpha, p2.alpha);
          ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

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
