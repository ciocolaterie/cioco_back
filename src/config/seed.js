/**
 * Seed script — populează BD cu produse, recenzii și setări demo.
 * Rulare: node src/config/seed.js
 * Flag:   node src/config/seed.js --force   (șterge tot ce există înainte)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Settings } from '../models/Settings.js';

const FORCE = process.argv.includes('--force');

/* ─── helpers ──────────────────────────────────────────────────────── */
const u = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

/* ─── produse ──────────────────────────────────────────────────────── */
const PRODUCTS = [

  /* TABLETE */
  {
    name: 'Tabletă Noir 85%',
    slug: 'tableta-noir-85',
    category: 'Tablete',
    price: 32,
    stock: 48,
    weight: '100g',
    short: 'Ciocolată neagră intensă cu 85% cacao single-origin Ecuador — note de fructe de pădure și vanilie naturală.',
    description:
      'Tableta noastră flagship: 85% cacao din ferme certificate din Ecuador, prelucrată în loturi mici pentru a păstra aromele complexe. Note de fructe de pădure, un fundal discret de tabac și o finisare lungă cu vanilie naturală din Madagascar. Fără lecitină de soia, fără adaosuri inutile.',
    ingredients:
      'Masă de cacao (85%), zahăr de cocos, unt de cacao, vanilie naturală de Madagascar.',
    allergens: ['lapte'],
    tags: ['vegan', 'single-origin', 'intens'],
    images: [
      u('1606312619070-d48b6caeda7e'),
      u('1481391319762-47dff72954d9'),
    ],
  },
  {
    name: 'Tabletă Lapte & Caramel Sărat',
    slug: 'tableta-lapte-caramel-sarat',
    category: 'Tablete',
    price: 28,
    stock: 36,
    weight: '100g',
    short: 'Ciocolată cu lapte cremos, cu bucăți crocante de caramel și cristale de fleur de sel.',
    description:
      'Un echilibru perfect între dulceața cremei de lapte și caramelul ușor amar, cu cristale de fleur de sel de Guérande care amplifică fiecare aromă. Fabricată manual în serii mici de câte 50 de tablete.',
    ingredients:
      'Zahăr, unt de cacao, lapte praf integral, masă de cacao (40%), caramel (zahăr, smântână, unt), fleur de sel de Guérande.',
    allergens: ['lapte', 'soia'],
    tags: ['bestseller', 'caramel', 'creamy'],
    images: [
      u('1549007994-cb92caebd54b'),
      u('1502741338009-cac2772e18bc'),
    ],
  },
  {
    name: 'Tabletă Albă & Zmeură Liofilizată',
    slug: 'tableta-alba-zmeura',
    category: 'Tablete',
    price: 30,
    stock: 24,
    weight: '100g',
    short: 'Ciocolată albă belgică cu bucăți de zmeură liofilizată și vanilie bourbon.',
    description:
      'Baza cremă de ciocolată albă 35% unt de cacao belgian întâlnește bucăți intense de zmeură liofilizată. Aciditatea fructului taie dulceața și creează un profil aromatic complex, floral și fructat.',
    ingredients:
      'Zahăr, unt de cacao (35%), lapte praf integral, vanilie bourbon, zmeură liofilizată (8%).',
    allergens: ['lapte', 'soia'],
    tags: ['fructat', 'estival', 'cadou'],
    images: [
      u('1590080875852-3c8db6d9da9d'),
      u('1553361371-9b22f78e8b1d'),
    ],
  },
  {
    name: 'Tabletă Noir cu Alune & Sare de Himalaya',
    slug: 'tableta-noir-alune-himalaya',
    category: 'Tablete',
    price: 34,
    stock: 30,
    weight: '100g',
    short: 'Ciocolată neagră 70% cu alune Piemonte întregi prăjite și cristale de sare roz de Himalaya.',
    description:
      'Combinația clasică dusă la nivelul următor: cacao 70% din Côte d\'Ivoire, alune Piemonte prăjite ușor și sare roz de Himalaya în cristale vizibile. Textura crocantă alternează cu fundalul neted al ciocolatei.',
    ingredients:
      'Masă de cacao (70%), zahăr, unt de cacao, alune Piemonte (12%), sare roz de Himalaya, vanilie naturală.',
    allergens: ['alune de copac', 'lapte'],
    tags: ['crocant', 'savuros'],
    images: [
      u('1516684732162-798a3e5db8a9'),
      u('1505253716362-04e5f371d80c'),
    ],
  },

  /* PRALINE */
  {
    name: 'Praline Clasice — Cutie 9 buc',
    slug: 'praline-clasice-9',
    category: 'Praline',
    price: 65,
    stock: 20,
    weight: '135g',
    short: 'Nouă praline cu ganache: vanilie-Bourbon, caramel sărat, noir pur și cremă de mentă.',
    description:
      'Cutia noastră de praline clasice reunește cele mai îndrăgite ganache-uri: vanilie-Bourbon în coajă de ciocolată albă, caramel sărat în coajă noir 70%, noir pur 80% și cremă răcoritoare de mentă în ciocolată cu lapte. Fiecare pralină este turnată manual în matrițe de policarbonat, lustruită la oglindă.',
    ingredients:
      'Ciocolată neagră (masă de cacao, zahăr, unt de cacao, vanilie), ciocolată albă, smântână 35%, unt, vanilie bourbon, mentă naturală, fleur de sel.',
    allergens: ['lapte', 'soia', 'ouă'],
    tags: ['cadou', 'bestseller', 'handmade'],
    images: [
      u('1558961363-fa8fdf82db35'),
      u('1614759498958-4786f28d3756'),
    ],
  },
  {
    name: 'Praline Ganache de Cafea Etiopiană',
    slug: 'praline-cafea-etiopiana',
    category: 'Praline',
    price: 45,
    stock: 28,
    weight: '90g',
    short: 'Șase praline cu ganache de cafea Yirgacheffe în coajă de ciocolată neagră 70%.',
    description:
      'Cafeaua Yirgacheffe din Etiopia, cu note florale și de citrice, este infuzată la rece în smântână premium și transformată în ganache. Coaja de ciocolată neagră 70% completează perfect amăreala expresivă. Un cadou ideal pentru iubitorii de cafea.',
    ingredients:
      'Ciocolată neagră 70% (masă de cacao, zahăr, unt de cacao), smântână 35%, cafea etiopiană Yirgacheffe (3%), unt.',
    allergens: ['lapte'],
    tags: ['cafea', 'sofisticat'],
    images: [
      u('1580088880298-6d3cd5bddff8'),
      u('1558961363-fa8fdf82db35'),
    ],
  },
  {
    name: 'Praline Fructul Pasiunii & Caise',
    slug: 'praline-pasionata-caise',
    category: 'Praline',
    price: 48,
    stock: 18,
    weight: '90g',
    short: 'Șase praline cu ganache tropical de fructul pasiunii și caise bio, în coajă de ciocolată cu lapte 40%.',
    description:
      'Fructul pasiunii proaspăt presat combinat cu piure de caise bio creează un ganache vibrant, tropical și ușor acidulat. Coaja de ciocolată cu lapte 40% temperată la mână adaugă un strat catifelat care protejează interiorul aromatic.',
    ingredients:
      'Ciocolată cu lapte 40%, smântână 35%, piure fructul pasiunii (10%), caise bio (8%), unt, zahăr invertit.',
    allergens: ['lapte', 'soia'],
    tags: ['tropical', 'fructat', 'estival'],
    images: [
      u('1567366584263-d56d2e2ca5e8'),
      u('1614759498958-4786f28d3756'),
    ],
  },

  /* TRUFE */
  {
    name: 'Trufe Clasice cu Cacao',
    slug: 'trufe-clasice-cacao',
    category: 'Trufe',
    price: 38,
    stock: 35,
    weight: '120g',
    short: '8 trufe rotunjite cu mâna, cu ganache nobil de ciocolată neagră, rulate în pudră de cacao naturală.',
    description:
      'Rețeta originală de trufă artizanală: ganache preparat din ciocolată Valrhona 66% și smântână normandă, rulat manual în pudră de cacao Brute. Forma imperfectă este dovada că fiecare trufă a fost atinsă de mâna unui artizan. Se servesc la temperatura camerei.',
    ingredients:
      'Ciocolată neagră 66% (Valrhona), smântână 35%, unt nesărat, pudră de cacao naturală (10%).',
    allergens: ['lapte', 'soia'],
    tags: ['clasic', 'handmade', 'bestseller'],
    images: [
      u('1569058242253-92a9c755a0ec'),
      u('1578985545062-69928b1d9587'),
    ],
  },
  {
    name: 'Trufe cu Ganache de Champagne',
    slug: 'trufe-ganache-champagne',
    category: 'Trufe',
    price: 55,
    stock: 15,
    weight: '120g',
    short: 'Trufe fine cu ganache de Champagne Brut și ciocolată albă, în pudră de cacao maroc.',
    description:
      'Champagne-ul Brut reduce ușor pe foc mic, concentrând aromele, și se combină cu ciocolată albă belgiană pentru un ganache fin și spumos. Pudra de cacao marocană pe exterior adaugă amăreală pentru a echilibra dulceața. Ediție limitată, disponibilă în weekend.',
    ingredients:
      'Ciocolată albă 32% (unt de cacao, zahăr, lapte praf), Champagne Brut (15%), smântână 35%, pudră de cacao.',
    allergens: ['lapte', 'soia', 'sulfiti'],
    tags: ['luxos', 'cadou', 'editie-limitata'],
    images: [
      u('1578985545062-69928b1d9587'),
      u('1569058242253-92a9c755a0ec'),
    ],
  },

  /* CARAMELE */
  {
    name: 'Caramele Moi cu Unt Sărat',
    slug: 'caramele-moi-unt-sarat',
    category: 'Caramele',
    price: 36,
    stock: 40,
    weight: '150g',
    short: '12 caramele moi cu unt de Bretania și fleur de sel, învelite individual în hârtie de mătase.',
    description:
      'Gătite în cazan de aramă, cu zahăr caramelizat sec, unt demi-sel breton și smântână proaspătă. Textura moale și crocantă în același timp — se topesc pe limbă lăsând un postgust lung de sare și unt. Învelite manual în hârtie de mătase alimentară.',
    ingredients:
      'Zahăr, smântână 35%, unt demi-sel breton (18%), glucoză, fleur de sel de Guérande.',
    allergens: ['lapte'],
    tags: ['clasic', 'moi', 'cadou', 'bestseller'],
    images: [
      u('1548741487-18b3b4db11c9'),
      u('1491735469234-6f2e7a2c9ef6'),
    ],
  },
  {
    name: 'Caramele Glazurate Noir',
    slug: 'caramele-glazurate-noir',
    category: 'Caramele',
    price: 42,
    stock: 25,
    weight: '130g',
    short: 'Caramele moi acoperite în ciocolată neagră 72%, cu o surpriză de fleur de sel în interior.',
    description:
      'Baza moale de caramel acoperită manual în ciocolată neagră temperată 72%. Primul strat de ciocolată crocantă, urmat de caramelul mătăsos care se topește imediat, cu cristale de sare care explodează pe palat.',
    ingredients:
      'Zahăr, smântână 35%, unt demi-sel, glucoză, ciocolată neagră 72% (masă de cacao, zahăr, unt de cacao), fleur de sel.',
    allergens: ['lapte', 'soia'],
    tags: ['noir', 'glazurat', 'duo-textura'],
    images: [
      u('1491735469234-6f2e7a2c9ef6'),
      u('1548741487-18b3b4db11c9'),
    ],
  },

  /* FRUCTE GLASATE */
  {
    name: 'Portocale Glasate în Ciocolată Neagră',
    slug: 'portocale-glasate-noir',
    category: 'Fructe glasate',
    price: 40,
    stock: 22,
    weight: '160g',
    short: 'Felii de portocale siciliene confiate glasate în ciocolată neagră 72%, uscate 24h pe grătar.',
    description:
      'Portocalele siciliene bio sunt confiate timp de 3 zile în sirop de zahăr, lăsate la uscat, apoi scufundate în ciocolată neagră 72% temperată manual. Amăreala coajei de portocală și intensitatea ciocolatei negre se completează perfect.',
    ingredients:
      'Portocale siciliene bio (50%), zahăr, ciocolată neagră 72% (masă de cacao, zahăr, unt de cacao).',
    allergens: ['soia'],
    tags: ['vegan', 'bio', 'citrus'],
    images: [
      u('1473093226795-af9932fe5856'),
      u('1606312619070-d48b6caeda7e'),
    ],
  },
  {
    name: 'Smochine Uscate în Ciocolată cu Lapte',
    slug: 'smochine-uscate-lapte',
    category: 'Fructe glasate',
    price: 38,
    stock: 18,
    weight: '140g',
    short: 'Smochine turcești întregi glasate în ciocolată cu lapte 40% cu strop de scorțișoară din Ceylon.',
    description:
      'Smochinele uscate au un gust natural caramelizat care se potrivește impecabil cu ciocolata cu lapte 40%. Un vârf de scorțișoară din Ceylon adaugă un fond cald, de toamnă. Fiecare smochină este glasată individual, la mână, în ciocolată temperată manual.',
    ingredients:
      'Smochine turcești uscate (55%), ciocolată cu lapte 40% (zahăr, unt de cacao, lapte praf, masă de cacao), scorțișoară Ceylon.',
    allergens: ['lapte', 'soia'],
    tags: ['toamna', 'natural'],
    images: [
      u('1553361371-9b22f78e8b1d'),
      u('1473093226795-af9932fe5856'),
    ],
  },

  /* CADOURI */
  {
    name: 'Cutie Cadou Deluxe 500g',
    slug: 'cutie-cadou-deluxe-500g',
    category: 'Cadouri',
    price: 185,
    stock: 12,
    weight: '500g',
    short: 'Cutie cadou din carton rigid cu 20 de praline, 4 tablete mini și caramele — curatorie completă.',
    description:
      'Curatoria noastră completă în format cadou de lux: 10 praline asortate, 4 mini-tablete (noir 85%, lapte-caramel, albă-zmeură, alune), 6 caramele moi. Prezentată în cutie din carton textat negru, cu panglică de mătase bej și card personalizat inclus. Termen de valabilitate: 21 de zile.',
    ingredients: 'Asortiment — vezi ingredientele individuale.',
    allergens: ['lapte', 'soia', 'alune de copac', 'ouă'],
    tags: ['cadou', 'premium', 'complet', 'personalizabil'],
    images: [
      u('1614759498958-4786f28d3756'),
      u('1511381939415-e44cd8dcd7c0'),
    ],
  },
  {
    name: 'Set Degustare Artizanal',
    slug: 'set-degustare-artizanal',
    category: 'Cadouri',
    price: 95,
    stock: 20,
    weight: '250g',
    short: 'Set cu 4 tablete mini și 6 praline pentru o experiență de degustare ghidată — cu ghid tipărit.',
    description:
      'Creat pentru cei care vor să descopere lumea ciocolatei artizanale: patru tablete mini (25g fiecare) care explorează profiluri de la blanc 32% la noir 85%, și șase praline reprezentative. Însoțit de un ghid de degustare tipărit cu note de aromă și sugestii de asociere.',
    ingredients: 'Asortiment tablete și praline — vezi ingredientele individuale.',
    allergens: ['lapte', 'soia', 'alune de copac'],
    tags: ['degustare', 'educational', 'cadou'],
    images: [
      u('1505253716362-04e5f371d80c'),
      u('1614759498958-4786f28d3756'),
    ],
  },

  /* BOMBONIERIE */
  {
    name: 'Bombonierie Asortată Sezonieră',
    slug: 'bombonierie-asortata-sezoniera',
    category: 'Bombonierie',
    price: 72,
    stock: 16,
    weight: '300g',
    short: 'Cutie cu 15 bomboane artizanale: trufe, praline, caramele și fructe glasate — selecție lunară.',
    description:
      'Selecția noastră se schimbă lunar în funcție de disponibilitatea ingredientelor proaspete. Prezenta selecție include: 4 trufe clasice, 4 praline caramel-sărat, 3 caramele moi, 2 portocale glasate, 2 praline de cafea. Prezentată în cutie rotundă, cu capac din plexiglas.',
    ingredients: 'Asortiment — vezi ingredientele individuale.',
    allergens: ['lapte', 'soia', 'ouă'],
    tags: ['sezonier', 'asortiment', 'cadou'],
    images: [
      u('1580088880298-6d3cd5bddff8'),
      u('1511381939415-e44cd8dcd7c0'),
    ],
  },

  /* CIOCOLATĂ CALDĂ */
  {
    name: 'Mix Ciocolată Caldă Intensă',
    slug: 'mix-ciocolata-calda-intensa',
    category: 'Ciocolată caldă',
    price: 44,
    stock: 30,
    weight: '250g (10 porții)',
    short: 'Amestec artizanal pentru ciocolată caldă: noir 70% măcinat, vanilie bourbon și scorțișoară — 10 porții.',
    description:
      'Preparat din ciocolată noir 70% măcinată grosier, cu vanilie bourbon și scorțișoară din Ceylon. Se pregătește cu lapte fierbinte (nu apă!): 25g la 200ml lapte. Rezultatul este o ciocolată caldă cremoasă, cu corp — complet diferită de prafurile comerciale.',
    ingredients:
      'Ciocolată neagră 70% măcinată (masă de cacao, zahăr, unt de cacao), scorțișoară Ceylon (2%), vanilie bourbon (1%).',
    allergens: ['poate conține urme de lapte'],
    tags: ['iarna', 'confort', 'cadou'],
    images: [
      u('1481391319762-47dff72954d9'),
      u('1606312619070-d48b6caeda7e'),
    ],
  },
];

