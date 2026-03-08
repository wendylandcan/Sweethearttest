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
  const sfxIndexRef = useRef({}); // ✅ 添加索引追踪，用于轮询
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

        // ✅ 设置音频为立即播放模式
        sfx.load(); // 强制加载

        // ✅ 添加错误处理
        sfx.addEventListener('error', (e) => {
          console.error(`❌ 音频加载失败: ${key}`, e);
        });

        // ✅ 添加加载完成日志
        sfx.addEventListener('canplaythrough', () => {
          console.log(`✅ 音频加载完成: ${key} (实例 ${i + 1}/${POOL_SIZE})`);
        }, { once: true });

        pool.push(sfx);
      }
      sfxPoolRef.current[key] = pool;
      sfxIndexRef.current[key] = 0; // ✅ 初始化轮询索引
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

  // BGM Ducking - 立即降低 BGM 音量（无过渡动画）
  const duckBGM = (targetVolume = 0.1) => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    // 清除之前的 ducking interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    isDuckingRef.current = true;
    // ✅ 立即设置音量，无过渡
    audio.volume = targetVolume;
  };

  // 恢复 BGM 音量（快速过渡）
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

  // ✅ 修复 3: 使用轮询策略快速获取音效实例
  const getAvailableAudio = (sfxName) => {
    const pool = sfxPoolRef.current[sfxName];
    if (!pool) {
      console.warn(`⚠️  音效池未找到: ${sfxName}`);
      return null;
    }

    // ✅ 使用轮询策略（round-robin）快速选择下一个实例
    const currentIndex = sfxIndexRef.current[sfxName] || 0;
    const nextIndex = (currentIndex + 1) % POOL_SIZE;
    sfxIndexRef.current[sfxName] = nextIndex;

    return pool[currentIndex];
  };

  // ✅ 修复 4: 播放音效，立即播放不等待 BGM ducking
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

    // ✅ 立即播放音效，不等待任何操作
    const playPromise = sfxAudio.play();

    // ✅ 播放后立即降低 BGM 音量（异步，不阻塞音效播放）
    if (isPlaying) {
      duckBGM(0.1);
    }

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
        restoreBGM(50);
      }
    };

    // 备用：如果音效超时，强制恢复 BGM
    setTimeout(() => {
      if (isPlaying && isDuckingRef.current) {
        restoreBGM(50);
      }
    }, 2000);
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
