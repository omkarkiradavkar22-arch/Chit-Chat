import { useEffect, useState } from "react";

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
  );
  

  useEffect(() => {
    console.log("🟡 PWA hook loaded");
    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );


    const checkInstalled = () => {
      const standalone =
        mediaQuery.matches ||
        window.navigator.standalone === true;

      setIsInstalled(standalone);
    };

    const handleBeforeInstallPrompt = (event) => {
      console.log("🔥 beforeinstallprompt FIRED");

      event.preventDefault();

      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      console.log("✅ ChitChat installed");

      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    // Check current state
    checkInstalled();

    // Listen for Chrome install prompt
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    // Listen after installation
    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    mediaQuery.addEventListener(
      "change",
      checkInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );

      mediaQuery.removeEventListener(
        "change",
        checkInstalled
      );
    };
  }, []);

  const install = async () => {
    console.log(
      "📦 Install button clicked"
    );

    if (!deferredPrompt) {
      console.log(
        "❌ No beforeinstallprompt event available"
      );

      return false;
    }

    try {
      console.log(
        "🚀 Showing install prompt..."
      );

      await deferredPrompt.prompt();

      const choice =
        await deferredPrompt.userChoice;

      console.log(
        "📱 Install choice:",
        choice.outcome
      );

      setDeferredPrompt(null);

      return choice.outcome === "accepted";
    } catch (error) {
      console.error(
        "❌ Install prompt error:",
        error
      );

      return false;
    }
  };

  return {
    canInstall:
      !!deferredPrompt && !isInstalled,

    install,

    isInstalled,
  };
}
