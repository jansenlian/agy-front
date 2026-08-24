<template>
  <div class="agent-container">
    <el-card shadow="never" class="agent-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">🌾 AGY 阿克苏智慧耕地与违规预警智能体</span>
            <el-tag type="success" effect="light" class="tag">DeepSeek-V3+智慧耕地大脑(8092)</el-tag>
          </div>
          <div class="header-right">
            <el-button type="danger" link :disabled="messages.length <= 1" @click="handleClearChat">
              🗑️ 清空对话记忆
            </el-button>
          </div>
        </div>
      </template>

      <!-- 消息会话区域 -->
      <div class="chat-main" ref="chatMainRef">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-row', msg.role]"
        >
          <div :class="['avatar', msg.role]">
            {{ msg.role === 'user' ? '👤' : '🌾' }}
          </div>
          <div class="bubble">
            <div
              v-if="msg.role === 'bot'"
              class="markdown-body"
              v-html="renderMarkdown(msg.content)"
            ></div>
            <div v-else class="user-text">{{ msg.content }}</div>

            <!-- 光标动画 -->
            <span v-if="msg.isStreaming" class="typing-cursor"></span>

            <!-- 首条机器人的快捷推荐问题 -->
            <div v-if="index === 0 && msg.role === 'bot'" class="quick-prompts">
              <el-tag
                v-for="(prompt, pIdx) in quickPrompts"
                :key="pIdx"
                class="prompt-chip"
                effect="plain"
                type="success"
                @click="sendQuickPrompt(prompt)"
              >
                {{ prompt }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入栏 -->
      <div class="chat-footer">
        <el-input
          v-model="inputQuery"
          type="textarea"
          :rows="2"
          placeholder="输入任何阿克苏耕地违规预警单号、合同地块现状、非粮化排查或大盘统计问题,按 Ctrl+Enter 或点击发送..."
          :disabled="isStreaming"
          @keydown.enter.exact.prevent="handleEnterPress"
          @keydown.ctrl.enter.prevent="handleSend"
        />
        <div class="footer-actions">
          <span class="tip-text">支持 Shift+Enter / Ctrl+Enter 换行,Enter 直接发送</span>
          <el-button
            type="success"
            :loading="isStreaming"
            :disabled="!inputQuery.trim()"
            @click="handleSend"
          >
            🚀 发送提问
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  isStreaming?: boolean;
}

const chatMainRef = ref<HTMLDivElement | null>(null);
const inputQuery = ref('');
const isStreaming = ref(false);
const sessionId = ref(`aks_session_${Date.now()}`);

const quickPrompts = [
  '📊 统计全区各县市耕地合同与承包总面积大盘',
  '⚠️ 查看全区最新的违法违规与非粮化预警台账',
  '🌾 统计阿克苏地区粮菜作物种植结构与非粮化比例',
  '🔍 穿透诊断最新一条高危违规预警单的成因与处置建议',
  '💰 统计各区县土地流转租金与欠费清收概况',
  '📋 统计全区合同与地块的审批流转合规状态',
];

const messages = ref<ChatMessage[]>([
  {
    role: 'bot',
    content: `**您好!我是 AGY 阿克苏智慧耕地与违规预警智能体.**

已成功直连阿克苏智慧耕地业务主库(\`aks\`)与空间库(\`sde2\`),装配两大核心专属大脑:
- 🛡️ **违法违规与风险预警深度诊断(\`YjAgentTools\`)**: 全区违规台账多维筛查、穿透合同与地块现状进行因果归因与合规整改指导;
- 📈 **领导驾驶舱与大盘宏观统计(\`FarmlandStatAgentTools\`)**: 9个县市区耕地大盘指标、粮菜种植结构分布、租金收缴与审批流合规研判.

您可以直接在下方输入框向我提问,或点击快捷探索:`,
  },
]);

