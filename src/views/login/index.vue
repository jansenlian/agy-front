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
 * Google Antigravity (AGY) 官方级物理引力场仿真引擎 (True Gravitational Engine)
 * ========================================================================= */

interface StarParticle {
  x: number;
  y: number;
  z: number; // 3D 深度视差 [0.2, 1.5]
  vx: number;
  vy: number;
  baseRadius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulseAngle: number;
  color: string;
  glowColor: string;
  mass: number; // 质量影响受力加速度
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  strength: number;
  alpha: number;
}

let animationFrameId: number | null = null;
const mouse = {
  x: -9999,
  y: -9999,
  lastX: -9999,
  lastY: -9999,
  vx: 0,
  vy: 0,
  isActive: false,
  gravityRadius: 320, // 引力影响范围
  coreRadius: 28,     // 核心事件视界斥力半径(形成吸积盘光环)
};

const shockwaves: Shockwave[] = [];

// AGY 标志性星空深空色系
const STAR_PALETTES = [
  { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)' },
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.85)' },
  { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.85)' },
  { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.85)' },
  { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.8)' },
  { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.8)' },
];

function initAntigravityCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // 高密度星尘群: 根据屏幕自适应 600 ~ 1000 颗
  const particleCount = Math.min(Math.max(Math.floor((width * height) / 2200), 550), 1000);
  const particles: StarParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const palette = STAR_PALETTES[Math.floor(Math.random() * STAR_PALETTES.length)];
    const z = Math.random() * 1.3 + 0.3; // 深度
    const baseRadius = (Math.random() * 1.6 + 0.4) * z;
    const baseAlpha = (Math.random() * 0.55 + 0.35) * Math.min(1, z);

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z,
      vx: (Math.random() - 0.5) * 0.3 * z,
      vy: (Math.random() - 0.5) * 0.3 * z,
      baseRadius,
      baseAlpha,
      alpha: baseAlpha,
      pulseSpeed: Math.random() * 0.025 + 0.008,
      pulseAngle: Math.random() * Math.PI * 2,
      color: palette.color,
      glowColor: palette.glow,
      mass: Math.random() * 0.8 + 0.6,
    });
  }

  function handleResize() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function handleMouseMove(e: MouseEvent) {
    if (mouse.lastX !== -9999) {
      mouse.vx = (e.clientX - mouse.lastX) * 0.4;
      mouse.vy = (e.clientY - mouse.lastY) * 0.4;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.isActive = true;
  }

  function handleMouseLeave() {
    mouse.isActive = false;
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.lastX = -9999;
    mouse.lastY = -9999;
    mouse.vx = 0;
    mouse.vy = 0;
  }

  function handleClick(e: MouseEvent) {
    // 触发 AGY 超新星引力激波
    shockwaves.push({
      x: e.clientX,
      y: e.clientY,
      radius: 5,
      maxRadius: 360,
      speed: 12,
      strength: 22,
      alpha: 0.9,
    });
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (mouse.lastX !== -9999) {
        mouse.vx = (touch.clientX - mouse.lastX) * 0.4;
        mouse.vy = (touch.clientY - mouse.lastY) * 0.4;
      }
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      mouse.lastX = touch.clientX;
      mouse.lastY = touch.clientY;
      mouse.isActive = true;
    }
  }

  function handleTouchEnd() {
    handleMouseLeave();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('click', handleClick);
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd);

  function render() {
    if (!ctx) return;

    // 1. 半透明背景涂刷,生成丝滑运动残影 (Organic Motion Trails)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(5, 8, 17, 0.28)';
    ctx.fillRect(0, 0, width, height);

    // 鼠标速度衰减
    mouse.vx *= 0.88;
    mouse.vy *= 0.88;

    // 2. 引力波激波演算与渲染
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha *= 0.94;

      if (sw.alpha <= 0.01 || sw.radius >= sw.maxRadius) {
        shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha * 0.7})`;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#38bdf8';
      ctx.stroke();
      ctx.restore();
    }

    // 3. 启用高能增色叠加 (Additive Blending - 核心高能光子融合)
    ctx.globalCompositeOperation = 'lighter';

    // 鼠标引力核心微弱星云光晕
    if (mouse.isActive) {
      const aura = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.gravityRadius * 0.8
      );
      aura.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      aura.addColorStop(0.3, 'rgba(129, 140, 248, 0.08)');
      aura.addColorStop(0.7, 'rgba(168, 85, 247, 0.03)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.gravityRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. 粒子天体引力动力学物理循环
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 自然微光呼吸闪烁
      p.pulseAngle += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.18;

      // 激波排斥力作用
      for (let s = 0; s < shockwaves.length; s++) {
        const sw = shockwaves[s];
        const sdx = p.x - sw.x;
        const sdy = p.y - sw.y;
        const sDist = Math.hypot(sdx, sdy);
        const diff = Math.abs(sDist - sw.radius);

        if (diff < 40 && sDist > 1) {
          const force = (1 - diff / 40) * sw.strength * sw.alpha;
          p.vx += (sdx / sDist) * force;
          p.vy += (sdy / sDist) * force;
        }
      }

      // 鼠标天体万有引力与吸积盘切向角动量
      if (mouse.isActive) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.gravityRadius && dist > 0.1) {
          const normX = dx / dist;
          const normY = dy / dist;

          // 核心事件视界防坍缩排斥力 (形成围绕鼠标旋转的高能吸积盘光环)
          if (dist < mouse.coreRadius) {
            const repelRatio = (1 - dist / mouse.coreRadius);
            const repelForce = repelRatio * 2.8;
            p.vx -= normX * repelForce;
            p.vy -= normY * repelForce;

            // 核心强自旋角速度
            p.vx += -normY * 4.2;
            p.vy += normX * 4.2;
            p.alpha = 1;
          } else {
            // 平滑引力衰减模型 F ~ G / (r * factor + 1)
            const gravityRatio = Math.pow((mouse.gravityRadius - dist) / mouse.gravityRadius, 1.6);
            const attractForce = gravityRatio * 0.9 * p.mass;

            // 向心吸引力
            p.vx += normX * attractForce;
            p.vy += normY * attractForce;

            // 切向自旋角动量 (Keplerian Orbital Angular Velocity: 越近转得越快)
            const orbitRatio = Math.pow((mouse.gravityRadius - dist) / mouse.gravityRadius, 1.2);
            const orbitSpeed = orbitRatio * 1.6 * p.z;
            p.vx += -normY * orbitSpeed;
            p.vy += normX * orbitSpeed;

            // 鼠标挥动风暴动量传递 (Mouse Velocity Wake)
            if (Math.abs(mouse.vx) > 0.5 || Math.abs(mouse.vy) > 0.5) {
              const wakeFactor = gravityRatio * 0.25;
              p.vx += mouse.vx * wakeFactor;
              p.vy += mouse.vy * wakeFactor;
            }

            p.alpha = Math.min(1, p.baseAlpha + gravityRatio * 0.65);
          }
        }
      }

      // 摩擦阻尼与空间平滑
      p.vx *= 0.94;
      p.vy *= 0.94;

      // 宇宙微弱失重布朗漂移
      p.vx += (Math.random() - 0.5) * 0.05 * p.z;
      p.vy += (Math.random() - 0.5) * 0.05 * p.z;

      p.x += p.vx;
      p.y += p.vy;

      // 环绕边界穿透
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      // 5. 核心渲染: 速度矢量流光拉伸 (Velocity Vector Streaks)
      const speed = Math.hypot(p.vx, p.vy);
      const isFast = speed > 1.2;

      ctx.save();
      if (isFast) {
        // 高速流星光轨拉伸
        const streakLen = Math.min(speed * 3.5, 30);
        const tailX = p.x - (p.vx / speed) * streakLen;
        const tailY = p.y - (p.vy / speed) * streakLen;

        ctx.strokeStyle = p.glowColor;
        ctx.lineWidth = Math.max(0.8, p.baseRadius * 0.85);
        ctx.globalAlpha = Math.min(1, p.alpha);
        ctx.shadowBlur = Math.min(speed * 2, 16);
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        // 低速微光星体
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
        ctx.shadowBlur = p.baseRadius * 4;
        ctx.shadowColor = p.glowColor;
        ctx.fill();
      }
      ctx.restore();
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
    window.removeEventListener('click', handleClick);
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
