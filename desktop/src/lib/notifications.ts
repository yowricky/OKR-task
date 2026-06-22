import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export async function notify(title: string, body: string) {
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === 'granted';
  }
  if (granted) {
    sendNotification({ title, body });
  }
}

export function scheduleRiskCheck() {
  setInterval(async () => {
    try {
      const { api } = await import('@/api/client');
      const risks = await api.get<any[]>('/risks?status=open');
      if (risks.length > 0) {
        await notify('风险预警', `您有 ${risks.length} 个风险项需要关注`);
      }
    } catch {
      // Silently fail to avoid disturbing the user
    }
  }, 30 * 60 * 1000);
}
