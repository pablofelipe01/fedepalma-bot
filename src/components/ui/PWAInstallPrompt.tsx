'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que Chrome 67 y anteriores muestren automáticamente el prompt
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA instalada por el usuario');
    } else {
      console.log('Usuario rechazó la instalación');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-green-800 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Instalar Fedepalma 2025</h3>
          <p className="text-sm opacity-90">
            Instala la app para un acceso más rápido
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInstallButton(false)}
            className="px-3 py-1 text-sm border border-white/30 rounded hover:bg-white/10"
          >
            Después
          </button>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1 text-sm bg-white text-green-800 rounded hover:bg-gray-100"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}