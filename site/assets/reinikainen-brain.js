'use strict';
// Jyrkin Digi-avustaja: sääntöpohjainen Reinikaismainen opastaja.
// Säilyttää vain keskustelun aiheen väliaikaisesti avoimella sivulla. Ei API-kutsuja.
const ReinikainenBrain = (() => {
  const links = Object.freeze({
    scam: ['huijausapu.html#opastus', 'Avaa huijausapu'],
    urgent: ['huijausapu.html#jo-tapahtui', 'Kiireelliset toimintaohjeet'],
    tech: ['digiopastus.html#opastus', 'Avaa digiopastus'],
    wifi: ['digiopastus.html#netti', 'Nettiyhteyden ohje'],
    phone: ['digiopastus.html#android', 'Puhelimen ohje'],
    windows: ['digiopastus.html#windows', 'Tietokoneen ohje'],
    password: ['turvallinen-netti.html#salasanat', 'Salasanojen ohje'],
    about: ['tietoa.html', 'Tietoa Digi-avusta']
  });
  const clean = value => String(value || '').normalize('NFKC').toLocaleLowerCase('fi-FI')
    .replace(/[^a-z0-9åäö ]/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (s, ...tokens) => tokens.some(token => s.includes(token));
  const newState = () => ({ topic: null, urgent: false, turns: 0 });
  function respond(raw, previous = newState()) {
    const s = clean(raw);
    const state = { topic: previous.topic || null, urgent: !!previous.urgent, turns: (previous.turns || 0) + 1 };
    const output = (text, link = null, tone = 'calm', topic = state.topic, urgent = false) => {
      state.topic = topic; state.urgent = urgent;
      return { text, link: link ? links[link] : null, tone, state };
    };
    if (!s) return output('Kysy vain. Ei tarvitse osata hienoja sanoja.');
    const negatedPayment = has(s, 'en maksanut', 'en ole maksanut', 'en maksanu', 'mitään en maksanut', 'en ehtinyt maksaa') && !has(s, 'mutta maksoin', 'kuitenkin maksoin', 'silti maksoin', 'maksoin jo', 'ehdin maksaa');
    const negatedDisclosure = has(s, 'en antanut', 'en ole antanut') && !has(s, 'mutta annoin', 'silti annoin');
    const payment = has(s, 'maksoin', 'maksanut', 'maksettu', 'maksu meni', 'rahaa lähti', 'rahat meni',
      'siirsin rahaa', 'tililtä lähti', 'rahat katosi', 'hyväksyin maksun', 'maksoin jo', 'ehdin maksaa', 'ehdin jo maksaa', 'maksoin sen', 'maksu lähti');
    const bankDetails = has(s, 'pankkitiedo', 'pankkitie', 'pankkitunnu', 'verkkopank', 'korttitiedo',
      'kortin tiedo', 'kortin numer', 'korttinumero', 'luottokortin', 'maksukortin', 'tunnusluku');
    const handedOver = has(s, 'annoin', 'syötin', 'kerroin', 'luovutin', 'lähetin', 'kirjoitin', 'paljastin',
      'varast', 'vuoti', 'vietiin', 'napattiin', 'joutui', 'jäi huijarille');
    const suspicious = has(s, 'huijau', 'huijari', 'epäilyttävä', 'kalastelu', 'tekstiviesti',
      'pakettiviesti', 'outo viesti', 'pankista viesti', 'pankin viesti', 'linkki viestissä',
      'soitti pankista', 'sain viestin', 'sain linkin', 'pankista ', 'pankilta ', 'kummallisen viestin', 'oudon viestin');
    const site = has(s, 'tämä sivu', 'tää sivu', 'teidän sivu', 'digi apu', 'digiapu', 'digi avustaja',
      'digi-avustaja', 'digi-apu');
    const remote = has(s, 'etäyhteys', 'etäyhteyd', 'etähallin', 'anydesk', 'teamviewer',
      'pääsi koneelle', 'pääsi tietokoneelle', 'hallitsi konetta');
    const unknown = has(s, 'en tiedä', 'en osaa sanoa', 'en ole varma', 'en muista', 'ehkä');
    const followup = has(s, 'mitä nyt', 'mitä teen', 'mitäs nyt', 'entä nyt', 'mitä seuraavaksi',
      'mitä sitten', 'mihin soitan', 'mistä tiedän');
    const adviceBank = 'Nyt jätetään vitsit sikseen. Jos maksoit huijarille tai pankki- tai korttitietosi voivat olla vaarassa, ota heti yhteys omaan pankkiisi sen virallisen numeron tai sovelluksen kautta. Älä hyväksy uusia maksuja äläkä kerro tunnuksia täällä.';
    // Kiireellisen pankkitilanteen tunnistus ennen kaikkea muuta.
    if ((bankDetails && (!negatedDisclosure || suspicious || state.topic === 'scam'))
      || payment && !negatedPayment && (suspicious || state.topic === 'scam' || has(s, 'jo', 'huijar', 'väärälle', 'epäilyttävälle', 'ehdin'))) {
      return output(adviceBank, 'urgent', 'urgent', 'scam', true);
    }
    if (remote) return output(
      'Jos tuntematon pääsi etäyhteydellä laitteeseesi, katkaise laitteen verkkoyhteys ja pyydä luotettavaa apua. Jos pankkitietoja saattoi näkyä, ota heti yhteys pankkiin toisella turvallisella laitteella.',
      'urgent', 'urgent', 'scam', true);
    if (state.topic === 'scam' && state.urgent && (followup || unknown || has(s, 'okei', 'selvä', 'apua'))) {
      return output(adviceBank, 'urgent', 'urgent', 'scam', true);
    }
    if (site && has(s, 'huijau', 'turvallinen', 'luotettava', 'aito', 'maksaa', 'maksullinen')) {
      return output('Hyvä kun kysyt! Digi-apu.fi on Jyrkin maksuton opastussivusto. Se ei pyydä pankkitunnuksia, salasanoja tai maksuja. Tarkista silti itse selaimen osoite; sivun oma vakuuttelu ei yksin todista aitoutta.',
        'about', 'calm', 'about');
    }
    if (negatedPayment && (suspicious || state.topic === 'scam')) {
      return output('Hyvä, ettet ehtinyt maksaa tai antaa tietoja. Älä avaa viestin linkkiä, vaan tarkista asia itse palvelun viralliselta sivulta tai sovelluksesta. Jos tilanteessa tapahtui sittenkin muuta, kerro yleisellä tasolla.',
        'scam', 'calm', 'scam');
    }
    if (suspicious || (state.topic === 'scam' && (followup || unknown || has(s, 'avasin linkin', 'painoin linkkiä')))) {
      return output('Kas, terve epäilys on tässä paikallaan. Älä avaa viestin linkkiä, luovuta tunnuksia tai maksa kiireessä. Tarkista asia palvelun omasta sovelluksesta. Ehditkö jo maksaa, antaa tietoja tai asentaa jotain? Vastaa vain yleisellä tasolla.',
        'scam', 'calm', 'scam');
    }
    if (payment && !negatedPayment) return output(
      'Jos maksoit epäilyttävälle taholle, ota heti yhteyttä pankkiisi sen virallisesta numerosta. Jos maksu oli tavallinen ja luotettava, en pysty arvioimaan sitä täällä. Älä jaa tilitietoja.',
      'urgent', 'urgent', 'scam', true);
    if (bankDetails) return output(
      'Jos pankki- tai korttitiedot ovat voineet päätyä vääriin käsiin, ota heti yhteys omaan pankkiisi sen virallista kautta. Älä kirjoita tietoja tähän keskusteluun.',
      'urgent', 'urgent', 'scam', true);
    if (has(s, 'salasana', 'salasanani', 'kirjautu', 'käyttäjätili', 'tili kaapat', 'vahvistuskoodi')) {
      return output('Salasana on kuin kotiavain. Jos epäilet sen paljastuneen, vaihda se oikeassa palvelussa luotettavalla laitteella ja ota lisävahvistus käyttöön. Älä kirjoita itse salasanaa tänne.',
        'password', 'calm', 'password');
    }
    if (has(s, 'wifi', 'wi fi', 'wlan', 'netti ei', 'internet ei', 'reititin', 'modeemi', 'verkko ei', 'yhteys ei', 'ei pääse nettiin')) {
      return output('No johan netti lähti omille teilleen! Tarkista ensin Wi-Fi, lentotila ja oma tuttu verkko. Toimiiko yhteys toisella laitteella? Älä paina reitittimen Reset-painiketta hätäpäissäsi.',
        'wifi', 'playful', 'wifi');
    }
    if (has(s, 'ääni ei', 'ei kuulu ää', 'äänet ei', 'mikrofoni', 'mikki ei', 'kaiutin', 'kuulok', 'soundbar')) {
      return output('Kas, ääni taisi piiloutua väärään kaiuttimeen. Tarkista mykistys, äänenvoimakkuus ja valittu kaiutin. Toimiiko ääni muissa sovelluksissa?',
        'tech', 'playful', 'audio');
    }
    if (has(s, 'puhelin', 'känny', 'android', 'samsung', 'sovellus kaatu')) {
      return output('Puhelinkin saa välillä oman tahtonsa. Temppuileeko yksi sovellus vai koko puhelin? Kokeile tavallista uudelleenkäynnistystä, mutta älä palauta tehdasasetuksia sokkona.',
        'phone', 'playful', 'phone');
    }
    if (has(s, 'tietokone', 'windows', 'läppäri', 'näppäimistö', 'tulostin', 'kone ei', 'hidas kone')) {
      return output('No niin, koneella on taas omia ajatuksia! Mikä tarkalleen temppuilee: koko kone vai yksi ohjelma? Aloitetaan turvallisista tarkistuksista.',
        'windows', 'playful', 'windows');
    }
    // Lyhyt, kontekstissa ymmärrettävä jatkokysymys. Ei pysyvää profilointia.
    if (followup || unknown || has(s, 'ei toimi vieläkään', 'ei auttanut', 'ei vieläkään')) {
      if (state.topic === 'wifi') return output('Toimiiko kotisi netti muilla laitteilla? Se auttaa erottamaan yhteysvian yksittäisestä laiteviasta. Älä vielä nollaa mitään asetuksia.', 'wifi', 'calm', 'wifi');
      if (state.topic === 'audio') return output('Tarkista vielä, onko haluamasi kaiutin valittuna. Jos ääni puuttuu vain yhdessä sovelluksessa, tarkista sen oma mykistys.', 'tech', 'calm', 'audio');
      if (state.topic === 'password') return output('Avaa palvelun oma virallinen kirjautumissivu ja käytä siellä olevaa salasanan palautusta. Älä käytä viestissä tullutta epäilyttävää linkkiä.', 'password', 'calm', 'password');
      if (state.topic === 'phone' || state.topic === 'windows') return output('Kerro mikä laite on kyseessä ja mitä tapahtuu, kun yrität käyttää sitä. Älä vielä poista tiedostoja tai nollaa laitetta.', 'tech', 'calm', state.topic);
    }
    if (has(s, 'oletko oikea', 'oletko reinikainen', 'oletko tekoäly', 'kuka olet', 'mikä tämä on',
      'mikä palvelu', 'mitä osaat', 'miten toimit', 'reinikainen')) {
      return output('Terve! Olen Jyrkin Digi-avustaja Reinikaisen hengessä. En ole oikea konstaapeli enkä näyttelijän ääni, vaan maksuton sääntöpohjainen opastaja. Maalaisjärjellä ja pilkkeellä, mutta vakavissa asioissa vitsit syrjään.',
        'about', 'playful', 'about');
    }
    if (has(s, 'kiitos', 'kiitti', 'selvä', 'hyvä juttu')) return output(
      'Eipä kestä! Koneet ovat ihmisiä varten, eivät toisinpäin. Kysäise uudestaan, jos digihärveli oikuttelee.',
      null, 'warm', state.topic);
    if (has(s, 'hei ', 'terve ', 'moi ', 'päivää', 'huomenta', 'iltaa') || s === 'hei' || s === 'terve' || s === 'moi') return output(
      'No päivää päivää! Mitäs digihärveliä tänään selvitetään? Huijausviesti, netti, salasana vai puhelin?',
      null, 'playful', null);
    return output('Tuohon minulla ei ole varmaa valmisohjetta, enkä ala keksiä omiani. Kerro pulma lyhyesti tai avaa Digiopastus. Sinun ei tarvitse osata hienoja sanoja.',
      'tech', 'warm', null);
  }
  return Object.freeze({ newState, respond, clean, links });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ReinikainenBrain;
if (typeof window !== 'undefined') window.ReinikainenBrain = ReinikainenBrain;
