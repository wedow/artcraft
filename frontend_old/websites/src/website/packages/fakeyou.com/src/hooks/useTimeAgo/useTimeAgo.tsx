import { useEffect, useState } from "react";

function useTimeAgo(timestamp: string) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date();
      const then = new Date(timestamp);

      const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

      if (seconds < 10) {
        setTimeAgo("a few seconds ago");
      } else if (seconds < 60) {
        setTimeAgo(`${seconds} seconds ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
          setTimeAgo(`${years} ${years === 1 ? "year" : "years"} ago`);
        } else if (months > 0) {
          setTimeAgo(`${months} ${months === 1 ? "month" : "months"} ago`);
        } else if (days > 0) {
          setTimeAgo(`${days} ${days === 1 ? "day" : "days"} ago`);
        } else if (hours > 0) {
          setTimeAgo(`${hours} ${hours === 1 ? "hour" : "hours"} ago`);
        } else if (minutes > 0) {
          setTimeAgo(`${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`);
        }
      }
    };

    calculateTimeAgo();

    // Update the time difference every minute
    // const intervalId = setInterval(calculateTimeAgo, 60000);

    // return () => clearInterval(intervalId);
  }, [timestamp]);

  return timeAgo;
}

export default useTimeAgo;
