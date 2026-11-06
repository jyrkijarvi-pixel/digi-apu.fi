'use strict';
// Original, lighthearted lines. No automatic rotation, storage or network calls.
(() => {
  const quote = document.getElementById('it-wisdom');
  const next = document.getElementById('next-wisdom');
  const count = document.getElementById('wisdom-count');
  if (!quote || !next || !count) return;

  const wisdoms = Object.freeze([
    quote.textContent.trim(),
    'Tulostin on talon ainoa laite, joka vaatii kolme palaveria ennen yhtä paperia.',
    'Pilvi on vain jonkun toisen tietokone. Sateenvarjoa se ei sentään tarvitse.',
    'Ennen etsittiin silmälaseja. Nyt etsitään sitä välilehteä, josta musiikki kuuluu.',
    'Hiiri saa juosta pöydällä, mutta kiirettä sillä ei ole lupa määrätä.',
    'Kun kone ilmoittaa ajattelevansa, minäkin pidän tauon. Kyllä kahdelle ajattelijalle kahvia riittää.'
  ]);
  let current = 0;
  count.textContent = `1 / ${wisdoms.length}`;
  next.addEventListener('click', () => {
    current = (current + 1) % wisdoms.length;
    quote.textContent = wisdoms[current];
    count.textContent = `${current + 1} / ${wisdoms.length}`;
  });
  next.hidden = false;
  count.hidden = false;
})();