function renderMarkdown(content: string): string {
  if (!content) return '';
  const markedObj = (window as any).marked;
  if (markedObj && typeof markedObj.parse === 'function') {
    return markedObj.parse(content);
  }
  // 简易换行容错
  return content.replace(/\n/g, '<br/>');
}

function scrollToBottom() {
  nextTick(() => {
    if (chatMainRef.value) {
      chatMainRef.value.scrollTop = chatMainRef.value.scrollHeight;
    }
  });
}

function handleEnterPress(e: any) {
  if (e.shiftKey || e.ctrlKey) {
    return;
  }
  handleSend();
}

function sendQuickPrompt(promptText: string) {
  if (isStreaming.value) return;
  inputQuery.value = promptText;
  handleSend();
}

async function handleSend() {
  const query = inputQuery.value.trim();
  if (!query || isStreaming.value) return;

  // 1. 追加用户消息
  messages.value.push({ role: 'user', content: query });
  inputQuery.value = '';
  isStreaming.value = true;
  scrollToBottom();

  // 2. 占位机器人回复
  const botMessage: ChatMessage = {
    role: 'bot',
    content: '',
    isStreaming: true,
  };
  messages.value.push(botMessage);
  scrollToBottom();

  try {
    const url = `/api/aks/agent/chat/stream?message=${encodeURIComponent(query)}&memoryId=${encodeURIComponent(sessionId.value)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`服务响应异常: HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('未获取到流式传输流');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.substring(5).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.delta) {
              botMessage.content += data.delta;
              scrollToBottom();
            }
            if (data.error) {
              botMessage.content += `\n\n> ⚠️ **异常提示**: ${data.error}`;
            }
            if (data.finished) {
              botMessage.isStreaming = false;
            }
          } catch (e) {
            console.error('SSE JSON 解析异常:', e, jsonStr);
          }
        }
      }
    }
  } catch (err: any) {
    botMessage.content += `\n\n> ❌ **提问交互失败**: ${err.message || '网络连接超时'}`;
    ElMessage.error(err.message || '提问失败,请确认后端 agy-aks-agent 服务已启动(端口:8092)');
  } finally {
    botMessage.isStreaming = false;
    isStreaming.value = false;
    scrollToBottom();
  }
}

async function handleClearChat() {
  try {
    await ElMessageBox.confirm('确定要清空当前所有对话历史记忆吗?', '提示', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning',
    });
    try {
      await fetch(`/api/aks/agent/memory/${encodeURIComponent(sessionId.value)}`, { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    sessionId.value = `aks_session_${Date.now()}`;
    messages.value = [messages.value[0]];
    ElMessage.success('对话记忆已重置!');
  } catch {
    // canceled
  }
}
</script>

<style scoped>
.agent-container {
  padding: 16px;
  height: calc(100vh - 110px);
  box-sizing: border-box;
}

.agent-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
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
  color: #1e293b;
}

.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #e2e8f0;
}

.avatar.user {
  background: #10b981;
  color: white;
}

.bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}

.message-row.bot .bubble {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.message-row.user .bubble {
  background: #10b981;
  color: #ffffff;
  border-top-right-radius: 2px;
}

.user-text {
  white-space: pre-wrap;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.prompt-chip {
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-chip:hover {
  transform: translateY(-1px);
}

.chat-footer {
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.footer-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip-text {
  font-size: 12px;
  color: #94a3b8;
}

.typing-cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  background-color: #10b981;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

:deep(.markdown-body table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 13px;
}

:deep(.markdown-body th), :deep(.markdown-body td) {
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  text-align: left;
}

:deep(.markdown-body th) {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}

:deep(.markdown-body tr:nth-child(even)) {
  background: #f8fafc;
}

:deep(.markdown-body pre) {
  background: #0f172a;
  color: #38bdf8;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

:deep(.markdown-body code) {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
}

:deep(.markdown-body pre code) {
  background: transparent;
  padding: 0;
}
</style>
