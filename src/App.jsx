import { useState, useCallback, useEffect } from "react";
import InvitationPage from "./components/InvitationPage";
import LoadingPage from "./components/LoadingPage";
import PreloadingPage from "./components/PreloadingPage";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import BackgroundMusic from "./components/BackgroundMusic";
import { AudioProvider } from "./contexts/AudioContext";
import { AnimatePresence, motion } from "framer-motion";
import { useAnalytics } from "./hooks/useAnalytics";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

export default function App() {
  const [phase, setPhase] = useState("invitation"); // invitation | loading | preloading | quiz | result
  const [result, setResult] = useState(null);
  const [savedPasscode, setSavedPasscode] = useState(""); // 保存用户输入的邀请码
  const { trackPageView, trackQuizStart, trackQuizComplete } = useAnalytics();

  // 全局强制应用可爱字体
  useEffect(() => {
    document.body.style.fontFamily = "'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif";
  }, []);

  // 追踪页面切换
  useEffect(() => {
    const pageNames = {
      invitation: '邀请码页面',
      preloading: '资源加载页面',
      loading: '心灵之蛋页面',
      quiz: '答题页面',
      result: '结果页面',
    };
    trackPageView(pageNames[phase] || phase);
  }, [phase, trackPageView]);

  const handleVerified = useCallback((passcode) => {
    setSavedPasscode(passcode); // 保存邀请码
    setPhase("preloading");
  }, []);

  const handleStart = useCallback(() => {
    trackQuizStart(savedPasscode);
    setPhase("quiz");
  }, [savedPasscode, trackQuizStart]);

  const handlePreloadComplete = useCallback(() => setPhase("loading"), []);

  const handleComplete = useCallback(({ scores, match }) => {
    setResult({ scores, match });
    trackQuizComplete(match.id, scores);
    setPhase("result");
  }, [trackQuizComplete]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setPhase("invitation"); // 返回到邀请码页面
  }, []);

  return (
    <AudioProvider>
      <div className="app-root">
        {/* 背景音乐控制器 */}
        <BackgroundMusic />

        <AnimatePresence mode="wait">
          {phase === "invitation" && (
            <motion.div key="invitation" {...pageVariants} className="page-wrapper">
              <InvitationPage onVerified={handleVerified} initialCode={savedPasscode} />
            </motion.div>
          )}
          {phase === "preloading" && (
            <motion.div key="preloading" {...pageVariants} className="page-wrapper">
              <PreloadingPage onComplete={handlePreloadComplete} />
            </motion.div>
          )}
          {phase === "loading" && (
            <motion.div key="loading" {...pageVariants} className="page-wrapper">
              <LoadingPage onStart={handleStart} />
            </motion.div>
          )}
          {phase === "quiz" && (
            <motion.div key="quiz" {...pageVariants} className="page-wrapper">
              <QuizPage onComplete={handleComplete} />
            </motion.div>
          )}
          {phase === "result" && result && (
            <motion.div key="result" {...pageVariants} className="page-wrapper">
              <ResultPage
                match={result.match}
                scores={result.scores}
                onRetry={handleRetry}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AudioProvider>
  );
}
