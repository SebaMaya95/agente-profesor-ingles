// Voz del navegador: síntesis (escuchar) y reconocimiento (hablar). No consume tokens ni pasa por nuestro servidor.
// El reconocimiento funciona en Chrome, Edge y Safari; en Firefox suele estar desactivado (se cae a escribir).

export function createSpeech(win = globalThis) {
  const synth = win.speechSynthesis;
  const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  let voice = null;

  const pickVoice = () => {
    const voices = synth?.getVoices?.() ?? [];
    voice =
      voices.find((v) => v.lang === "en-US" && /aria|jenny|samantha|zira|google us|female/i.test(v.name)) ??
      voices.find((v) => v.lang?.replace("_", "-").startsWith("en-US")) ??
      voices.find((v) => v.lang?.startsWith("en")) ??
      null;
  };
  if (synth) {
    pickVoice();
    synth.addEventListener?.("voiceschanged", pickVoice);
  }

  return {
    canSpeak: Boolean(synth),
    canListen: Boolean(Recognition),

    speak(text, { rate = 0.92 } = {}) {
      return new Promise((resolve) => {
        if (!synth) return resolve();
        synth.cancel();
        const utterance = new win.SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = rate;
        if (voice) utterance.voice = voice;
        utterance.onend = utterance.onerror = () => resolve();
        synth.speak(utterance);
      });
    },

    stopSpeaking: () => synth?.cancel(),

    // Devuelve { stop }. onText(texto, esFinal) va llegando mientras el alumno habla.
    listen({ onText, onEnd, onError }) {
      const rec = new Recognition();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = (event) => {
        const text = [...event.results].map((r) => r[0].transcript).join(" ").trim();
        onText(text, event.results[event.results.length - 1].isFinal);
      };
      rec.onerror = (event) => onError?.(event.error);
      rec.onend = () => onEnd?.();
      rec.start();
      return { stop: () => rec.stop() };
    },
  };
}
