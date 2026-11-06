'use strict';
// Reviewed, bounded decision paths. No model, remote requests or stored answers.
const DigiGuidance = (() => {
  const refs = Object.freeze({
    fraud: ['Traficom: jos tulit huijatuksi', 'https://traficom.fi/fi/arjen-tietoturva/toimi-nain-jos-tulit-huijatuksi'],
    remote: ['Traficom: huijauspuhelut ja etäyhteys', 'https://traficom.fi/fi/huijauspuhelut-tunnista-huijaus-ja-toimi-oikein'],
    police: ['Poliisi: petosrikokset', 'https://poliisi.fi/petosrikokset'],
    identity: ['Suomi.fi: tietovuoto-opas', 'https://www.suomi.fi/oppaat/tietovuoto'],
    shop: ['KKV: huijaukset', 'https://www.kkv.fi/kuluttaja-asiat/huijaukset/'],
    accounts: ['Traficom: käyttäjätilien suojaaminen', 'https://traficom.fi/fi/arjen-tietoturva/nasevia-neuvoja-tiliesi-turvaamiseksi'],
    wifi: ['Microsoft: Wi-Fi-yhteyden ongelmat', 'https://support.microsoft.com/fi-fi/windows/experience/connectivity-networking/fix-wi-fi-connection-issues-in-windows'],
    phoneWifi: ['Google: puhelimen Wi-Fi-ongelmat', 'https://support.google.com/pixelphone/answer/6183600?hl=fi'],
    audio: ['Microsoft: ääniongelmien korjaaminen', 'https://support.microsoft.com/fi-fi/windows/hardware/audio/fix-sound-or-audio-problems-in-windows']
  });
  const option = (id,label,next) => ({id,label,next});
  const q = (question,help,options) => ({kind:'question',question,help,options});
  const choices = (yes,no,unknown) => [option('yes','Kyllä',yes),option('no','Ei',no),option('unknown','En tiedä',unknown)];
  const result = (title,steps,referenceKeys=[],tone='note',intro='') => ({kind:'result',title,steps,refs:referenceKeys.map(key=>refs[key]),tone,intro});
  const nodes = {
    bank: q('Oletko maksanut rahaa, hyväksynyt maksun tai antanut pankki- tai korttitietoja?', 'Älä kirjoita tietoja tänne. Valitse vain tilanteeseesi sopiva vastaus.',choices('bank-now','remote','bank-uncertain')),
    'bank-now':result('Ota heti yhteys omaan pankkiisi.',[
      'Lopeta epäilyttävä puhelu tai viestittely. Älä tee uusia maksuja tai hyväksy tunnistuksia toisen pyynnöstä.',
      'Ota heti yhteys pankkiin sen omasta sovelluksesta tai itse tarkistamastasi virallisesta numerosta. Kerro, mitä tapahtui. Pankki neuvoo tarvittavissa sulkutoimissa.',
      'Jos annoit myös etäyhteyden tai asensit ohjelman, katkaise tämän laitteen verkkoyhteys ja hoida pankkiasiat toisella luotettavalla laitteella.',
      'Säilytä viestit ja maksutiedot poliisia varten ja tee rikosilmoitus. Älä lähetä niitä meille.'
    ],['fraud','police'],'urgent','Viranomaisohjeen mukainen kiireellinen toiminta. Älä odota sähköpostivastausta tältä sivustolta.'),
    'bank-uncertain':result('Älä arvaa pankkiasioissa — varmista heti.',[
      'Jos epäilet maksaneesi tai luovuttaneesi pankki- tai korttitietoja, ota heti yhteys pankkiisi sen virallista kanavaa pitkin.',
      'Älä tarkista asiaa viestin linkistä tai soittajan antamasta numerosta. Älä hyväksy uusia maksuja tai tunnistuksia.',
      'Jos laitteella voi olla vieraan etäyhteys, katkaise sen verkkoyhteys ja käytä yhteydenottoon toista luotettavaa laitetta.'
    ],['fraud','remote'],'urgent','Vastauksesi perusteella tilannetta ei voida sulkea pois. Tämä sivu ei näe pankkitiliäsi.'),
    remote:q('Asensitko ohjelman tai annoitko etäyhteyden tuntemattoman pyynnöstä?', 'Etäyhteys tarkoittaa, että toinen ihminen voi nähdä tai käyttää laitettasi.',choices('remote-now','secrets','remote-uncertain')),
    'remote-now':result('Katkaise laitteen verkkoyhteys.',[
      'Lopeta yhteydenpito epäilyttävään auttajaan. Katkaise Wi-Fi ja irrota mahdollinen verkkokaapeli; älä jatka pankkiasioita tällä laitteella.',
      'Jos pankkitietoja, maksuja tai pankkiin kirjautumista saattoi näkyä toiselle, ota heti yhteys pankkiin toisella luotettavalla laitteella tai puhelimella.',
      'Pyydä luotettavaa ammattilaista tarkistamaan laite ja poistamaan epäilyttävä etähallintaohjelma. Älä asenna uutta korjaajaa soittajan linkistä.',
      'Vaihda vaarantuneet salasanat toisella luotettavalla laitteella. Säilytä tapahtumatiedot ja tee tarvittaessa rikosilmoitus.'
    ],['remote','fraud','police'],'urgent','Viranomaisohje etähallintahuijauksen varalle. Tämä opastus ei itse katkaise yhteyksiä tai muuta laitetta.'),
    'remote-uncertain':result('Varmista ensin, onko toisella pääsy laitteeseesi.',[
      'Älä jatka pankkiasioita tai syötä salasanoja laitteella, jolla epäilet vieraan etäyhteyttä.',
      'Jos vieras on ohjannut ohjelman asentamista tai näet hänen käyttävän laitettasi, katkaise verkkoyhteys ja pyydä luotettavaa apua.',
      'Jos pankkitietoja on voinut paljastua, ota heti yhteys pankkiin toisella luotettavalla laitteella.'
    ],['remote','fraud'],'urgent'),
    secrets:q('Annoitko muita salasanoja tai henkilötietoja?', 'Pankki- ja korttitiedot kuuluvat edelliseen kiireelliseen pankkiohjeeseen. Muita tietoja voivat olla sähköpostin salasana tai henkilötunnus. Älä kirjoita niitä tänne.',choices('secret-type','channel','secret-uncertain')),
    'secret-type':q('Minkä tyyppisiä tietoja annoit?', 'Valitse vain tietojen laji. Älä anna itse tietoja.',[
      option('password','Salasanan','account'),option('identity','Henkilötietoja','identity'),option('both','Molempia','both')]),
    account:result('Suojaa vaarantunut käyttäjätili.',[
      'Avaa oikea palvelu itse sen omasta sovelluksesta tai tutusta osoitteesta. Vaihda paljastunut salasana luotettavalla laitteella.',
      'Vaihda sama salasana myös muista palveluista, joissa käytit sitä. Ota kirjautumisen lisävahvistus käyttöön palvelun omien ohjeiden mukaan.',
      'Tarkista palvelun ohjeista muiden kirjautumisistuntojen sulkeminen ja palautustietojen oikeellisuus. Jos et pääse tilille, käytä palvelun virallista tilin palautusta.'
    ],['accounts','fraud']),
    identity:result('Katso henkilötietojen vuotamiseen sopivat toimet.',[
      'Tallenna itsellesi tieto siitä, mitä luovutit ja milloin. Älä lähetä tietoja tähän palveluun.',
      'Avaa Suomi.fi:n tietovuoto-opas. Tarvittavat toimet riippuvat siitä, mitä tietoja on vuotanut ja onko niitä käytetty väärin.',
      'Jos epäilet rikosta, tee rikosilmoitus poliisille. Jos myös pankki- tai korttitiedot vaarantuivat, pankkiin on otettava heti yhteys.'
    ],['identity','police','fraud']),
    both:result('Suojaa käyttäjätilit ja selvitä henkilötietojen tilanne.',[
      'Vaihda paljastuneet ja muualla käytetyt samat salasanat palveluiden oikeilla sivuilla luotettavalla laitteella. Ota lisävahvistus käyttöön.',
      'Tarkista Suomi.fi:n tietovuoto-oppaasta juuri vuotaneisiin henkilötietoihin sopivat toimet.',
      'Säilytä tapahtumatiedot ja tee tarvittaessa rikosilmoitus. Jos myös pankki- tai korttitietoja saattoi paljastua, ota heti yhteys pankkiin.'
    ],['accounts','identity','police']),
    'secret-uncertain':result('Selvitä rauhassa, mitä tietoja annoit.',[
      'Älä lähetä uusia tietoja tai hyväksy kirjautumisia. Jos pankkitietojen paljastuminen on mahdollista, ota heti yhteys pankkiin.',
      'Jos kirjoitit salasanan epäilyttävälle sivulle, vaihda se oikeassa palvelussa luotettavalla laitteella.',
      'Henkilötietojen mahdolliseen vuotoon saat tilanteen mukaiset ohjeet Suomi.fi:n tietovuoto-oppaasta.'
    ],['fraud','accounts','identity']),
    channel:q('Missä epäilyttävä tilanne tuli vastaan?', 'Lähettäjän nimi, puhelinnumero tai tutun näköinen sivu ei yksin takaa aitoutta.',[
      option('sms','Tekstiviestissä','link'),option('email','Sähköpostissa','link'),option('call','Puhelussa','call'),option('shop','Verkkokaupassa tai muulla sivulla','shop')]),
    link:q('Avasitko viestissä olevan linkin?', 'Älä avaa sitä nyt tarkistamista varten.',choices('download','message','link-uncertain')),
    download:q('Asensitko tai käynnistitkö linkin kautta tarjotun ohjelman?', 'Pelkkä linkin avaaminen on eri asia kuin ohjelman asentaminen tai tietojen luovuttaminen.',choices('program','clicked','program-uncertain')),
    message:result('Varmista viesti muuta kautta.',[
      'Älä avaa linkkiä, liitettä tai viestin kirjautumissivua. Älä vastaa pyydetyillä tiedoilla.',
      'Tarkista asia avaamalla tuttu palvelu itse tai etsimällä organisaation virallinen yhteystieto.',
      'Viestin kiire, uhkailu, maksupyyntö tai tietojen kysely ovat mahdollisia varoitusmerkkejä. Niiden puuttuminen ei osoita viestiä turvalliseksi.'
    ],['fraud','police']),
    clicked:result('Sulje epäilyttävä sivu ja tarkista, mitä teit.',[
      'Pelkkä avaaminen ei yksin kerro, että tietoja olisi viety — se ei myöskään todista laitetta turvalliseksi. Älä palaa linkkiin testaamaan.',
      'Älä avaa mahdollisesti ladattua tiedostoa. Tarkista päivitykset ja käytä tarvittaessa laitteen omaa tai jo käytössä olevaa luotettavaa tietoturvaohjelmaa.',
      'Jos muistat sittenkin antaneesi tietoja, hyväksyneesi maksun tai asentaneesi ohjelman, aloita tämä opastus uudelleen ja valitse sitä vastaava tilanne.'
    ],['fraud']),
    'link-uncertain':result('Älä avaa linkkiä uudelleen tarkistamista varten.',[
      'Tarkista asia palvelun omasta sovelluksesta tai itse löytämästäsi virallisesta yhteystiedosta.',
      'Jos tietoja, maksuja tai ohjelman asennus saattoi liittyä tilanteeseen, palaa alkuun ja käy kyseinen riskikohta läpi.',
      'Tämä opastus ei tutki linkkiä tai laitettasi eikä voi vahvistaa niiden turvallisuutta.'
    ],['fraud']),
    program:result('Lopeta epäilyttävän ohjelman käyttö.',[
      'Jos suoritit tuntemattoman tarjoaman ohjelman ja epäilet haittaohjelmaa tai etäyhteyttä, katkaise laitteen verkkoyhteys ja pyydä luotettavaa apua sen tarkistamiseen.',
      'Käytä toista luotettavaa laitetta salasanojen vaihtamiseen. Jos pankkitietoja saattoi paljastua, ota heti yhteys pankkiin.',
      'Älä poista omia tiedostoja tai palauta tehdasasetuksia hätäpäissäsi. Älä asenna uutta korjausohjelmaa epäilyttävän viestin kautta.'
    ],['remote','fraud'],'urgent'),
    'program-uncertain':result('Selvitä ohjelman tilanne ennen käytön jatkamista.',[
      'Älä käynnistä ladattua tiedostoa. Jos arvelet suorittaneesi sen, pyydä luotettavaa apua laitteen tarkistamiseen.',
      'Jos epäilet aktiivista etäyhteyttä, katkaise verkkoyhteys. Käytä pankkiin yhteydenottoon ja salasanojen vaihtamiseen toista luotettavaa laitetta.',
      'Pankki- tai korttitietojen mahdollisesti vaarannuttua ota heti yhteys pankkiin.'
    ],['remote','fraud']),
    call:result('Lopeta epäilyttävä puhelu ja varmista soittaja itse.',[
      'Sinun ei tarvitse jatkaa puhelua. Älä kerro salasanoja tai vahvistuskoodeja äläkä siirrä rahaa soittajan pyynnöstä.',
      'Etsi organisaation oikea yhteystieto itse sen viralliselta sivulta. Älä käytä soittajan antamaa numeroa.',
      'Jos jotain jo tapahtui, palaa opastuksen alkuun tai katso kiireelliset toimintaohjeet.'
    ],['remote','police']),
    shop:result('Tarkista myyjä ennen ostamista.',[
      'Selvitä yrityksen nimi, yhteystiedot sekä toimitus- ja palautusehdot. Mainos tai tuttu logo ei yksin osoita kauppaa luotettavaksi.',
      'Jos tietoja ei löydy tai jokin epäilyttää, jätä maksu tekemättä ja katso KKV:n ohjeet.',
      'Jos olet jo maksanut tai antanut korttitiedot epäilyttävälle toimijalle, ota heti yhteys pankkiin. Tämä opastus ei tarkista kaupan aitoutta.'
    ],['shop','fraud']),
    topic:q('Minkä kanssa tarvitset apua?', 'Valitse yksi pulma. Etenemme yksi kysymys kerrallaan.',[
      option('wifi','Puhelin ei yhdistä Wi-Fi-verkkoon','wifi-other'),option('audio','Tietokoneesta ei kuulu ääntä','audio-other'),
      option('browser','Selain ei avaa sivua','browser-other'),option('mail','Sähköposti ei toimi','mail-network'),
      option('app','Sovellus ei käynnisty','app-source'),option('malware','Epäilen haittaohjelmaa','malware-remote')]),
    'wifi-other':q('Toimivatko muut laitteet samassa Wi-Fi-verkossa?', 'Kokeile vain omaa tuttua verkkoasi. Wi-Fi tarkoittaa langatonta lähiverkkoa.',choices('wifi-device','wifi-outage','wifi-alone')),
    'wifi-device':q('Auttoiko Wi-Fi-yhteyden ja lentotilan tarkistus?', 'Tarkista, että Wi-Fi on päällä, lentotila pois ja valittuna on oma tuttu verkko. Älä nollaa asetuksia tai kirjoita verkon salasanaa tänne.',choices('works','wifi-near','wifi-help')),
    'wifi-near':q('Toimiiko yhteys lähempänä omaa reititintä?', 'Reititin on kotisi verkkolaite. Siirry lähemmäksi vain jos se onnistuu turvallisesti.',choices('wifi-range','wifi-help','wifi-help')),
    'wifi-outage':q('Onko operaattorisi ilmoittanut alueella häiriöstä?', 'Tarkista operaattorin omat häiriötiedot esimerkiksi puhelimen mobiiliyhteydellä, jos se on käytettävissä.',choices('wifi-provider','wifi-network-help','wifi-network-help')),
    'wifi-alone':result('Aloita oman laitteen helpoista tarkistuksista.',[
      'Tarkista, että Wi-Fi on päällä, lentotila pois ja oma tuttu verkko valittuna. Siirry tarvittaessa lähemmäksi reititintä.',
      'Jos voit myöhemmin kokeilla toista laitetta samassa verkossa, se auttaa rajaamaan pulmaa. Voit palata takaisin tähän kysymykseen.',
      'Jos pulma jatkuu, katso valmistajan ohje tai kysy operaattorilta. Älä paina reitittimen Reset-painiketta tai nollaa laitetta.'
    ],['phoneWifi','wifi']),
    'wifi-range':result('Kuuluvuus voi vaikuttaa yhteyteen.',[
      'Vastauksesi mukaan yhteys toimii lähempänä reititintä. Kokeile käyttää laitettasi tässä paikassa, jos se on siirrettävissä.',
      'Etäisyys ja seinät voivat heikentää langatonta yhteyttä. Jos verkko ei riitä tavalliseen käyttöön, kysy operaattorilta tai luotettavalta auttajalta sijoittelusta.',
      'Tämä on vastauksiisi perustuva rajaus, ei automaattinen verkkotesti.'
    ],['phoneWifi']),
    'wifi-help':result('Pulma näyttää rajautuvan omaan laitteeseen.',[
      'Muiden laitteiden toimiminen auttaa rajaamaan asiaa, mutta ei todista vian syytä.',
      'Tallenna keskeneräiset työt ja kokeile laitteen tavallista uudelleenkäynnistystä valmistajan ohjeen mukaan. Älä tee tehdasasetusten palautusta.',
      'Jos yhteys ei palaudu, tarkista valmistajan Wi-Fi-ohje ja pyydä luotettavaa apua. Kerro laitteen malli ja mitä jo kokeilit.'
    ],['phoneWifi','wifi']),
    'wifi-provider':result('Seuraa operaattorin häiriötiedotetta.',[
      'Jos alueella on ilmoitettu häiriö, laitteesi asetusten muuttaminen ei välttämättä auta. Seuraa operaattorin ohjeita.',
      'Käytä tarvittaessa omaa mobiiliyhteyttä, jos liittymäsi sallii sen. Huomioi liittymäsi mahdolliset maksut.',
      'Jos tilanne jatkuu häiriön päätyttyä, aloita tarkistus uudelleen.'
    ],['wifi']),
    'wifi-network-help':result('Selvitä yhteys operaattorin kanssa.',[
      'Jos useampi laite on ilman yhteyttä, pulma voi olla kodin verkkolaitteessa tai operaattorin yhteydessä.',
      'Tarkista verkkolaitteen virta ja näkyvät kaapeliliitännät. Älä paina Reset-painiketta tai muuta verkon suojausta.',
      'Ota yhteys operaattoriin sen virallisesta asiakaspalvelusta. Kerro, että pulma koskee useampaa laitetta.'
    ],['wifi']),
    'audio-other':q('Puuttuuko ääni myös toisesta tutusta sovelluksesta?', 'Kokeile pienellä äänenvoimakkuudella. Älä avaa tuntemattomia sivustoja testaamista varten.',choices('audio-output','audio-app','audio-try')),
    'audio-output':q('Kuuluuko ääni äänenvoimakkuuden ja kaiutinvalinnan tarkistamisen jälkeen?', 'Tarkista Windowsin ääniasetuksista, ettei ääni ole mykistetty ja että käytössä on haluamasi kaiutin tai kuulokkeet. Television tai Bluetooth-laitteen valinta voi ohjata äänen muualle.',choices('works','audio-help','audio-help')),
    'audio-app':result('Tarkista kyseisen sovelluksen oma ääni.',[
      'Tarkista sovelluksen tai videon oma äänenvoimakkuus ja mykistys. Selaimen välilehti voi olla mykistetty erikseen.',
      'Windowsin äänenvoimakkuuden mikserissä voi olla eri voimakkuus eri sovelluksille. Tarkista vain käyttämäsi sovelluksen kohta.',
      'Jos pulma jatkuu, tallenna työt ja kokeile sovelluksen tavallista sulkemista ja uudelleen avaamista.'
    ],['audio']),
    'audio-try':result('Rajaa ensin, koskeeko pulma yhtä sovellusta.',[
      'Kokeile toisesta tutusta sovelluksesta ääntä pienellä voimakkuudella. Palaa sen jälkeen edelliseen kysymykseen.',
      'Jos et voi vertailla, tarkista Windowsin ääniasetuksista mykistys ja valittu kaiutin. Älä asenna satunnaista ajurinkorjaajaa.'
    ],['audio']),
    'audio-help':result('Jatka valmistajan ääniohjeella.',[
      'Tarkista ulkoisen kaiuttimen virta ja käytössä olevien kuulokkeiden liitäntä. Älä irrota muita tarpeellisia laitteita.',
      'Tallenna työt ennen mahdollista tavallista uudelleenkäynnistystä. Jos ongelma alkoi päivityksen jälkeen, kirjaa se tuelle.',
      'Käytä Microsoftin tai laitteen valmistajan omaa ohjetta. Älä poista ajureita tai tietoturvaohjelmaa tämän opastuksen perusteella.'
    ],['audio']),
    'browser-other':q('Avautuuko toinen tuttu verkkosivu?', 'Käytä tuttua osoitetta. Älä avaa epäilyttävää linkkiä testimielessä.',choices('browser-warning','wifi-other','browser-try')),
    'browser-warning':q('Näyttääkö selain turvallisuus- tai varmennevaroituksen?', 'Varoitus voi koskea yhteyden turvallisuutta. Älä ohita sitä.',choices('browser-stop','browser-one','browser-stop')),
    'browser-stop':result('Älä ohita selaimen turvallisuusvaroitusta.',[
      'Sulje epäilyttävä sivu. Tarkista, että käyttämäsi osoite on oikea ja laitteen päivämäärä sekä kellonaika ovat oikein.',
      'Jos varoitus jatkuu, varmista asia palvelun virallisesta asiakaspalvelusta muuta kautta. Älä syötä sivulle tunnuksia.'
    ],['fraud']),
    'browser-one':result('Pulma voi koskea vain yhtä sivustoa.',[
      'Tarkista osoitteen kirjoitusasu. Palvelussa voi olla tilapäinen häiriö, joten kokeile myöhemmin.',
      'Jos ongelma jatkuu, kirjaa virheilmoituksen teksti ja tarkista palvelun omat häiriö- tai tukitiedot.',
      'Älä asenna sivun ehdottamaa korjausohjelmaa tai poista selaimen suojauksia käytöstä.'
    ]),
    'browser-try':result('Kokeile ensin yhtä muuta tuttua sivua.',[
      'Jos toinen tuttu sivu avautuu, palaa takaisin ja vastaa Kyllä. Jos mikään sivu ei avaudu, vastaa Ei, niin jatkamme nettiyhteyden tarkistukseen.',
      'Jos et voi kokeilla, pyydä luotettavaa apua. Älä ohita turvallisuusvaroitusta.'
    ]),
    'mail-network':q('Avautuuko toinen tuttu verkkosivu?', 'Tämä auttaa erottamaan sähköpostiongelman yleisestä yhteysongelmasta.',choices('mail-login','wifi-other','browser-try')),
    'mail-login':q('Pyytääkö sähköposti kirjautumaan uudelleen?', 'Älä kirjoita tunnuksia tälle sivulle tai viestin kautta avautuneeseen epäilyttävään kirjautumiseen.',choices('mail-origin','mail-issue','mail-help')),
    'mail-origin':q('Avasitko sähköpostin itse tutusta sovelluksesta tai oikeasta osoitteesta?', 'Viestin linkistä avattu kirjautumissivu voi olla tietojenkalastelua.',choices('mail-recovery','message','message')),
    'mail-recovery':result('Käytä sähköpostipalvelun omaa kirjautumisohjetta.',[
      'Varmista oikea palvelu ja käytä tarvittaessa sen virallista tilin palautusta. Älä kerro salasanaa tai vahvistuskoodia auttajalle.',
      'Jos epäilet tilimurtoa, vaihda salasana luotettavalla laitteella ja tarkista lisävahvistus sekä palautustiedot.',
      'Jos pääsy ei palaudu, ota yhteys palvelun viralliseen tukeen. Tämä sivusto ei palauta salasanoja.'
    ],['accounts']),
    'mail-issue':q('Mikä sähköpostissa ei toimi?', 'Älä kopioi viestejä tai osoitekirjaa tänne.',[
      option('receive','Viesti ei saavu','mail-receive'),option('send','Viesti ei lähde','mail-send'),option('unknown','Muu pulma / en tiedä','mail-help')]),
    'mail-receive':result('Tarkista roskaposti ja odotetun viestin osoite.',[
      'Katso roskapostikansio. Varmista lähettäjän kanssa ennestään tuntemallasi tavalla, että hän käytti oikeaa sähköpostiosoitettasi.',
      'Tarkista palvelun omista ilmoituksista, onko postilaatikko täynnä tai palvelussa häiriö. Älä poista viestejä hätäisesti tilan vapauttamiseksi.',
      'Jos puuttuva viesti pyytää maksua tai tunnuksia, varmista sen aitous erikseen.'
    ]),
    'mail-send':result('Tarkista vastaanottaja ja mahdollinen virheilmoitus.',[
      'Tarkista osoitteen kirjoitusasu ja mahdollinen luonnos- tai lähtevien kansio. Älä lähetä arkaluonteista viestiä toistuvasti varmuuden vuoksi.',
      'Jos palvelu kertoo liian suuresta liitteestä tai häiriöstä, seuraa sen omia ohjeita. Kirjaa virheilmoitus itsellesi ilman salasanoja.',
      'Jos ongelma jatkuu, kysy sähköpostipalvelun virallisesta tuesta.'
    ]),
    'mail-help':result('Kirjaa pulma ja käytä palvelun omaa tukea.',[
      'Tarkista palvelun viralliset häiriötiedot. Kirjaa virheilmoituksen teksti ja käyttämäsi sovellus itsellesi.',
      'Peitä henkilötiedot kuvakaappauksista ennen niiden jakamista. Älä lähetä salasanoja, tunnistuskoodeja tai yksityisiä viestejä meille.'
    ]),
    'app-source':q('Onko sovellus hankittu virallisesta sovelluskaupasta tai valmistajalta?', 'Tuntemattoman viestin tai ponnahdusikkunan ohjelmaa ei pidä käynnistää testaamista varten.',choices('app-restart','program-uncertain','app-verify')),
    'app-restart':q('Käynnistyykö sovellus tavallisen sulkemisen ja uudelleen avaamisen jälkeen?', 'Tallenna työt ensin. Jos ohjelmassa on tallentamatonta sisältöä, älä pakota sitä sulkeutumaan.',choices('works','app-help','app-help')),
    'app-verify':result('Varmista sovelluksen alkuperä ennen käyttöä.',[
      'Älä käynnistä ohjelmaa, jonka alkuperästä et ole varma. Etsi valmistajan oikea ohje tai kysy luotettavalta auttajalta.',
      'Älä ohita Windowsin tai tietoturvaohjelman varoitusta. Jos jo suoritit epäilyttävän ohjelman, siirry haittaohjelman opastukseen.'
    ]),
    'app-help':result('Jatka sovelluksen valmistajan ohjeella.',[
      'Kirjaa sovelluksen nimi ja virheilmoitus itsellesi. Tarkista valmistajan omat päivitys- ja häiriötiedot.',
      'Tallenna työt ennen tietokoneen tavallista uudelleenkäynnistystä. Älä käynnistä uudelleen kesken päivityksen.',
      'Älä poista sovellusta, sen dataa tai tietoturvaa tämän opastuksen perusteella. Tarvittaessa pyydä valmistajan tukea.'
    ]),
    'malware-remote':q('Annoitko vieraalle etäyhteyden tai suorititko hänen tarjoamansa ohjelman?', 'Tällaisessa tilanteessa toimitaan ensin mahdollisen pääsyn rajoittamiseksi.',choices('remote-now','malware-popup','remote-uncertain')),
    'malware-popup':q('Onko varoitus vain verkkosivulla tai selaimen ilmoituksessa?', 'Sivun väite viruksesta ei itsessään ole laitteen tietoturvaohjelman tarkistustulos.',choices('malware-scare','malware-scan','malware-help')),
    'malware-scare':result('Älä noudata sivun pelotteluviestin ohjeita.',[
      'Älä soita ilmoituksen numeroon, maksa tai asenna tarjottua ohjelmaa. Sulje epäilyttävä välilehti tavallisesti.',
      'Avaa tarvittaessa laitteen oma tai jo käytössä oleva luotettava tietoturvaohjelma itse, ei ilmoituksen linkistä, ja seuraa sen ohjeita.',
      'Jos varoitukset jatkuvat tai olet jo toiminut niiden mukaan, pyydä luotettavaa apua. Pankkitietojen tai maksujen vaarantuessa ota heti yhteys pankkiin.'
    ],['fraud','remote']),
    'malware-scan':result('Tarkista tilanne jo käytössä olevasta suojausohjelmasta.',[
      'Avaa Windowsin suojaus tai oma luotettava tietoturvaohjelmasi tavallisesti. Tarkista sen ilmoitus ja toimi sen ohjeiden mukaan.',
      'Älä poista suojausta käytöstä tai lataa satunnaista puhdistusohjelmaa. Epäillyn etäyhteyden aikana katkaise verkkoyhteys ja pyydä apua.',
      'Tämä opastus ei suorita haittaohjelmatarkistusta. Jos et osaa tulkita ilmoitusta, käytä valmistajan virallista tukea.'
    ]),
    'malware-help':result('Pyydä apua ennen ohjelmien asentamista tai poistamista.',[
      'Kirjaa, missä varoitus näkyy ja mitä teit ennen sitä. Älä jaa salasanoja tai muita henkilötietoja.',
      'Älä maksa varoituksen perusteella, soita sen numeroon tai ohita suojausta. Pyydä luotettavaa auttajaa tai laitteen valmistajan tukea.',
      'Jos epäilet vieraan aktiivista pääsyä laitteelle, katkaise verkkoyhteys. Jos pankkitietoja on voinut paljastua, ota heti yhteys pankkiin toisella laitteella.'
    ],['remote','fraud']),
    works:result('Vastauksesi mukaan pulma helpotti.',[
      'Kokeile vielä omaa tavallista käyttötapaasi. Sivusto ei ole testannut laitetta puolestasi.',
      'Jos ongelma palaa, voit palata kysymyksiin tai aloittaa uuden opastuksen. Kirjaa toistuvan virheen teksti itsellesi.'
    ])
  };
  const securityItems = [
    ['updates','Ovatko laitteen automaattiset tietoturvapäivitykset käytössä?','Päivitykset korjaavat myös turvallisuuspuutteita. Tarkista laitteen omista asetuksista, ei satunnaisen ilmoituksen linkistä.','Tarkista päivitykset laitteen omista asetuksista ja ota automaattiset tietoturvapäivitykset käyttöön valmistajan ohjeen mukaan.','turvallinen-netti.html#paivitykset'],
    ['screen','Onko laitteessa näytön lukitus?','Lukitus voi käyttää esimerkiksi PIN-koodia tai sormenjälkeä. Älä kerro lukituskoodia täällä.','Ota näytön lukitus käyttöön laitteen asetuksista. Pidä lukituskoodi omana tietonasi.','turvallinen-netti.html#tiedot'],
    ['mfa','Onko tärkeissä palveluissasi kirjautumisen lisävahvistus?','Tämä on myös nimeltään kaksivaiheinen tunnistautuminen: salasanan lisäksi kirjautuminen vahvistetaan esimerkiksi omalla puhelimella.','Tarkista tärkeiden palveluiden lisävahvistus. Ota se käyttöön palvelun omilla ohjeilla ja säilytä palautuskoodit turvallisesti.','turvallinen-netti.html#salasanat'],
    ['passwords','Onko jokaisessa palvelussa erilainen salasana?','Älä kirjoita yhtään salasanaa tänne. Riittää, että vastaat käytäntöäsi koskevaan kysymykseen.','Vaihda samoina toistuvat salasanat erilaisiksi. Aloita sähköpostista ja muista tärkeistä tileistä luotettavalla laitteella.','turvallinen-netti.html#salasanat'],
    ['backup','Onko tärkeistä tiedostoista varmuuskopio?','Varmuuskopio on toinen kopio turvallisessa erillisessä paikassa. Kopion palauttaminen kannattaa osata.','Tee tärkeistä tiedostoista varmuuskopio ja varmista, että saat siitä tiedoston takaisin. Älä poista alkuperäisiä tämän tarkistuksen perusteella.','turvallinen-netti.html#tiedot'],
    ['scams','Tiedätkö, miten toimit epäilyttävän viestin tai puhelun kanssa?','Tärkeintä on pysähtyä ja varmistaa asia itse oikeasta palvelusta. Kaikkia huijauksia ei voi tunnistaa ulkonäöstä.','Tutustu huijausavun varoitusmerkkeihin ja kiireelliseen pankkiohjeeseen. Muista: merkittömyys ei todista viestiä turvalliseksi.','huijausapu.html#tarkistuslista']
  ];
  securityItems.forEach(([key,question,help],index) => {
    const next = index+1 < securityItems.length ? 'security-'+securityItems[index+1][0] : 'security-report';
    nodes['security-'+key] = q(question,help,choices(next,next,next));
  });
  function securityReport(state) {
    const answered = Object.fromEntries(state.trail.map(item=>[item.node,item.choice]));
    const recommendations = securityItems.filter(([key])=>answered['security-'+key] !== 'yes').map(([key,, ,text,url])=>({text:(answered['security-'+key] === 'unknown'?'Et ollut tästä varma. ':'' )+text,url}));
    const report = result('Kävit läpi perusturvan tärkeimmät asiat.',[],['accounts']);
    report.intro = recommendations.length ? 'Valitse seuraavista ensin yksi asia, jonka tarkistat. Ehdotukset perustuvat vain vastauksiisi.' : 'Vastaustesi mukaan nämä käytännöt ovat käytössä. Pidä ne ajan tasalla ja kokeile silloin tällöin varmuuskopion palauttamista.';
    report.recommendations = recommendations;
    report.limit = 'Tämä ei ole laitetarkastus tai tietoturvasertifikaatti. Sivusto ei näe laitteesi asetuksia eikä voi vahvistaa sen turvallisuutta.';
    return report;
  }
  const starts = Object.freeze({scam:'bank',digi:'topic',security:'security-updates'});
  function start(flow) {
    if (!Object.hasOwn(starts,flow)) throw new Error('Tuntematon opastus.');
    return {flow,node:starts[flow],trail:[]};
  }
  function current(state) {
    return state.node === 'security-report' ? securityReport(state) : nodes[state.node];
  }
  function advance(state,choice) {
    const node = current(state);
    if (!node || node.kind !== 'question') throw new Error('Tässä kohdassa ei kysytä vastausta.');
    const selected = node.options.find(item=>item.id === choice);
    if (!selected) throw new Error('Valitse jokin näkyvistä vaihtoehdoista.');
    return {flow:state.flow,node:selected.next,trail:[...state.trail,{node:state.node,choice}]};
  }
  function back(state) {
    if (!state.trail.length) return state;
    return {flow:state.flow,node:state.trail.at(-1).node,trail:state.trail.slice(0,-1)};
  }
  return Object.freeze({start,current,advance,back,refs,starts});
})();
if (typeof module !== 'undefined') module.exports = DigiGuidance;