/* ─── recenzii ─────────────────────────────────────────────────────── */
// Pool de recenzori — o adresă de email nu poate apărea de două ori la același produs.
const REVIEWERS = [
  { name: 'Ioana M.',      email: 'ioana.m@gmail.com' },
  { name: 'Alexandru P.',  email: 'alex.popescu@yahoo.com' },
  { name: 'Maria D.',      email: 'maria.dumitrescu@gmail.com' },
  { name: 'Radu C.',       email: 'radu.constantin@gmail.com' },
  { name: 'Elena S.',      email: 'elena.soare@outlook.com' },
  { name: 'Mihai T.',      email: 'mihai.tudor@gmail.com' },
  { name: 'Cristina B.',   email: 'cristina.barbu@gmail.com' },
  { name: 'Andrei N.',     email: 'andrei.nedelcu@yahoo.com' },
  { name: 'Gabriela F.',   email: 'gabriela.florea@gmail.com' },
  { name: 'Dan V.',        email: 'dan.vasile@gmail.com' },
  { name: 'Teodora L.',    email: 'teodora.lungu@gmail.com' },
  { name: 'Bogdan I.',     email: 'bogdan.ionescu@gmail.com' },
];

// [slug, rating, text, reviewer_index]
const REVIEW_DATA = [
  ['tableta-noir-85', 5, 'Am fost impresionată de intensitatea aromei — 85% dar fără amărăciunea neplăcută pe care o ai la alte mărci. Nota de fructe de pădure este reală, nu marketing.', 0],
  ['tableta-noir-85', 5, 'Le-am comandat ca și cadou pentru un coleg care iubește ciocolata neagră. A spus că sunt cele mai bune tablete pe care le-a mâncat vreodată.', 1],
  ['tableta-noir-85', 4, 'Excelentă calitate, singura observație e că s-ar putea rupe mai ușor — e destul de densă. Dar gustul este impecabil.', 2],

  ['tableta-lapte-caramel-sarat', 5, 'Combinația de caramel cu fleur de sel este absolut divină. Am mâncat toată tableta în 10 minute, ceea ce spune totul.', 3],
  ['tableta-lapte-caramel-sarat', 5, 'Este tableta mea preferată de acum. Crocantul caramelului plus sarea e o combinație perfectă. Am mai comandat deja de 3 ori.', 4],
  ['tableta-lapte-caramel-sarat', 4, 'Foarte bună, cremă de lapte de calitate. Mi-ar plăcea poate ceva mai mult caramel, dar înțeleg că e echilibru intenționat.', 5],

  ['tableta-alba-zmeura', 5, 'Nu sunt de obicei fan ciocolată albă, dar zmeura liofilizată schimbă totul. Aciditatea bate dulceața excesivă.', 6],
  ['tableta-alba-zmeura', 4, 'Gustul este minunat, zmeura se simte intens. Am comandat-o ca tort informal pentru ziua mamei și a primit admirație generală.', 7],

  ['tableta-noir-alune-himalaya', 5, 'Cea mai bună tabletă cu alune pe care am încercat-o. Alunele sunt întregi, proaspăt prăjite, nu acel praf de alune din tabletele industriale.', 8],
  ['tableta-noir-alune-himalaya', 5, 'Sarea de Himalaya face diferența — îl simți în valuri, nu constant. Textura este fenomenală.', 0],
  ['tableta-noir-alune-himalaya', 4, 'Foarte bună, crocantă și savuroasă. Un pic mai scumpă față de ce găsești la raft, dar calitatea justifică.', 3],

  ['praline-clasice-9', 5, 'Le-am luat ca și cadou de ziua unui prieten și au fost o senzație. Fiecare pralină are un gust distinct, ganache-ul de mentă este preferatul nostru.', 9],
  ['praline-clasice-9', 5, 'Sunt extraordinare. Coaja lustruită este impecabilă, ganache-ul cremă și consistent. Evident lucru de artizan, nu din fabrică.', 10],
  ['praline-clasice-9', 5, 'Al doilea set comandat, tot atât de bune ca prima dată. Caramelul sărat din interior este de altă lume.', 11],
  ['praline-clasice-9', 4, 'Calitate premium, merită prețul. Singura mică dorință: o notă cu descrierea fiecărei praline în cutie.', 4],

  ['praline-cafea-etiopiana', 5, 'Ca pasionat de cafea specialty, acestea sunt exact ce căutam. Cafeaua se simte clar, nu e un simfon vag de «aromă de cafea».', 1],
  ['praline-cafea-etiopiana', 5, 'Le-am servit după o cină cu prieteni și nu mai vroiau să plece. Coaja de noir 70% + ganache de cafea = perfecțiune.', 6],
  ['praline-cafea-etiopiana', 4, 'Intense și complexe. Pentru cineva care nu e fan cafea puternică ar putea fi mai mult, dar eu le ador.', 2],

  ['praline-pasionata-caise', 5, 'Gustul tropical e vivid — parcă mănânci fruct proaspăt, nu ciocolată cu aromă artificială. Minunat!', 7],
  ['praline-pasionata-caise', 4, 'Foarte proaspete și fructate. O mică coadă la gust de caise în final — exact ce trebuie.', 5],

  ['trufe-clasice-cacao', 5, 'Trufele cu cacao sunt un clasic absolut și astea o fac perfect: forma imperfectă, rustică, gustul nobil. Valrhona se simte.', 8],
  ['trufe-clasice-cacao', 5, 'Le-am luat pentru prima dată la recomandarea unui prieten. Acum le comand lunar. Sunt singurele trufe pe care le mănânc.', 9],
  ['trufe-clasice-cacao', 4, 'Excepționale. Mi-ar plăcea poate puțin mai multă pudră de cacao pe exterior, dar gustul este de nota 10.', 0],

  ['trufe-ganache-champagne', 5, 'O trufă rafinată, de ocazie specială. Champagne-ul se simte discret, nu copleșitor. Textura ganache-ului e de mătase.', 10],
  ['trufe-ganache-champagne', 4, 'Le-am luat pentru aniversarea noastră și au fost un hit. Prețul e ceva mai ridicat dar pentru o ocazie specială merită.', 11],

  ['caramele-moi-unt-sarat', 5, 'Caramelele cu unt sărat sunt revelatorii. Nu mai pot mânca altceva după astea — totul pare fad în comparație.', 3],
  ['caramele-moi-unt-sarat', 5, 'Textura este impecabilă — moi dar cu corp, nu lipicioase. Sarea vine la final și creează un postgust lung.', 4],
  ['caramele-moi-unt-sarat', 4, 'Delicioase, exact cât trebuie de sărate. Le-am luat ca souvenir pentru un prieten din afara țării și a fost extaziat.', 1],

  ['caramele-glazurate-noir', 5, 'Combinația caramel-ciocolată neagră este câștigătoare. Crăpătura cojii de ciocolată la prima mușcătură este satisfăcătoare maxim.', 6],
  ['caramele-glazurate-noir', 5, 'Sunt preferatele mele de departe. Nivelul următor față de caramelele simple.', 7],

  ['portocale-glasate-noir', 5, 'Portocalele confiate sunt perfect echilibrate — dulci dar cu amăreala coajei. Ciocolata neagră le amplifică frumos.', 2],
  ['portocale-glasate-noir', 4, 'Clasic reinterpretat excellent. Mi-ar plăcea poate felii mai groase, dar gustul este 10/10.', 8],

  ['smochine-uscate-lapte', 5, 'Smochinele cu ciocolată cu lapte și scorțișoară sunt o combinație de toamnă perfectă. Le-am cumpărat pentru o nuntă și toți au întrebat de unde sunt.', 9],
  ['smochine-uscate-lapte', 4, 'Naturale, aromate, delicioase. Scorțișoara din Ceylon face diferența față de scorțișoara obișnuită.', 5],

  ['cutie-cadou-deluxe-500g', 5, 'Am cumpărat cutia Deluxe pentru un cadou de afaceri și a lăsat o impresie memorabilă. Prezentarea este impecabilă, conținutul la fel.', 10],
  ['cutie-cadou-deluxe-500g', 5, 'Cel mai bun cadou pe care l-am oferit vreodată. Persoana respectivă mi-a mulțumit de trei ori în aceeași zi.', 11],
  ['cutie-cadou-deluxe-500g', 5, 'Raport calitate-preț excelent pentru ce primești. Fiecare produs din cutie este la nivelul unui cofetăr de lux.', 3],

  ['set-degustare-artizanal', 5, 'Ghidul de degustare inclus face experiența cu totul specială. L-am folosit pentru un seral cu prieteni și a fost o seară memorabilă.', 0],
  ['set-degustare-artizanal', 4, 'Perfect pentru cineva care vrea să descopere ciocolata artizanală. Variația de profile, de la blanc la noir 85%, este bine gândită.', 6],

  ['bombonierie-asortata-sezoniera', 5, 'Îmi place că selecția se schimbă lunar. E o surpriză plăcută de fiecare dată. Toate piesele sunt la nivel înalt.', 7],
  ['bombonierie-asortata-sezoniera', 4, 'Foarte bune, prezentarea cutiei este frumoasă. Cred că ar fi și mai bine cu o mică hartă a conținutului.', 1],

  ['mix-ciocolata-calda-intensa', 5, 'Cea mai bună ciocolată caldă pe care am pregătit-o acasă. Cu lapte integral este la nivelul unui bar de specialitate.', 2],
  ['mix-ciocolata-calda-intensa', 5, 'Vanilia și scorțișoara sunt discrete dar prezente. 25g la 200ml lapte e rețeta perfectă, nu modifica!', 9],
  ['mix-ciocolata-calda-intensa', 4, 'Calitate excelentă, se simte că e ciocolată adevărată măcinată, nu praf cu aditivi. Îl recomand călduros.', 4],
];

