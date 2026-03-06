/**
 * 获取或生成设备唯一标识
 * @returns {string} 设备ID
 */
export function getDeviceId() {
  const DEVICE_ID_KEY = 'seiyo_device_id';

  // 尝试从 localStorage 获取
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // 生成新的设备ID：时间戳 + 随机字符串
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    deviceId = `device_${timestamp}_${randomStr}`;

    // 保存到 localStorage
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}
