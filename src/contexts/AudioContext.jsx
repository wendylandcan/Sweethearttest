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

  // ✅ 使用 Web Audio API 实现低延迟音效播放
  const audioContextRef = useRef(null);
  const sfxBuffersRef = useRef({}); // 存储解码后的音频缓冲区
  const sfxIndexRef = useRef({}); // 轮询索引
  const POOL_SIZE = 8;

  useEffect(() => {
    // 创建单例音频实例
    const audio = new Audio('/bgm.mp3');
    audio.loop = true;
    audio.volume = 0; // 初始音量为 0，用于 fade-in
    audioRef.current = audio;

    // ✅ 初始化 Web Audio API
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    // ✅ 使用 Web Audio API 加载音效
    const sfxFiles = {
      'option': '/option-sound.wav',
      'error': '/error-sound.wav',
      'success': '/success-sound.wav',
      'start': '/start-sound.wav',
      'result': '/result-sound.wav',
      'poster': '/poster-sound.wav',
      'stress': '/stress-sound.wav'
    };

    // 加载并解码所有音效
    Object.entries(sfxFiles).forEach(async ([key, src]) => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        sfxBuffersRef.current[key] = audioBuffer;
        sfxIndexRef.current[key] = 0;
      } catch (error) {
        console.error(`❌ 音效加载失败: ${key}`, error);
      }
    });

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
      // 解锁 Web Audio API
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('✅ Web Audio API 已解锁');
          setIsAudioUnlocked(true);
        });
      }

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
  const duckBGM = () => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    // 清除之前的 ducking interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    isDuckingRef.current = true;
    // ✅ 立即设置音量，无过渡
    audio.volume = 0.1;
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

  // ✅ 使用 Web Audio API 播放音效（零延迟）
  const playSFX = (src) => {
    // 从路径提取音效名称
    const sfxName = src.split('/').pop().replace('-sound.wav', '').replace('.wav', '');
    const audioBuffer = sfxBuffersRef.current[sfxName];

    // ✅ 最小化检查，直接播放
    if (!audioBuffer || !audioContextRef.current) return;

    // ✅ 创建并立即播放（不做任何其他操作）
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.value = 0.8;
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    source.start(0);

    // ✅ 播放后才处理其他逻辑（BGM降低、状态更新等）
    if (isPlaying && audioRef.current) {
      audioRef.current.volume = 0.1;
      isDuckingRef.current = true;
    }

    source.onended = () => {
      if (isPlaying) restoreBGM(50);
    };

    if (!isAudioUnlocked) setIsAudioUnlocked(true);
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