/* ─── main ─────────────────────────────────────────────────────────── */
async function run() {
  await connectDB();

  if (FORCE) {
    await Product.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Produse și recenzii existente șterse (--force).');
  }

  /* --- produse --- */
  const inserted = [];
  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ slug: p.slug });
    if (exists) {
      console.log(`  ↩  Produs deja existent: ${p.name}`);
      inserted.push(exists);
      continue;
    }
    const doc = await Product.create(p);
    inserted.push(doc);
    console.log(`  ✅ ${doc.name}`);
  }
  console.log(`\n📦 ${inserted.length} produse în baza de date.\n`);

  /* --- recenzii --- */
  const slugToId = Object.fromEntries(inserted.map(p => [p.slug, p._id]));
  let reviewCount = 0;

  for (const [slug, rating, text, ri] of REVIEW_DATA) {
    const productId = slugToId[slug];
    if (!productId) continue;
    const { name, email } = REVIEWERS[ri];
    try {
      await Review.create({ product: productId, name, email, rating, text, status: 'approved' });
      reviewCount++;
    } catch (e) {
      if (e.code === 11000) {
        /* recenzie duplicată (același email + produs) — skip */
      } else {
        throw e;
      }
    }
  }
  console.log(`⭐ ${reviewCount} recenzii adăugate.\n`);

  /* --- recalculează rating pentru fiecare produs --- */
  for (const prod of inserted) {
    const reviews = await Review.find({ product: prod._id, status: 'approved' });
    if (!reviews.length) continue;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(prod._id, {
      rating: Math.round(avg * 10) / 10,
      reviewsCount: reviews.length,
    });
  }
  console.log('📊 Rating-uri recalculate.\n');

  /* --- setări magazin --- */
  const settings = await Settings.findOne();
  const featuredSlugs = [
    'praline-clasice-9',
    'trufe-clasice-cacao',
    'caramele-moi-unt-sarat',
  ];
  const featuredReviews = [];
  for (const slug of featuredSlugs) {
    const prodId = slugToId[slug];
    if (!prodId) continue;
    const rev = await Review.findOne({ product: prodId, rating: 5, status: 'approved' });
    if (rev) featuredReviews.push(rev._id);
  }
  const heroRevProd = slugToId['tableta-lapte-caramel-sarat'];
  const heroRev = heroRevProd
    ? await Review.findOne({ product: heroRevProd, rating: 5, status: 'approved' })
    : null;

  const settingsUpdate = {
    categories: [
      'Tablete', 'Praline', 'Trufe', 'Caramele',
      'Fructe glasate', 'Cadouri', 'Bombonierie', 'Ciocolată caldă',
    ],
    featuredReviews,
    heroReview: heroRev?._id ?? null,
  };

  if (settings) {
    await Settings.findByIdAndUpdate(settings._id, settingsUpdate);
  } else {
    await Settings.create(settingsUpdate);
  }
  console.log('⚙️  Setări actualizate (categorii, testimoniale, hero).\n');

  await mongoose.disconnect();
  console.log('✅ Seed complet! Deconectat de la MongoDB.\n');
}

run().catch(err => {
  console.error('❌ Eroare seed:', err.message);
  process.exit(1);
});
