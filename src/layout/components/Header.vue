<template>
  <div class="header-container">
    <div class="left-section">
      <el-icon class="toggle-btn" @click="appStore.toggleSidebar">
        <Expand v-if="appStore.sidebarCollapsed" />
        <Fold v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right-section">
      <el-dropdown>
        <span class="user-dropdown">
          <el-avatar :size="30" icon="UserFilled" />
          <span class="username">{{ userStore.userInfo?.realName || '管理员' }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item icon="Lock" @click="openPasswordDialog">修改密码</el-dropdown-item>
            <el-dropdown-item divided icon="SwitchButton" @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 修改密码 弹窗 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改个人登录密码"
      width="450px"
      append-to-body
    >
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" placeholder="请输入当前原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" placeholder="长度不少于 6 位" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSubmitting" @click="submitChangePassword">确定修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { updateUserPasswordApi } from '@/api/modules/userApi';
import { encryptPassword } from '@/utils/rsa';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const currentTitle = computed(() => (route.meta.title as string) || '控制台');

// 修改密码
const pwdDialogVisible = ref(false);
const pwdSubmitting = ref(false);
const pwdFormRef = ref<FormInstance>();
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'));
  } else {
    callback();
  }
};

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

function openPasswordDialog() {
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
  pwdDialogVisible.value = true;
}

async function submitChangePassword() {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return;
    pwdSubmitting.value = true;
    try {
      const encryptedOldPassword = await encryptPassword(pwdForm.oldPassword);
      const encryptedNewPassword = await encryptPassword(pwdForm.newPassword);
      await updateUserPasswordApi({
        oldPassword: encryptedOldPassword,
        newPassword: encryptedNewPassword,
      });
      ElMessage.success('密码修改成功，请重新登录');
      pwdDialogVisible.value = false;
      handleLogout();
    } finally {
      pwdSubmitting.value = false;
    }
  });
}

function handleLogout() {
  userStore.resetToken();
  location.href = '/login';
}
</script>

<style scoped>
.header-container {
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}
.left-section {
  display: flex;
  align-items: center;
  gap: 15px;
}
.toggle-btn {
  font-size: 20px;
  cursor: pointer;
}
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: #333;
}
</style>
