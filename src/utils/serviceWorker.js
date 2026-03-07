// Service Worker 注册和管理
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker 注册成功:', registration.scope);

          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 发现新版本 Service Worker');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新版本已安装，提示用户刷新
                console.log('✨ 新版本已准备好');
                showUpdateNotification(newWorker);
              }
            });
          });

          // 定期检查更新（每小时）
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('❌ Service Worker 注册失败:', error);
        });

      // 监听 Service Worker 控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker 控制器已更新');
        // 自动刷新页面以使用新版本
        window.location.reload();
      });
    });
  } else {
    console.log('⚠️  浏览器不支持 Service Worker');
  }
}

// 显示更新通知
function showUpdateNotification(worker) {
  // 创建更新提示
  const notification = document.createElement('div');
  notification.className = 'sw-update-notification';
  notification.innerHTML = `
    <div class="sw-update-content">
      <span class="sw-update-icon">✨</span>
      <span class="sw-update-text">发现新版本</span>
      <button class="sw-update-btn" id="sw-update-btn">立即更新</button>
      <button class="sw-update-close" id="sw-update-close">×</button>
    </div>
  `;

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .sw-update-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
      font-family: 'ZCOOL KuaiLe', 'Fredoka', sans-serif;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .sw-update-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sw-update-icon {
      font-size: 20px;
    }

    .sw-update-text {
      font-size: 14px;
      font-weight: 500;
    }

    .sw-update-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      font-family: inherit;
    }

    .sw-update-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .sw-update-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .sw-update-close:hover {
      opacity: 1;
    }

    @media (max-width: 640px) {
      .sw-update-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        padding: 12px 16px;
      }

      .sw-update-content {
        gap: 8px;
      }

      .sw-update-text {
        font-size: 13px;
      }

      .sw-update-btn {
        padding: 5px 12px;
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(notification);

  // 更新按钮点击事件
  document.getElementById('sw-update-btn').addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    notification.remove();
  });

  // 关闭按钮点击事件
  document.getElementById('sw-update-close').addEventListener('click', () => {
    notification.remove();
  });

  // 10 秒后自动关闭
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// 卸载 Service Worker（调试用）
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('✅ Service Worker 已卸载');
      })
      .catch((error) => {
        console.error('❌ Service Worker 卸载失败:', error);
      });
  }
}

// 清除所有缓存（调试用）
export function clearAllCaches() {
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️  删除缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ 所有缓存已清除');
    });
  }
}
