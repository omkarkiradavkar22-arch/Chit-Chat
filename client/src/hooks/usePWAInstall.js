import { useEffect, useState } from "react";

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                          window.navigator.standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installed = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      // Fallback: Show instructions
      alert("Please install this app from Chrome menu (⋮) → Install App");
      return;
    }

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setDeferredPrompt(null);
    }
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    install,
    isInstalled,
  };
}
