'use strict';
// Bounded, free browser-side Q&A. No API calls, tracking, or persistent chat history.
// Optional microphone dictation may be processed by the visitor's browser speech provider.
(() => {
  const host = document.getElementById('reinikainen-chat');
  if (!host) return;
  const form = host.querySelector('form');
  const input = host.querySelector('#reinikainen-chat-input');
  const log = host.querySelector('#reinikainen-chat-log');
  const mic = host.querySelector('#reinikainen-chat-mic');
  const voice = host.querySelector('#reinikainen-chat-voice');
  const status = host.querySelector('#reinikainen-chat-status');
  const synth = window.speechSynthesis;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recording = false;
  const tidy = value => String(value).normalize('NFKC').toLocaleLowerCase('fi-FI').replace(/[^a-z0-9åäö ]/g, ' ').replace(/\s+/g,' ').trim();
  const links = Object.freeze({
    scam: ['huijausapu.html#opastus','Avaa huijausapu'],
    urgent: ['huijausapu.html#jo-tapahtui','Katso kiireelliset toimintaohjeet'],
    tech: ['digiopastus.html#opastus','Avaa digiopastus'],
    wifi: ['digiopastus.html#netti','Nettiyhteyden ohje'],
    phone: ['digiopastus.html#android','Puhelimen ohje'],
    windows: ['digiopastus.html#windows','Tietokoneen ohje'],
    password: ['turvallinen-netti.html#salasanat','Salasanojen ohje'],
    security: ['turvallinen-netti.html#opastus','Turvallisen netin ohje'],
    about: ['tietoa.html','Tietoa palvelusta']
  });
  function answer(raw) {
    const s = tidy(raw);
    const has = (...words) => words.some(w => s.includes(w));
    if (has('maksoin','maksanut','rahat meni','rahaa lähti','pankkitunnuk','korttitiedo','kortin tiedo','pankkitiedo','pankkikortin','korttinumer','hyväksyin maksun','pankkiin kirjautu','tililtä lähti','rahoja hävisi') && (has('annoin','annoimme','kerroin','lähetin','syötin','kirjoitin','paljast','jaoin','luovut','varast','vietiin','vuot','joutui','joudu','maksoin','maksanut','rahat meni','rahaa lähti','hyväksyin','tililtä lähti','rahoja hävisi') || has('pankkitunnuk','korttitiedo','kortin tiedo'))) return [
      'Nyt ei vitsailla. Jos olet maksanut epäilyttävälle taholle tai pankki- tai korttitietosi ovat voineet paljastua, ota heti yhteys omaan pankkiisi sen virallisesta numerosta tai sovelluksesta. Älä anna tunnuksia täällä.', 'urgent'
    ];
    if (has('etäyhteys','etähallinta','anydesk','teamviewer','pääsi koneelle','pääsi tietokoneelle')) return [
      'Jos tuntematon sai etäyhteyden laitteeseesi, katkaise laitteen verkkoyhteys ja pyydä luotettavaa apua. Jos pankkitietoja on voinut paljastua, ota heti yhteys pankkiisi toisella turvallisella laitteella.', 'urgent'
    ];
    if (has('tämä sivu','tää sivu','teidän sivu','digi apu','digiapu','digi-apu') && has('huijau','turvallinen','luotettava','aito','maksaa','maksullinen')) return [
      'Kas, terve epäilys! Digi-apu.fi on maksuton opastussivusto. Se ei pyydä pankkitunnuksia, salasanoja tai maksua. Varmista silti itse selaimen osoite: digi-apu.fi. Sivuston oma vakuuttelu ei koskaan yksin todista turvallisuutta.', 'about'
    ];
    if (has('huijau','epäilyttävä viesti','outo viesti','tekstiviesti','kalastelu','pakettiviesti','huijauspuhelu','epäilyttävä linkki')) return [
      'Tässä kannattaa käyttää tervettä epäluuloa. Älä avaa linkkiä, lähetä tunnuksia tai maksa kiireessä. Tarkista asia palvelun omasta sovelluksesta tai itse löytämästäsi virallisesta numerosta. Minä en pysty tarkistamaan juuri sinun viestiäsi.', 'scam'
    ];
    if (has('salasana','kirjautu','käyttäjätili','tili kaapat','kaksivaiheinen','vahvistuskoodi')) return [
      'Salasana on kuin kotiavain. Käytä eri palveluissa eri, pitkiä salasanoja ja ota lisävahvistus käyttöön. Jos salasana on paljastunut, vaihda se oikeassa palvelussa luotettavalla laitteella.', 'password'
    ];
    if (has('wifi','wi fi','wlan','netti ei','internet ei','reititin','modeemi','verkko ei','yhteys ei','ei pääse nettiin')) return [
      'Netti taisi lähteä omille teilleen! Tarkista Wi-Fi, lentotila ja oma tuttu verkko. Kokeile toimiiko netti toisella laitteella. Älä paina reitittimen Reset-painiketta hätäpäissäsi.', 'wifi'
    ];
    if (has('ääni ei','ei kuulu ää','äänet ei','mikrofoni','mikki ei','kaiutin','kuulok','soundbar')) return [
      'Ääni voi joskus karata väärään kaiuttimeen. Tarkista äänenvoimakkuus ja mykistys sekä se, mikä kaiutin tai kuuloke on valittuna. Digiopas auttaa rajaamaan pulmaa.', 'tech'
    ];
    if (has('puhelin','känny','android','samsung','appi ei','sovellus kaatu')) return [
      'Puhelinkin saa joskus oman tahtonsa. Tarkista, temppuileeko yksi sovellus vai koko laite. Tavallinen uudelleenkäynnistys voi auttaa, mutta älä palauta tehdasasetuksia sokkona.', 'phone'
    ];
    if (has('tietokone','windows','läppäri','näppäimistö','tulostin','kone ei','hidas kone')) return [
      'Kone saa temppuilla, mutta ei anneta sen määrätä tahtia. Selvitetään ensin, mikä ei toimi. Digioppaassa on turvallisia tarkistuspolkuja tavallisiin tietokonepulmiin.', 'windows'
    ];
    if (has('oletko oikea','oletko reinikainen','oletko tekoäly','kuka olet','mikä tämä on','mikä palvelu','mitä osaat','miten toimit')) return [
      'Terve! Olen Digi-avustaja, Reinikaisen hengessä kirjoitettu ohjelma, en oikea konstaapeli enkä tekoäly. Vastaan valmiilla ohjeilla. En osaa vapaata keskustelua, enkä tunne sinua henkilökohtaisesti.', 'about'
    ];
    if (has('kiitos','kiitti','selvä','hyvä juttu')) return [
      'Eipä kestä! Koneet ovat meitä varten eikä toisinpäin. Kysäise taas, jos joku digihärveli alkaa oikutella.', null
    ];
    if (has('hei','terve','moi','päivää','huomenta','iltaa')) return [
      'No päivää päivää! Mieltäkö painaa huijausviesti, salasana, puhelin, netti vai tietokone? Kysy ihan tavallisilla sanoilla.', null
    ];
    return [
      'Tuohon ei löydy minulta valmista vastausta, enkä ala keksiä omiani. Osaan neuvoa esimerkiksi huijausviesteissä, salasanoissa, puhelimen ja tietokoneen peruspulmissa. Kokeile kertoa ongelma lyhyesti tai avaa Digiopastus.', 'tech'
    ];
  }
  function message(who, text, key) {
    const entry = document.createElement('div');
    entry.className = 'reinikainen-chat-message ' + (who === 'Sinä' ? 'visitor' : 'helper');
    const name = document.createElement('strong'); name.textContent = who;
    const paragraph = document.createElement('p'); paragraph.textContent = text;
    entry.append(name, paragraph);
    if (key && links[key]) {
      const a = document.createElement('a'); a.href = links[key][0]; a.textContent = links[key][1] + ' →'; entry.append(a);
    }
    log.append(entry);
    while (log.children.length > 12) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function speak(text) {
    if (!voice.checked || !synth || !window.SpeechSynthesisUtterance) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fi-FI'; utterance.rate = 0.93; utterance.pitch = 0.92;
    const options = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('fi'));
    options.sort((a,b) => Number(/male|mies|harri|matti|pekka|onni|antti|jussi/i.test(b.name)) - Number(/male|mies|harri|matti|pekka|onni|antti|jussi/i.test(a.name)));
    if (options[0]) utterance.voice = options[0];
    utterance.onerror = event => {
      if (!['interrupted','canceled'].includes(event.error)) status.textContent = 'Puhe ei onnistunut, mutta vastaus näkyy tekstinä.';
    };
    synth.speak(utterance);
  }
  function submit(raw) {
    const q = raw.trim().slice(0, 300);
    if (!q) return;
    if (synth) synth.cancel();
    message('Sinä', q);
    const [text,key] = answer(q);
    message('Digi-avustaja', text, key);
    input.value = '';
    status.textContent = 'Vastaus näkyy keskustelussa.';
    speak(text);
  }
  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value); input.focus(); });
  host.querySelectorAll('[data-reinikainen-example]').forEach(button => {
    button.addEventListener('click', () => submit(button.dataset.reinikainenExample));
  });
  voice.addEventListener('change', () => {
    if (!voice.checked && synth) synth.cancel();
    status.textContent = voice.checked ? 'Äänivastaukset päällä.' : 'Vain tekstivastaukset.';
  });
  if (!synth || !window.SpeechSynthesisUtterance) {
    voice.checked = false; voice.disabled = true;
  }
  if (Recognition) {
    mic.hidden = false;
    mic.addEventListener('click', () => {
      if (recording && recognition) { recognition.stop(); return; }
      recognition = new Recognition();
      recognition.lang = 'fi-FI';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = event => {
        const transcript = event.results[0] && event.results[0][0] && event.results[0][0].transcript;
        if (transcript) { input.value = transcript.slice(0,300); submit(input.value); }
      };
      recognition.onstart = () => {
        recording = true;
        mic.textContent = '■ Lopeta kuuntelu';
        status.textContent = 'Mikrofoni kuuntelee. Selaimen puheentunnistus voi lähettää ääntä palveluntarjoajalle.';
      };
      recognition.onend = () => {
        recording = false;
        mic.textContent = '🎙 Puhu kysymys';
      };
      recognition.onerror = event => {
        status.textContent = 'Puheentunnistus ei onnistunut (' + event.error + '). Voit aina kirjoittaa kysymyksen.';
      };
      try { recognition.start(); } catch {
        status.textContent = 'Mikrofoni ei käynnistynyt. Kirjoittaminen toimii silti.';
      }
    });
  } else {
    mic.hidden = true;
  }
  window.addEventListener('pagehide', () => {
    if (recording && recognition) recognition.abort();
    if (synth) synth.cancel();
  });
})();