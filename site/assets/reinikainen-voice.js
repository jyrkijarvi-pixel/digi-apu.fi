'use strict';
// An opt-in, browser-only speech greeting. No audio is uploaded or recorded.
(() => {
  const button = document.getElementById('reinikainen-voice-toggle');
  const text = document.getElementById('reinikainen-tervetuloa-teksti');
  const select = document.getElementById('reinikainen-voice-choice');
  const label = document.getElementById('reinikainen-voice-choice-label');
  const status = document.getElementById('reinikainen-voice-status');
  const speech = window.speechSynthesis;
  if (!button || !text || !select || !label || !status) return;

  if (!speech || !window.SpeechSynthesisUtterance) {
    button.disabled = true;
    status.textContent = 'Tämä selain ei tue puhetoimintoa.';
    return;
  }

  let speaking = false;
  let voices = [];
  const voiceScore = (voice) => {
    const n = voice.name.toLowerCase();
    let score = 0;
    if (voice.lang.toLowerCase() === 'fi-fi') score += 10;
    if (/male|mies|harri|matti|pekka|onni|heikki|antti|jussi/.test(n)) score += 5;
    if (/female|nainen/.test(n)) score -= 4;
    if (voice.localService) score += 1;
    return score;
  };
  const setIdle = () => {
    speaking = false;
    button.textContent = '▶ Kuuntele tervetulotoivotus';
    button.setAttribute('aria-pressed', 'false');
  };
  const refreshVoices = () => {
    const previous = select.value;
    voices = speech.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('fi')).sort((a, b) => voiceScore(b) - voiceScore(a));
    select.replaceChildren();
    voices.forEach((voice, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = voice.name + ' (' + voice.lang + ')';
      select.appendChild(option);
    });
    if (voices.length) {
      const existing = voices.findIndex(v => v.name === previous);
      select.value = String(existing >= 0 ? existing : 0);
      label.hidden = voices.length < 2;
    } else {
      label.hidden = true;
    }
  };

  button.addEventListener('click', () => {
    if (speaking || speech.speaking || speech.pending) {
      speech.cancel();
      setIdle();
      status.textContent = 'Puhe pysäytetty.';
      return;
    }
    refreshVoices();
    const utterance = new SpeechSynthesisUtterance(text.textContent.trim());
    utterance.lang = 'fi-FI';
    utterance.rate = 0.91;
    utterance.pitch = 0.91;
    const selectedVoice = voices[Number(select.value)];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => {
      setIdle();
      status.textContent = 'Tervetulotoivotus päättyi.';
    };
    utterance.onerror = (event) => {
      setIdle();
      status.textContent = event.error === 'canceled' || event.error === 'interrupted'
        ? 'Puhe keskeytettiin.'
        : 'Puhe ei käynnistynyt. Kokeile toista ääntä tai selainta.';
    };
    speech.cancel();
    speaking = true;
    button.textContent = '■ Pysäytä puhe';
    button.setAttribute('aria-pressed', 'true');
    status.textContent = 'Toistetaan tervetulotoivotusta.';
    speech.speak(utterance);
  });

  refreshVoices();
  if (typeof speech.addEventListener === 'function') {
    speech.addEventListener('voiceschanged', refreshVoices);
  } else {
    speech.onvoiceschanged = refreshVoices;
  }
  window.addEventListener('pagehide', () => speech.cancel());
})();