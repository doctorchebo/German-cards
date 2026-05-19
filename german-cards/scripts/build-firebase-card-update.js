const fs = require("fs");
const path = require("path");

function parseEnv(contents) {
  const lines = contents.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key] = rest.join("=");
  }
  return env;
}

function sanitizeKey(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.#$\/\[\]]/g, "_");
}

function makeCardKey(language, prompt, answer) {
  return `${sanitizeKey(language)}__${sanitizeKey(prompt)}__${sanitizeKey(answer)}`;
}

const newCards = [
  {
    language: "de",
    prompt: "dinge die wir jeden tag machen",
    answer: "things we do every day",
  },
  {
    language: "de",
    prompt: "wir schlafen jeden tag",
    answer: "we sleep every day",
  },
  {
    language: "de",
    prompt: "die meisten menschen schlafen zwischen sechs und sieben stunden",
    answer: "most people sleep between six and seven hours",
  },
  {
    language: "de",
    prompt: "wir liegen im bett jeden morgen",
    answer: "we lie in bed every morning",
  },
  { language: "de", prompt: "dann wachen wir auf", answer: "then we wake up" },
  {
    language: "de",
    prompt: "jeden morgen öffnen wir unsere augen",
    answer: "every morning we open our eyes",
  },
  {
    language: "de",
    prompt: "jeden morning stehen wir auf",
    answer: "every morning we get up",
  },
  {
    language: "de",
    prompt: "vielleicht nicht wenn wir krank sind",
    answer: "maybe not if we are sick",
  },
  { language: "de", prompt: "stehen wir nicht auf", answer: "we don't get up" },
  {
    language: "de",
    prompt: "bleiben wir im bett",
    answer: "let’s stay in bed",
  },
  {
    language: "de",
    prompt: "wir essen und wir trinken jeden tag",
    answer: "we eat and we drink every day",
  },
  {
    language: "de",
    prompt: "wie oft es ihr am tag, drei mal?",
    answer: "how often does she do it a day, three times?",
  },
  {
    language: "de",
    prompt: "wie viel trinkt ihr? zwei liter wasser am tag?",
    answer: "how much do you drink? two liters of water a day?",
  },
  {
    language: "de",
    prompt: "wir atmen jeden tag",
    answer: "we breathe every day",
  },
  {
    language: "de",
    prompt: "es wäre schlecht wenn wir nicht jeden tag atmen",
    answer: "it would be very bad if we didn’t breathe every day",
  },
  {
    language: "de",
    prompt: "wir laufen jeden tag im haus",
    answer: "we walk around the house every day",
  },
  { language: "de", prompt: "vielleicht", answer: "perhaps" },
  {
    language: "de",
    prompt: "vielleicht laufen wir zur schule und die arbeit ins büro",
    answer: "Maybe we'll walk to school and work in the office",
  },
  {
    language: "de",
    prompt: "vielleicht laufen wir zum supermarkt zum einkaufen",
    answer: "Maybe we'll walk to the supermarket to do some shopping",
  },
  {
    language: "de",
    prompt: "vielleicht fahren wir mit dem auto zum supermarkt",
    answer: "maybe we’ll drive to the supermarket",
  },
  {
    language: "de",
    prompt: "ich glaube das wir jeden tag eine tür aufmachen",
    answer: "I believe that we open a door every day",
  },
  { language: "de", prompt: "mindestens", answer: "at least" },
  {
    language: "de",
    prompt: "wir machen jeden tag mindestens eine tür auf und wieder zu",
    answer: "we open and close at least one door every day",
  },
  {
    language: "de",
    prompt: "jeden tag sitzen wir",
    answer: "we sit down every day",
  },
  {
    language: "de",
    prompt: "ich sitze auf einem stuhl",
    answer: "I’m sitting on a chair",
  },
  {
    language: "de",
    prompt: "jeden tag sitzen wir zum beispieel auf stühlen und dem sofa",
    answer: "Every day, for example, we sit on chairs and the sofa.",
  },
  {
    language: "de",
    prompt: "wir sitzen im bus oder im auto oder in straßenbahn",
    answer: "We are sitting in the bus or in the car or in the tram.",
  },
  {
    language: "de",
    prompt: "jeden tag stehen wir und wir sitzen",
    answer: "every day we stand and we sit",
  },
  {
    language: "de",
    prompt: "jeden tag gehen wir auf die toilette in einem badezimmer",
    answer: "we go to the toilet every day in a bathroom",
  },
  {
    language: "de",
    prompt: "wo es die toilette gibt",
    answer: "where the toilet is",
  },
  {
    language: "de",
    prompt: "die waschbecke wo man sich die hände waschen kann",
    answer: "the washbasin where you can wash your hands",
  },
  {
    language: "de",
    prompt: "also das waren ein paar die dinge wir jeden tag machen",
    answer: "So those were a few of the things we do every day",
  },
  { language: "de", prompt: "den körper", answer: "the body" },
  { language: "de", prompt: "die körperteile", answer: "the body parts" },
  {
    language: "de",
    prompt: "heute reden wir über den körper",
    answer: "today we talk about the body",
  },
  {
    language: "de",
    prompt: "als erstes körpeteil ist mein kopf",
    answer: "the first body part is my head",
  },
  {
    language: "de",
    prompt: "ich habe haare am kopf",
    answer: "I have hair on my head",
  },
  { language: "de", prompt: "der hals", answer: "the neck" },
  {
    language: "de",
    prompt: "mein kopf sitzt auf meinem hals",
    answer: "my head sits on my neck",
  },
  {
    language: "de",
    prompt: "hier sind meine schultern",
    answer: "here are my shoulders",
  },
  {
    language: "de",
    prompt: "das ist meine linke schulter",
    answer: "this is my left arm",
  },
  {
    language: "de",
    prompt: "das it meine rechte schulter",
    answer: "this is my right arm",
  },
  {
    language: "de",
    prompt: "das sind meine arme",
    answer: "these are my arms",
  },
  {
    language: "de",
    prompt: "das ist mein linker arm",
    answer: "this is my left arm",
  },
  { language: "de", prompt: "das ist mein rechter arm", answer: "this is " },
  {
    language: "de",
    prompt: "das sind meine hände",
    answer: "these are my hande",
  },
  {
    language: "de",
    prompt: "eine hand mit fingern",
    answer: "a hand with fingern",
  },
  { language: "de", prompt: "die finger", answer: "the fingers" },
  {
    language: "de",
    prompt: "das ist meine rechte hand",
    answer: "this is my right arm",
  },
  { language: "de", prompt: "obwohl", answer: "although" },
  { language: "de", prompt: "die daumen", answer: "the thumbs" },
  { language: "de", prompt: "ich bin ein mensch", answer: "I’m a human being" },
  {
    language: "de",
    prompt: "viele menschen tragen ringe an den fingern",
    answer: "Many people wear rings on their fingers.",
  },
  {
    language: "de",
    prompt: "das sind meine knöchel",
    answer: "these are my knuckles",
  },
  {
    language: "de",
    prompt: "mit den hände kann man greifen und winken",
    answer: "you can grab and wave with your hands",
  },
  {
    language: "de",
    prompt: "mit den händen kann man klatschen",
    answer: "You can clap with your hands.",
  },
  { language: "de", prompt: "das ist mein bauch", answer: "this is my belly" },
  {
    language: "de",
    prompt: "ich habe hunger, also ich muss etwas essen",
    answer: "I am hungry, so I need to eat something.",
  },
  { language: "de", prompt: "etwas", answer: "something" },
  {
    language: "de",
    prompt: "das sind meine beine",
    answer: "these are my legs",
  },
  {
    language: "de",
    prompt: "mein rechtes bein und mein linkes bein",
    answer: "my right leg and my left leg",
  },
  { language: "de", prompt: "das ist mein knie", answer: "this is my knee" },
  {
    language: "de",
    prompt: "als ich klein war habe ich meine knie oft verletzt",
    answer: "when I was little I often injured my knees",
  },
  {
    language: "de",
    prompt: "ich bin auf meine knie gefallen",
    answer: "I fell to my knees",
  },
  {
    language: "de",
    prompt: "mit meinen beinen kann ich laufen",
    answer: "I can walk with my legs",
  },
  {
    language: "de",
    prompt: "ich kann rennen, schnell",
    answer: "I can run, fast",
  },
  {
    language: "de",
    prompt: "mit meinen beinen kann ich springen",
    answer: "I can jump with my legs",
  },
  {
    language: "de",
    prompt: "mit den beinen kann man auch tanzen",
    answer: "you can also dance with your legs",
  },
  {
    language: "de",
    prompt: "mit den beinen kann man stampfen",
    answer: "You can stomp your legs.",
  },
  {
    language: "de",
    prompt: "wenn man wütend ist, kann man mit den beinen stampfen",
    answer: "When you are angry, you can stamp your legs.",
  },
  {
    language: "de",
    prompt: "wenn man glücklich ist, kann man mit den beinen tanzen",
    answer: "When you are happy, you can dance with your legs.",
  },
  {
    language: "de",
    prompt: "das ist mein rechter fuß",
    answer: "this is my right foot",
  },
  {
    language: "de",
    prompt: "das ist mein linker fuß",
    answer: "this is my left foot",
  },
  {
    language: "de",
    prompt: "am fuß habe ich fünf zehe",
    answer: "I have five toes on my foot.",
  },
  {
    language: "de",
    prompt: "mit den füßen kann man stehen",
    answer: "you can stand with your feet",
  },
  { language: "de", prompt: "das ist mein rücken", answer: "this is my back" },
  {
    language: "de",
    prompt: "es gibt viele menschen die rückenprobleme haben",
    answer: "There are many people who have back problems.",
  },
  { language: "de", prompt: "leider", answer: "unfortunately" },
  {
    language: "de",
    prompt: "vergesst nicht zu liken",
    answer: "don’t forget to like",
  },
];

const payload = {};
for (const card of newCards) {
  const key = makeCardKey(card.language, card.prompt, card.answer);
  payload[key] = {
    language: card.language,
    prompt: card.prompt,
    answer: card.answer,
    createdAt: Date.now(),
  };
}

const outputPath = path.join(__dirname, "..", "tmp", "new-firebase-cards.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Wrote ${Object.keys(payload).length} cards to ${outputPath}`);
