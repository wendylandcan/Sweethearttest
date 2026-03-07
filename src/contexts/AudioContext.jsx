import { createContext, useContext, useRef, useState, useEffect } from 'react';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const pendingPlayRef = useRef(false);
  const fadeIntervalRef = useRef(null);
  const originalVolumeRef = useRef(0.3); // 保存 BGM 原始音量
  const isDuckingRef = useRef(false); // 是否正在降低音量

  // 音效池 - 增加到 8 个实例以支持快速连续点击
  const sfxPoolRef = useRef({});
  const POOL_SIZE = 8; // ✅ 修复 2: 增加音频池大小以支持快速点击

  useEffect(() => {
    // 创建单例音频实例
    const audio = new Audio('/bgm.mp3');
    audio.loop = true;
    audio.volume = 0; // 初始音量为 0，用于 fade-in
    audioRef.current = audio;

    // ✅ 修复 1 & 5: 提前初始化音效池，添加错误处理和日志
    const sfxFiles = {
      'option': '/option-sound.wav',
      'error': '/error-sound.wav',
      'success': '/success-sound.wav',
      'start': '/start-sound.wav',
      'result': '/result-sound.wav',
      'poster': '/poster-sound.wav',
      'stress': '/stress-sound.wav'
    };

    // ✅ 清理旧的音效池（如果存在）
    Object.values(sfxPoolRef.current).forEach(pool => {
      pool.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.onended = null;
          audio.onerror = null;
          audio.oncanplaythrough = null;
        } catch (e) {
          // 忽略清理错误
        }
      });
    });
    sfxPoolRef.current = {};

    Object.entries(sfxFiles).forEach(([key, src]) => {
      const pool = [];
      for (let i = 0; i < POOL_SIZE; i++) {
        const sfx = new Audio(src);
        sfx.preload = 'auto';
        sfx.volume = 0.8; // 提高音量到 0.8

        // ✅ 添加错误处理
        sfx.addEventListener('error', (e) => {
          console.error(`❌ 音频加载失败: ${key}`, e);
        });

        // ✅ 添加加载完成日志
        sfx.addEventListener('canplaythrough', () => {
          console.log(`✅ 音频加载完成: ${key} (实例 ${i + 1}/${POOL_SIZE})`);
        }, { once: true });

        sfx.load();
        pool.push(sfx);
      }
      sfxPoolRef.current[key] = pool;
    });
    console.log('✅ 音效池已初始化');

    // 监听音频事件
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlay = () => setIsReady(true);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplaythrough', handleCanPlay);

    // 从 localStorage 读取用户偏好
    const savedPreference = localStorage.getItem('bgm_enabled');
    const shouldPlay = savedPreference === null ? true : savedPreference === 'true';

    if (shouldPlay) {
      // 尝试自动播放
      audio.play()
        .then(() => {
          console.log('✅ BGM 自动播放成功');
          fadeIn(audio, 0.3, 2000);
          pendingPlayRef.current = false;
          setIsAudioUnlocked(true);
        })
        .catch((error) => {
          console.log('⚠️  自动播放被阻止，等待用户交互:', error);
          pendingPlayRef.current = true;
        });
    }

    // ✅ 修复 6: 改进音频解锁逻辑 - 移除自动解锁所有音频池
    const handleGlobalClick = () => {
      if (pendingPlayRef.current && !isPlaying) {
        audio.play()
          .then(() => {
            console.log('✅ 全局点击触发播放成功');
            fadeIn(audio, 0.3, 2000);
            pendingPlayRef.current = false;
            setIsAudioUnlocked(true);
          })
          .catch((err) => {
            console.log('❌ 播放失败:', err);
          });
      }
    };

    // 监听多种交互事件
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleGlobalClick, { once: true });
    });

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      events.forEach(event => {
        document.removeEventListener(event, handleGlobalClick);
      });
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      audio.pause();
    };
  }, []);

  // Fade-in 效果
  const fadeIn = (audio, targetVolume, duration) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const steps = 60; // 60 帧
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    audio.volume = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, stepDuration);
  };

  // 尝试播放（用于用户交互后触发）
  const tryPlay = () => {
    const audio = audioRef.current;
    if (!audio || isPlaying) return;

    audio.play()
      .then(() => {
        console.log('✅ 用户交互后播放成功');
        pendingPlayRef.current = false;
        fadeIn(audio, 0.3, 2000);
        localStorage.setItem('bgm_enabled', 'true');
        setIsAudioUnlocked(true);
      })
      .catch((err) => {
        console.log('❌ 播放失败:', err);
      });
  };

  // 切换播放/暂停
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      localStorage.setItem('bgm_enabled', 'false');
    } else {
      audio.play()
        .then(() => {
          fadeIn(audio, 0.3, 2000);
          localStorage.setItem('bgm_enabled', 'true');
        })
        .catch((err) => console.log('❌ 播放失败:', err));
    }
  };

  // BGM Ducking - 降低 BGM 音量（优化：更快的过渡）
  const duckBGM = (targetVolume = 0.1, duration = 30) => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    // 清除之前的 ducking interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    isDuckingRef.current = true;
    const currentVolume = audio.volume;

    // 使用更少的步数，更快的过渡
    const steps = 2;
    const stepDuration = duration / steps;
    const volumeStep = (currentVolume - targetVolume) / steps;
    let currentStep = 0;

    const duckInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(currentVolume - volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(duckInterval);
      }
    }, stepDuration);
  };

  // 恢复 BGM 音量（优化：更快的恢复）
  const restoreBGM = (duration = 50) => {
    const audio = audioRef.current;
    if (!audio || !isPlaying || !isDuckingRef.current) return;

    isDuckingRef.current = false;
    const currentVolume = audio.volume;
    const targetVolume = originalVolumeRef.current;

    // 使用更少的步数，更快的恢复
    const steps = 2;
    const stepDuration = duration / steps;
    const volumeStep = (targetVolume - currentVolume) / steps;
    let currentStep = 0;

    const restoreInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(currentVolume + volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(restoreInterval);
      }
    }, stepDuration);
  };

  // ✅ 修复 3: 获取可用的音效实例，优先使用完全空闲的实例
  const getAvailableAudio = (sfxName) => {
    const pool = sfxPoolRef.current[sfxName];
    if (!pool) {
      console.warn(`⚠️  音效池未找到: ${sfxName}`);
      return null;
    }

    // 优先找到完全空闲的实例（已暂停且在起始位置）
    const idle = pool.find(audio => audio.paused && audio.currentTime === 0);
    if (idle) {
      return idle;
    }

    // 其次找到已暂停的实例
    const paused = pool.find(audio => audio.paused);
    if (paused) {
      return paused;
    }

    // 再找播放时间最长的实例（最接近结束）
    const playing = pool.filter(audio => !audio.paused);
    if (playing.length > 0) {
      const mostPlayed = playing.reduce((prev, curr) =>
        curr.currentTime > prev.currentTime ? curr : prev
      );
      return mostPlayed;
    }

    // ✅ 如果都在播放，强制使用第一个
    console.warn(`⚠️  所有 ${sfxName} 实例都在播放，强制重用第一个`);
    return pool[0];
  };

  // ✅ 修复 4: 播放音效，强制重置正在播放的音频
  const playSFX = (src) => {
    // 从路径提取音效名称
    const sfxName = src.split('/').pop().replace('-sound.wav', '').replace('.wav', '');
    const sfxAudio = getAvailableAudio(sfxName);

    if (!sfxAudio) {
      console.warn(`⚠️  音效未找到: ${sfxName}`);
      return;
    }

    // ✅ 强制停止并重置音频（使用 try-catch 避免错误）
    try {
      // 立即停止播放
      sfxAudio.pause();
      sfxAudio.currentTime = 0;
      // 清除旧的事件监听器
      sfxAudio.onended = null;
    } catch (e) {
      // 忽略重置错误，继续播放
    }

    // 播放前降低 BGM 音量（更快的过渡）
    if (isPlaying) {
      duckBGM(0.1, 30); // 减少到 30ms
    }

    // 立即播放（不等待 Promise）
    const playPromise = sfxAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 首次成功播放后标记音频已解锁
          if (!isAudioUnlocked) {
            setIsAudioUnlocked(true);
            console.log('✅ 音频已通过音效播放解锁');
          }
        })
        .catch(err => {
          // 如果是首次播放失败，尝试通过用户交互解锁
          if (!isAudioUnlocked) {
            console.log('⚠️  音效播放被阻止，需要用户交互解锁');
          }
          // 静默处理播放失败，不影响用户体验
          if (isPlaying) {
            setTimeout(() => restoreBGM(50), 100);
          }
        });
    }

    // 设置音效结束回调（使用 onended 替代 addEventListener）
    sfxAudio.onended = () => {
      if (isPlaying) {
        restoreBGM(50); // 更快的恢复
      }
    };

    // 备用：如果音效超时，强制恢复 BGM
    setTimeout(() => {
      if (isPlaying && isDuckingRef.current) {
        restoreBGM(50);
      }
    }, 2000); // 减少到 2 秒
  };

  const value = {
    isPlaying,
    isReady,
    isAudioUnlocked,
    hasPendingPlay: pendingPlayRef.current,
    tryPlay,
    toggle,
    playSFX,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
