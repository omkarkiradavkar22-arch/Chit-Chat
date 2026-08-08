import { useEffect, useState } from "react";

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
  );

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installed = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handler
    );

    window.addEventListener(
      "appinstalled",
      installed
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );

      window.removeEventListener(
        "appinstalled",
        installed
      );
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    install,
    isInstalled,
  };
}
