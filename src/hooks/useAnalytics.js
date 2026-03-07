// Google Analytics 追踪 Hook
export function useAnalytics() {
  // 追踪页面浏览
  const trackPageView = (pageName) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_path: window.location.pathname,
      });
      console.log(`📊 GA: 页面浏览 - ${pageName}`);
    }
  };

  // 追踪自定义事件
  const trackEvent = (eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
      console.log(`📊 GA: 事件 - ${eventName}`, eventParams);
    }
  };

  // 追踪测验相关事件
  const trackQuizStart = (inviteCode) => {
    trackEvent('quiz_start', {
      event_category: 'Quiz',
      event_label: inviteCode,
    });
  };

  const trackQuizComplete = (characterId, scores) => {
    trackEvent('quiz_complete', {
      event_category: 'Quiz',
      character_id: characterId,
      scores: JSON.stringify(scores),
    });
  };

  const trackPosterDownload = (characterId) => {
    trackEvent('poster_download', {
      event_category: 'Engagement',
      character_id: characterId,
    });
  };

  const trackAudioToggle = (isPlaying) => {
    trackEvent('audio_toggle', {
      event_category: 'Interaction',
      audio_state: isPlaying ? 'play' : 'pause',
    });
  };

  return {
    trackPageView,
    trackEvent,
    trackQuizStart,
    trackQuizComplete,
    trackPosterDownload,
    trackAudioToggle,
  };
}
