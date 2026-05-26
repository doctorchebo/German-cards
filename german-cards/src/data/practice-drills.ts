export type MultipleChoiceExercise = {
  id: string;
  sentence: string;
  answer: string;
  options: string[];
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const withOptions = (
  id: string,
  sentence: string,
  answer: string,
  pool: string[],
): MultipleChoiceExercise => {
  const distractors = shuffle(pool.filter((p) => p !== answer)).slice(0, 3);
  return { id, sentence, answer, options: shuffle([answer, ...distractors]) };
};

const withVariant = (sentence: string, variant: string) => {
  if (sentence.endsWith(".")) {
    return `${sentence.slice(0, -1)} ${variant}.`;
  }
  return `${sentence} ${variant}`;
};

const PREPOSITIONS = [
  "auf",
  "an",
  "in",
  "unter",
  "uber",
  "vor",
  "hinter",
  "neben",
  "zwischen",
  "mit",
  "ohne",
  "fur",
  "gegen",
  "durch",
  "um",
  "von",
  "zu",
  "bei",
  "nach",
  "seit",
  "aus",
];

const prepTemplates: { sentence: string; answer: string }[] = [
  { sentence: "Ich warte ___ den Bus.", answer: "auf" },
  { sentence: "Wir fahren ___ Berlin.", answer: "nach" },
  { sentence: "Er spricht ___ seinem Freund.", answer: "mit" },
  { sentence: "Das Geschenk ist ___ dich.", answer: "fur" },
  { sentence: "Sie kommt ___ der Schule.", answer: "aus" },
  { sentence: "Wir gehen ___ dem Hund spazieren.", answer: "mit" },
  { sentence: "Das Buch liegt ___ dem Tisch.", answer: "auf" },
  { sentence: "Ich lerne Deutsch ___ zwei Jahren.", answer: "seit" },
  { sentence: "Wir laufen ___ den Park.", answer: "durch" },
  { sentence: "Der Film beginnt ___ 20 Uhr.", answer: "um" },
  { sentence: "Wir treffen uns ___ dem Kino.", answer: "vor" },
  { sentence: "Das Bild hangt ___ der Wand.", answer: "an" },
  { sentence: "Ich komme ___ 10 Minuten zuruck.", answer: "in" },
  { sentence: "Sie stellt die Tasse ___ den Tisch.", answer: "auf" },
  { sentence: "Der Hund liegt ___ dem Bett.", answer: "unter" },
  { sentence: "Die Lampe hangt ___ dem Sofa.", answer: "uber" },
  { sentence: "Das Auto steht ___ dem Haus.", answer: "vor" },
  { sentence: "Die Katze sitzt ___ dem Stuhl.", answer: "unter" },
  { sentence: "Wir sprechen ___ das Problem.", answer: "uber" },
  { sentence: "Ich komme ___ der Arbeit nach Hause.", answer: "von" },
  { sentence: "Er geht ___ die Bank.", answer: "in" },
  { sentence: "Das Cafe ist ___ dem Bahnhof.", answer: "bei" },
  { sentence: "Wir fahren ___ dem Zug.", answer: "mit" },
  { sentence: "Er wohnt ___ seinen Eltern.", answer: "bei" },
  { sentence: "Ich gehe ___ meinen Bruder ins Kino.", answer: "mit" },
];

const sentenceVariants = [
  "heute",
  "morgen",
  "am Wochenende",
  "im Winter",
  "im Sommer",
  "nach der Arbeit",
  "am Abend",
  "fruh am Morgen",
  "mit meinen Freunden",
  "allein",
  "mit der Familie",
  "in der Stadt",
  "auf dem Land",
  "im Urlaub",
  "auf dem Weg zur Arbeit",
  "nach dem Kurs",
  "vor dem Essen",
  "nach dem Essen",
  "bei Regen",
  "bei Sonne",
  "an Feiertagen",
  "jeden Dienstag",
  "jeden Freitag",
  "im Fruehling",
  "im Herbst",
  "mit viel Motivation",
  "ganz schnell",
  "sehr ruhig",
  "ohne Stress",
  "mit guter Laune",
];

const prepositionsGenerated: MultipleChoiceExercise[] = [];
for (let i = 0; i < 210; i += 1) {
  const template = prepTemplates[i % prepTemplates.length];
  const variant = sentenceVariants[Math.floor(i / prepTemplates.length)];
  const sentence = withVariant(template.sentence, variant);
  prepositionsGenerated.push(
    withOptions(`prep-${i + 1}`, sentence, template.answer, PREPOSITIONS),
  );
}

export const prepositionExercises = prepositionsGenerated;

type VerbForms = {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
  Sie: string;
  man: string;
};

const verbBank: { infinitive: string; forms: VerbForms; complement: string }[] = [
  { infinitive: "sein", forms: { ich: "bin", du: "bist", er: "ist", wir: "sind", ihr: "seid", sie: "sind", Sie: "sind", man: "ist" }, complement: "heute muede" },
  { infinitive: "haben", forms: { ich: "habe", du: "hast", er: "hat", wir: "haben", ihr: "habt", sie: "haben", Sie: "haben", man: "hat" }, complement: "ein Problem" },
  { infinitive: "gehen", forms: { ich: "gehe", du: "gehst", er: "geht", wir: "gehen", ihr: "geht", sie: "gehen", Sie: "gehen", man: "geht" }, complement: "nach Hause" },
  { infinitive: "kommen", forms: { ich: "komme", du: "kommst", er: "kommt", wir: "kommen", ihr: "kommt", sie: "kommen", Sie: "kommen", man: "kommt" }, complement: "spaet an" },
  { infinitive: "machen", forms: { ich: "mache", du: "machst", er: "macht", wir: "machen", ihr: "macht", sie: "machen", Sie: "machen", man: "macht" }, complement: "die Aufgabe" },
  { infinitive: "essen", forms: { ich: "esse", du: "isst", er: "isst", wir: "essen", ihr: "esst", sie: "essen", Sie: "essen", man: "isst" }, complement: "Brot" },
  { infinitive: "lesen", forms: { ich: "lese", du: "liest", er: "liest", wir: "lesen", ihr: "lest", sie: "lesen", Sie: "lesen", man: "liest" }, complement: "ein Buch" },
  { infinitive: "fahren", forms: { ich: "fahre", du: "faehrst", er: "faehrt", wir: "fahren", ihr: "fahrt", sie: "fahren", Sie: "fahren", man: "faehrt" }, complement: "nach Hamburg" },
  { infinitive: "sehen", forms: { ich: "sehe", du: "siehst", er: "sieht", wir: "sehen", ihr: "seht", sie: "sehen", Sie: "sehen", man: "sieht" }, complement: "einen Film" },
  { infinitive: "nehmen", forms: { ich: "nehme", du: "nimmst", er: "nimmt", wir: "nehmen", ihr: "nehmt", sie: "nehmen", Sie: "nehmen", man: "nimmt" }, complement: "den Zug" },
  { infinitive: "sprechen", forms: { ich: "spreche", du: "sprichst", er: "spricht", wir: "sprechen", ihr: "sprecht", sie: "sprechen", Sie: "sprechen", man: "spricht" }, complement: "Deutsch" },
  { infinitive: "geben", forms: { ich: "gebe", du: "gibst", er: "gibt", wir: "geben", ihr: "gebt", sie: "geben", Sie: "geben", man: "gibt" }, complement: "dir das Buch" },
  { infinitive: "laufen", forms: { ich: "laufe", du: "laeufst", er: "laeuft", wir: "laufen", ihr: "lauft", sie: "laufen", Sie: "laufen", man: "laeuft" }, complement: "sehr schnell" },
  { infinitive: "finden", forms: { ich: "finde", du: "findest", er: "findet", wir: "finden", ihr: "findet", sie: "finden", Sie: "finden", man: "findet" }, complement: "die Loesung" },
  { infinitive: "trinken", forms: { ich: "trinke", du: "trinkst", er: "trinkt", wir: "trinken", ihr: "trinkt", sie: "trinken", Sie: "trinken", man: "trinkt" }, complement: "Wasser" },
  { infinitive: "helfen", forms: { ich: "helfe", du: "hilfst", er: "hilft", wir: "helfen", ihr: "helft", sie: "helfen", Sie: "helfen", man: "hilft" }, complement: "der Familie" },
  { infinitive: "tragen", forms: { ich: "trage", du: "traegst", er: "traegt", wir: "tragen", ihr: "tragt", sie: "tragen", Sie: "tragen", man: "traegt" }, complement: "einen Mantel" },
  { infinitive: "arbeiten", forms: { ich: "arbeite", du: "arbeitest", er: "arbeitet", wir: "arbeiten", ihr: "arbeitet", sie: "arbeiten", Sie: "arbeiten", man: "arbeitet" }, complement: "heute lang" },
  { infinitive: "bleiben", forms: { ich: "bleibe", du: "bleibst", er: "bleibt", wir: "bleiben", ihr: "bleibt", sie: "bleiben", Sie: "bleiben", man: "bleibt" }, complement: "zu Hause" },
  { infinitive: "schreiben", forms: { ich: "schreibe", du: "schreibst", er: "schreibt", wir: "schreiben", ihr: "schreibt", sie: "schreiben", Sie: "schreiben", man: "schreibt" }, complement: "einen Brief" },
  { infinitive: "wissen", forms: { ich: "weiss", du: "weisst", er: "weiss", wir: "wissen", ihr: "wisst", sie: "wissen", Sie: "wissen", man: "weiss" }, complement: "die Antwort" },
  { infinitive: "denken", forms: { ich: "denke", du: "denkst", er: "denkt", wir: "denken", ihr: "denkt", sie: "denken", Sie: "denken", man: "denkt" }, complement: "an morgen" },
  { infinitive: "bringen", forms: { ich: "bringe", du: "bringst", er: "bringt", wir: "bringen", ihr: "bringt", sie: "bringen", Sie: "bringen", man: "bringt" }, complement: "Brot mit" },
  { infinitive: "bezahlen", forms: { ich: "bezahle", du: "bezahlst", er: "bezahlt", wir: "bezahlen", ihr: "bezahlt", sie: "bezahlen", Sie: "bezahlen", man: "bezahlt" }, complement: "die Rechnung" },
  { infinitive: "wohnen", forms: { ich: "wohne", du: "wohnst", er: "wohnt", wir: "wohnen", ihr: "wohnt", sie: "wohnen", Sie: "wohnen", man: "wohnt" }, complement: "in Berlin" },
];

const pronouns: (keyof VerbForms)[] = [
  "ich",
  "du",
  "er",
  "wir",
  "ihr",
  "sie",
  "Sie",
  "man",
];

const conjugationGenerated: MultipleChoiceExercise[] = [];
for (let i = 0; i < 200; i += 1) {
  const verb = verbBank[i % verbBank.length];
  const pronoun = pronouns[Math.floor(i / verbBank.length) % pronouns.length];
  const answer = verb.forms[pronoun];
  const pool = Array.from(new Set(pronouns.map((p) => verb.forms[p])));
  const sentence = `${pronoun} ___ (${verb.infinitive}) ${verb.complement}`;
  conjugationGenerated.push(
    withOptions(`verb-${i + 1}`, sentence, answer, pool),
  );
}

export const conjugationExercises = conjugationGenerated;

const articlePool = [
  "der", "die", "das", "den", "dem", "des",
  "ein", "eine", "einen", "einem", "einer", "eines",
];

const articleTemplates = [
  { s: "Ich sehe ___ Mann. (Akkusativ)", a: "den" },
  { s: "Ich helfe ___ Mann. (Dativ)", a: "dem" },
  { s: "Das ist ___ Mann. (Nominativ)", a: "der" },
  { s: "Das Auto ___ Mannes ist neu. (Genitiv)", a: "des" },
  { s: "Ich sehe ___ Frau. (Akkusativ)", a: "die" },
  { s: "Ich helfe ___ Frau. (Dativ)", a: "der" },
  { s: "Das ist ___ Frau. (Nominativ)", a: "die" },
  { s: "Die Tasche ___ Frau ist rot. (Genitiv)", a: "der" },
  { s: "Ich sehe ___ Kind. (Akkusativ)", a: "das" },
  { s: "Ich helfe ___ Kind. (Dativ)", a: "dem" },
];

const articleGenerated: MultipleChoiceExercise[] = [];
for (let i = 0; i < 220; i += 1) {
  const t = articleTemplates[i % articleTemplates.length];
  const variant = sentenceVariants[Math.floor(i / articleTemplates.length)];
  const sentence = withVariant(t.s, variant);
  articleGenerated.push(withOptions(`art-${i + 1}`, sentence, t.a, articlePool));
}

export const articleCaseExercises = articleGenerated;
