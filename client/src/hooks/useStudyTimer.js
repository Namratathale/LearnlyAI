import { useState, useEffect, useRef } from 'react';

export const useStudyTimer = (courseId, lessonId, onUpdate) => {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const isActive = useRef(true);

  useEffect(() => {
    // Handle tab switching
    const handleVisibilityChange = () => {
      isActive.current = document.visibilityState === 'visible';
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Heartbeat: Increment and sync
    timerRef.current = setInterval(() => {
      if (isActive.current) {
        setSeconds(s => s + 1);
        // Sync to backend every 30 seconds
        if ((seconds + 1) % 30 === 0) {
          onUpdate(30); 
        }
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(timerRef.current);
      onUpdate(seconds % 30); // Final sync
    };
  }, [courseId, lessonId, onUpdate, seconds]);

  return seconds;
};