"use client";

import { useState, useEffect } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default true
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    // Check if window is available
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Check localStorage for pending queue
      const checkQueue = () => {
        try {
          const queue = JSON.parse(localStorage.getItem("tpv_offline_queue") || "[]");
          setPendingSyncs(queue.length);
        } catch (e) {
          setPendingSyncs(0);
        }
      };
      
      checkQueue();
      // Simple poll to check queue length changes (since other tabs/same tab might modify it)
      const interval = setInterval(checkQueue, 2000);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        clearInterval(interval);
      };
    }
  }, []);

  return { isOnline, pendingSyncs };
}
