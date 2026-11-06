'use strict';
// No requests, persistence, credentials or HTML interpolation from user input.
const DigiApu = Object.freeze({
  normalize(value) { return String(value).normalize('NFKC').toLocaleLowerCase('fi-FI').trim().replace(/\s+/g, ' '); },
  matches(text, query) {
    const words = this.normalize(query).split(' ').filter(Boolean);
    const haystack = this.normalize(text);
    return words.every(word => haystack.includes(word));
  },
  assessment(count) {
    return count > 0
      ? { title: 'Pysähdy ja varmista asia muuta kautta.', text: `Valitsit ${count} ${count === 1 ? 'varoitusmerkin' : 'varoitusmerkkiä'}. Älä maksa tai luovuta tietoja. Avaa palvelu itse sen omasta sovelluksesta tai itse tarkistamastasi osoitteesta.` }
      : { title: 'Tarkistuslista ei todista viestiä turvalliseksi.', text: 'Yksikin merkki riittää syyksi pysähtyä. Huijaus voi myös näyttää aivan tavalliselta viestiltä.' };
  }
});
if (typeof module !== 'undefined') module.exports = DigiApu;
if (typeof document !== 'undefined') {
  const size = document.getElementById('text-size');
  if (size) {
    size.hidden = false;
    size.addEventListener('click', () => {
      const large = document.documentElement.classList.toggle('large-text');
      size.setAttribute('aria-pressed', String(large));
      // Keep its accessible name stable; pressed state communicates selection.
      document.getElementById('size-status').textContent = large ? 'Teksti suurennettu.' : 'Tavallinen tekstikoko palautettu.';
    });
  }
  const search = document.getElementById('topic-search');
  if (search) {
    document.querySelector('.topic-search').hidden = false;
    const cards = Array.from(document.querySelectorAll('#topics .topic'));
    const filter = () => {
      let visible = 0;
      for (const card of cards) {
        card.hidden = !DigiApu.matches(card.textContent + ' ' + card.dataset.keywords, search.value);
        if (!card.hidden) visible++;
      }
      document.getElementById('search-status').textContent = `Näytetään ${visible} ${visible === 1 ? 'aihe' : 'aihetta'} ${cards.length} aiheesta.`;
      document.getElementById('no-results').hidden = visible !== 0;
    };
    search.addEventListener('input', filter);
    document.getElementById('clear-search').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    filter();
  }
  const result = document.getElementById('check-result');
  if (result) {
    const checks = Array.from(document.querySelectorAll('input[name="warning"]'));
    const update = () => {
      const count = checks.filter(check => check.checked).length;
      const message = DigiApu.assessment(count);
      result.querySelector('strong').textContent = message.title;
      result.querySelector('p').textContent = message.text;
      result.dataset.warning = String(count > 0);
    };
    checks.forEach(check => check.addEventListener('change', update));
    const reset = document.getElementById('reset-checks');
    reset.hidden = false;
    reset.addEventListener('click', () => { checks.forEach(check => { check.checked = false; }); update(); });
    window.addEventListener('pageshow', update);
    update();
  }
  const print = document.getElementById('print-guide');
  if (print) { print.hidden = false; print.addEventListener('click', () => window.print()); }
}
