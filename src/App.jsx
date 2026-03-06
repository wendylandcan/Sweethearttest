import { useState, useCallback } from "react";
import InvitationPage from "./components/InvitationPage";
import LoadingPage from "./components/LoadingPage";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import BackgroundMusic from "./components/BackgroundMusic";
import { AudioProvider } from "./contexts/AudioContext";
import { AnimatePresence, motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

export default function App() {
  const [phase, setPhase] = useState("invitation"); // invitation | loading | quiz | result
  const [result, setResult] = useState(null);
  const [savedPasscode, setSavedPasscode] = useState(""); // 保存用户输入的邀请码

  const handleVerified = useCallback((passcode) => {
    setSavedPasscode(passcode); // 保存邀请码
    setPhase("loading");
  }, []);

  const handleStart = useCallback(() => setPhase("quiz"), []);

  const handleComplete = useCallback(({ scores, match }) => {
    setResult({ scores, match });
    setPhase("result");
  }, []);

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
