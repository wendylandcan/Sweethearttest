# Google Analytics 集成说明

## 配置步骤

### 1. 获取 Google Analytics ID

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 创建新的媒体资源（Property）
3. 选择"网站"作为平台
4. 获取你的 Measurement ID（格式：`G-XXXXXXXXXX`）

### 2. 配置项目

打开 `src/main.jsx`，找到第 7 行：

```javascript
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // 替换为你的 GA ID
```

将 `G-XXXXXXXXXX` 替换为你的实际 Measurement ID。

### 3. 追踪的事件

项目已经集成了以下追踪功能：

#### 页面浏览
- 邀请码页面
- 资源加载页面
- 心灵之蛋页面
- 答题页面
- 结果页面

#### 自定义事件
- **quiz_start**: 用户开始测验
  - `event_label`: 邀请码

- **quiz_complete**: 用户完成测验
  - `character_id`: 匹配的角色 ID
  - `scores`: 六维性格分数（JSON 格式）

- **poster_download**: 用户下载海报
  - `character_id`: 角色 ID

- **audio_toggle**: 用户切换背景音乐
  - `audio_state`: 'play' 或 'pause'

### 4. 使用 Analytics Hook

如果需要在其他组件中追踪事件，可以使用 `useAnalytics` Hook：

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('custom_event', {
      event_category: 'User Interaction',
      event_label: 'Button Click',
    });
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### 5. 测试

1. 在开发环境中，GA 不会加载（只在生产环境启用）
2. 部署到生产环境后，访问 Google Analytics 实时报告查看数据
3. 打开浏览器控制台，可以看到 `📊 GA:` 开头的日志

### 6. 注意事项

- GA 只在生产环境（`import.meta.env.PROD`）中启用
- 开发环境中会在控制台输出追踪日志，但不会发送到 GA
- 确保用户同意隐私政策后再启用追踪（如需要）
