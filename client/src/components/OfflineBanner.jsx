import { useEffect, useState } from "react";

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    let timer;

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);

      timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearTimeout(timer);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center text-sm font-medium py-2">
        You're offline
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white text-center text-sm font-medium py-2">
        Back online
      </div>
    );
  }

  return null;
};

export default OfflineBanner;