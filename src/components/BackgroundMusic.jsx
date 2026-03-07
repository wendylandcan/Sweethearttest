import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "../contexts/AudioContext";
import { useAnalytics } from "../hooks/useAnalytics";

export default function BackgroundMusic() {
  const { isPlaying, toggle } = useAudio();
  const { trackAudioToggle } = useAnalytics();

  const handleToggle = () => {
    toggle();
    trackAudioToggle(!isPlaying);
  };

  return (
    <motion.button
      className="bgm-control"
      onClick={handleToggle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={isPlaying ? "关闭背景音乐" : "播放背景音乐"}
    >
      <AnimatePresence mode="wait">
        {isPlaying ? (
          <motion.svg
            key="playing"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              fill="currentColor"
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="muted"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <path
              d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
              fill="currentColor"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {isPlaying && (
        <div className="sound-waves">
          <span className="wave wave-1" />
          <span className="wave wave-2" />
          <span className="wave wave-3" />
        </div>
      )}

      <style jsx>{`
        .bgm-control {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 5, 30, 0.8);
          backdrop-filter: blur(12px);
          border: 2px solid rgba(180, 130, 255, 0.3);
          border-radius: 50%;
          color: rgba(230, 220, 255, 0.9);
          cursor: pointer;
          z-index: 9999;
          box-shadow:
            0 0 30px rgba(139, 127, 212, 0.3),
            0 0 60px rgba(139, 127, 212, 0.15),
            inset 0 0 40px rgba(180, 130, 255, 0.05);
          transition: all 0.3s ease;
          overflow: visible;
        }

        .bgm-control:hover {
          border-color: rgba(180, 130, 255, 0.6);
          box-shadow:
            0 0 40px rgba(139, 127, 212, 0.5),
            0 0 80px rgba(139, 127, 212, 0.25),
            inset 0 0 50px rgba(180, 130, 255, 0.1);
          transform: scale(1.05);
        }

        .bgm-control svg {
          position: relative;
          z-index: 2;
        }

        .sound-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .wave {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border: 2px solid rgba(180, 130, 255, 0.4);
          border-radius: 50%;
          animation: pulse-wave 2s ease-out infinite;
        }

        .wave-1 {
          animation-delay: 0s;
        }

        .wave-2 {
          animation-delay: 0.6s;
        }

        .wave-3 {
          animation-delay: 1.2s;
        }

        @keyframes pulse-wave {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          .bgm-control {
            width: 48px;
            height: 48px;
            top: 16px;
            right: 16px;
          }

          .bgm-control svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </motion.button>
  );
}
