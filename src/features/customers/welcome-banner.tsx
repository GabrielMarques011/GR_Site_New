"use client";

import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";

const STORAGE_KEY = "gr-design:welcome-shown";

export function WelcomeBanner({ firstName }: { firstName: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    } catch {
      // sessionStorage indisponível (modo privado) — só não mostra o banner
      // repetidamente; a navegação continua funcionando normalmente.
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-lilac-200 bg-lilac-50">
      <div className="container-page flex items-center justify-between gap-3 py-2.5 text-sm text-lilac-800">
        <span className="flex items-center gap-2">
          <Heart className="size-4 shrink-0" />
          Que bom ter você de volta, {firstName}! 💜 É sempre um prazer receber
          você na GR Design.
        </span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-lilac-100"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
