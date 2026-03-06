import { createContext, useContext, useRef, useState, useEffect } from 'react';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const pendingPlayRef = useRef(false);
  const fadeIntervalRef = useRef(null);
  const originalVolumeRef = useRef(0.3); // 保存 BGM 原始音量
  const isDuckingRef = useRef(false); // 是否正在降低音量

  useEffect(() => {
    // 创建单例音频实例
    const audio = new Audio('/bgm.mp3');
    audio.loop = true;
    audio.volume = 0; // 初始音量为 0，用于 fade-in
    audioRef.current = audio;

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
          console.log('BGM 自动播放成功');
          fadeIn(audio, 0.3, 2000);
          pendingPlayRef.current = false;
        })
        .catch((error) => {
          console.log('自动播放被阻止，等待用户交互:', error);
          pendingPlayRef.current = true;
        });
    }

    // 全局点击监听器 - 在任何地方点击都尝试播放
    const handleGlobalClick = () => {
      if (pendingPlayRef.current && !isPlaying) {
        audio.play()
          .then(() => {
            console.log('全局点击触发播放成功');
            fadeIn(audio, 0.3, 2000);
            pendingPlayRef.current = false;
          })
          .catch((err) => {
            console.log('播放失败:', err);
          });
      }
    };

    // 监听多种交互事件
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleGlobalClick);
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
        console.log('用户交互后播放成功');
        pendingPlayRef.current = false;
        fadeIn(audio, 0.3, 2000);
        localStorage.setItem('bgm_enabled', 'true');
      })
      .catch((err) => {
        console.log('播放失败:', err);
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
        .catch((err) => console.log('播放失败:', err));
    }
  };

  // BGM Ducking - 降低 BGM 音量
  const duckBGM = (targetVolume = 0.1, duration = 150) => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    // 清除之前的 ducking interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    isDuckingRef.current = true;
    const currentVolume = audio.volume;
    const steps = 10;
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

  // 恢复 BGM 音量
  const restoreBGM = (duration = 300) => {
    const audio = audioRef.current;
    if (!audio || !isPlaying || !isDuckingRef.current) return;

    isDuckingRef.current = false;
    const currentVolume = audio.volume;
    const targetVolume = originalVolumeRef.current;
    const steps = 15;
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

  // 播放音效（带 BGM ducking）- 每次创建新的 Audio 实例
  const playSFX = (src) => {
    // 每次创建新的音效实例，避免冲突
    const sfxAudio = new Audio(src);
    sfxAudio.volume = 0.6;

    // 降低 BGM 音量
    if (isPlaying) {
      duckBGM(0.15, 100); // 缩短 ducking 时间
    }

    // 设置音效结束回调
    sfxAudio.onended = () => {
      if (isPlaying) {
        setTimeout(() => restoreBGM(200), 50); // 延迟恢复，避免冲突
      }
    };

    // 播放音效
    sfxAudio.play()
      .then(() => {
        console.log('音效播放成功:', src);
      })
      .catch(err => {
        console.log('音效播放失败:', err);
        // 即使失败也要恢复 BGM
        if (isPlaying) {
          setTimeout(() => restoreBGM(200), 50);
        }
      });
  };

  const value = {
    isPlaying,
    isReady,
    hasPendingPlay: pendingPlayRef.current,
    tryPlay,
    toggle,
    playSFX, // 新增：播放音效方法
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
