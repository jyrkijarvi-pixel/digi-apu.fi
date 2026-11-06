'use strict';
// Jyrkin Digi-avustaja: kirjoitus ja valinnainen puhe käyttävät samaa keskustelutilaa.
(() => {
  const host = document.getElementById('reinikainen-chat');
  const brain = window.ReinikainenBrain;
  if (!host || !brain) return;
  const form = host.querySelector('form');
  const input = host.querySelector('#reinikainen-chat-input');
  const log = host.querySelector('#reinikainen-chat-log');
  const mic = host.querySelector('#reinikainen-chat-mic');
  const voice = host.querySelector('#reinikainen-chat-voice');
  const status = host.querySelector('#reinikainen-chat-status');
  const voiceSelect = document.getElementById('reinikainen-voice-choice');
  const synthesis = window.speechSynthesis || null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let context = brain.newState();
  let recognition = null;
  let recording = false;
  let speechToken = 0;

  function stopSpeech() {
    speechToken += 1;
    if (synthesis) synthesis.cancel();
  }
  function appendMessage(who, content, link, tone) {
    const item = document.createElement('div');
    item.className = 'reinikainen-chat-message ' + (who === 'Sinä' ? 'visitor' : 'helper');
    if (tone === 'urgent') item.dataset.urgent = 'true';
    const name = document.createElement('strong');
    name.textContent = who;
    const body = document.createElement('p');
    body.textContent = content;
    item.append(name, body);
    if (link) {
      const a = document.createElement('a');
      a.href = link[0];
      a.textContent = link[1] + ' →';
      item.append(a);
    }
    log.append(item);
    while (log.children.length > 16) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function chosenVoice() {
    if (!synthesis) return null;
    const available = synthesis.getVoices().filter(v => /^fi(?:-|$)/i.test(v.lang));
    if (!available.length) return null;
    const choice = voiceSelect && !voiceSelect.disabled
      ? voiceSelect.options[voiceSelect.selectedIndex] : null;
    if (choice && choice.textContent) {
      const matched = available.find(v => choice.textContent.startsWith(v.name + ' ('));
      if (matched) return matched;
    }
    return available.sort((a,b) =>
      Number(/harri|male|mies|matti|onni|pekka/i.test(b.name)) -
      Number(/harri|male|mies|matti|onni|pekka/i.test(a.name)))[0];
  }
  function say(content) {
    if (!voice.checked || !synthesis || !window.SpeechSynthesisUtterance) return;
    stopSpeech();
    const token = speechToken;
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'fi-FI';
    utterance.rate = 0.92;
    utterance.pitch = 0.92;
    const selected = chosenVoice();
    if (selected) utterance.voice = selected;
    utterance.onerror = event => {
      if (token !== speechToken) return;
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        status.textContent = 'Äänivastaus epäonnistui. Vastaus näkyy tekstinä.';
      }
    };
    synthesis.speak(utterance);
  }
  function submit(raw) {
    const question = String(raw || '').trim().slice(0,300);
    if (!question) return;
    stopSpeech();
    appendMessage('Sinä', question);
    const result = brain.respond(question, context);
    context = result.state;
    appendMessage('Digi-avustaja', result.text, result.link, result.tone);
    input.value = '';
    status.textContent = result.tone === 'urgent'
      ? 'Tärkeä turvallisuusohje. Katso vastaus ja linkki.'
      : 'Vastaus näkyy keskustelussa.';
    say(result.text);
  }
  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value); input.focus(); });
  host.querySelectorAll('[data-reinikainen-example]').forEach(button => {
    button.addEventListener('click', () => submit(button.dataset.reinikainenExample));
  });
  const clearButton = host.querySelector('#reinikainen-chat-reset');
  if (clearButton) clearButton.addEventListener('click', () => {
    stopSpeech();
    if (recording && recognition) recognition.abort();
    context = brain.newState();
    log.replaceChildren();
    appendMessage('Digi-avustaja', 'No terve uudestaan! Aloitetaan puhtaalta pöydältä. Mikäs digipulma mieltä painaa?');
    input.value = '';
    status.textContent = 'Keskustelun muistissa ollut aihe tyhjennetty.';
    input.focus();
  });
  const stopButton = host.querySelector('#reinikainen-chat-stop');
  if (stopButton) stopButton.addEventListener('click', () => {
    stopSpeech();
    status.textContent = 'Puhe pysäytetty. Voit jatkaa kirjoittamalla tai puhumalla.';
  });
  voice.addEventListener('change', () => {
    if (!voice.checked) stopSpeech();
    status.textContent = voice.checked ? 'Äänivastaukset päällä.' : 'Vain tekstivastaukset.';
  });
  if (!synthesis || !window.SpeechSynthesisUtterance) {
    voice.checked = false;
    voice.disabled = true;
    if (stopButton) stopButton.hidden = true;
  }
  if (Recognition) {
    mic.hidden = false;
    mic.addEventListener('click', () => {
      if (recording && recognition) {
        recognition.stop();
        return;
      }
      // Lopetetaan äänivastaus ennen mikrofonin avaamista, ettei avustaja kuuntele itseään.
      stopSpeech();
      recognition = new Recognition();
      recognition.lang = 'fi-FI';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        recording = true;
        mic.textContent = '■ Lopeta kuuntelu';
        status.textContent = 'Mikrofoni kuuntelee. Selain voi käsitellä äänen verkkopalvelussa.';
      };
      recognition.onresult = event => {
        const transcript = event.results[0] && event.results[0][0] && event.results[0][0].transcript;
        if (transcript) {
          // Tekstiä voi jatkaa aina käsin. Tunnistettu puhe käsitellään samoin kuin kirjoitus.
          input.value = transcript.slice(0,300);
          submit(input.value);
        }
      };
      recognition.onerror = event => {
        if (event.error !== 'aborted') status.textContent =
          'Puheentunnistus ei onnistunut (' + event.error + '). Kirjoittaminen toimii silti.';
      };
      recognition.onend = () => {
        recording = false;
        mic.textContent = '🎙 Puhu kysymys';
      };
      try { recognition.start(); }
      catch { status.textContent = 'Mikrofoni ei käynnistynyt. Voit kirjoittaa kysymyksen.'; }
    });
  } else {
    mic.hidden = true;
  }
  window.addEventListener('pagehide', () => {
    if (recognition && recording) recognition.abort();
    stopSpeech();
    context = brain.newState();
  });
})();
