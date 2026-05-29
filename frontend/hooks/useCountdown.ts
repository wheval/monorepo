import { useState, useEffect } from "react";

export function useCountdown(targetTimeStr?: string) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!targetTimeStr) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetTimeStr).getTime() - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimeStr]);

  const formatTime = () => {
    if (timeLeft <= 0) return "00:00:00";
    const days = Math.floor(timeLeft / (3600 * 24));
    const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const pad = (n: number) => String(n).padStart(2, "0");

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return { timeLeft, formatTime, isExpired: timeLeft <= 0 };
}
