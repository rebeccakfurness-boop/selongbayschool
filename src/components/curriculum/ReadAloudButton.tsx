'use client';

import { useEffect, useState } from 'react';

/** "Read to me" for a student who can't read the text yet — the browser's own text-to-speech
 * (SpeechSynthesis), so it works today with no API key, no per-use cost, and no network call.
 * Hidden entirely if the browser doesn't support it (older Safari/WebViews) rather than showing a
 * button that does nothing. */
export default function ReadAloudButton({ text, label = 'Read to me' }: { text: string; label?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Detect this client-only capability after mount so the server-rendered (window-less) pass
    // and the first client pass match, avoiding a hydration mismatch -- not a cascading update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported || !text.trim()) return null;

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
        speaking ? 'border-teal bg-teal text-white' : 'border-ink/20 bg-white text-ink hover:border-teal'
      }`}
    >
      <span aria-hidden="true">🔊</span> {speaking ? 'Stop' : label}
    </button>
  );
}
