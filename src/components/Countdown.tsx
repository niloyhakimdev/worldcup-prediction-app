import { useState, useEffect } from "react";
import { Timer, Lock } from "lucide-react";

interface CountdownProps {
  targetDate: string; // ISO string or parsable format
  onExpire?: () => void;
}

export default function Countdown({ targetDate, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let newTimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isExpired: false,
        };
      }

      setTimeLeft(newTimeLeft);

      if (newTimeLeft.isExpired && onExpire) {
        onExpire();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold tracking-wide uppercase animate-pulse">
        <Lock className="w-3.5 h-3.5" />
        <span>Prediction Closed</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-amber-400 uppercase">
        <Timer className="w-3.5 h-3.5 animate-pulse" />
        <span>Predictions Lock in</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-2.5 min-w-[50px] md:min-w-[60px] ">
          <span className="text-lg md:text-xl font-bold text-white font-mono leading-none">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">Days</span>
        </div>
        <span className="text-gray-500 font-bold">:</span>
        <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-2.5 min-w-[50px] md:min-w-[60px] ">
          <span className="text-lg md:text-xl font-bold text-white font-mono leading-none">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">Hrs</span>
        </div>
        <span className="text-gray-500 font-bold">:</span>
        <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-2.5 min-w-[50px] md:min-w-[60px] ">
          <span className="text-lg md:text-xl font-bold text-white font-mono leading-none">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">Mins</span>
        </div>
        <span className="text-gray-500 font-bold">:</span>
        <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-2.5 min-w-[50px] md:min-w-[60px] ">
          <span className="text-lg md:text-xl font-bold text-amber-400 font-mono leading-none">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">Secs</span>
        </div>
      </div>
    </div>
  );
}
