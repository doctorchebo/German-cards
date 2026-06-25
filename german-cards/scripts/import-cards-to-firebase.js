const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");
const readline = require("readline");

function parseEnv(contents) {
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const envPath = path.join(__dirname, "..", ".env");
const env = parseEnv(fs.readFileSync(envPath, "utf8"));

const DATABASE_URL = env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
const API_KEY = env.EXPO_PUBLIC_FIREBASE_API_KEY;

if (!DATABASE_URL || !API_KEY) {
  console.error("Missing EXPO_PUBLIC_FIREBASE_DATABASE_URL or EXPO_PUBLIC_FIREBASE_API_KEY in .env");
  process.exit(1);
}

function sanitizeKey(input) {
  return input.trim().toLowerCase().replace(/[.#$\/\[\]]/g, "_");
}

function makeCardKey(language, prompt, answer) {
  return `${sanitizeKey(language)}__${sanitizeKey(prompt)}__${sanitizeKey(answer)}`;
}

function loadSeedCards() {
  const seedCardsPath = path.join(__dirname, "..", "src", "data", "seed-cards.ts");
  const source = fs.readFileSync(seedCardsPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: () => ({}),
  };

  vm.runInNewContext(transpiled, sandbox, { filename: "seed-cards.ts" });

  const cards = sandbox.module.exports.seedCards;
  if (!Array.isArray(cards)) {
    throw new Error("Failed to load seedCards from src/data/seed-cards.ts");
  }

  return cards;
}

function buildPayload(cards) {
  const payload = {};
  const createdAt = Date.now();

  for (const card of cards) {
    if (!card || typeof card !== "object") continue;
    const language = String(card.language || "").trim();
    const prompt = String(card.prompt || "").trim();
    const answer = String(card.answer || "").trim();
    if (!language || !prompt || !answer) continue;

    const key = makeCardKey(language, prompt, answer);
    payload[key] = { language, prompt, answer, createdAt };
  }

  return payload;
}

function askForCredentials() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter Firebase user email: ", (email) => {
      const mutableRl = rl;
      mutableRl.stdoutMuted = true;
      mutableRl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (mutableRl.stdoutMuted) {
          mutableRl.output.write("*");
        } else {
          mutableRl.output.write(stringToWrite);
        }
      };

      rl.question("Enter password: ", (password) => {
        rl.close();
        process.stdout.write("\n");
        resolve({ email: email.trim(), password });
      });
    });
  });
}

async function uploadPayload(url, payload, idToken) {
  const uploadUrl = idToken ? `${url}?auth=${idToken}` : url;

  return fetch(uploadUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function signIn(email, password) {
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!authRes.ok) {
    throw new Error(`Sign-in failed: ${await authRes.text()}`);
  }

  const authData = await authRes.json();
  return authData.idToken;
}

async function fetchExistingCards(url) {
  const res = await fetch(url);
  if (!res.ok) {
    return {};
  }
  return (await res.json()) || {};
}

async function run() {
  const seedCards = loadSeedCards();
  const fullPayload = buildPayload(seedCards);

  console.log(`Loaded ${seedCards.length} cards from src/data/seed-cards.ts`);
  console.log(`Prepared ${Object.keys(fullPayload).length} cards.`);

  const url = `${DATABASE_URL}/cardsByKey.json`;
  
  console.log("Fetching existing cards from Firebase to avoid redundant uploads...");
  const existingCards = await fetchExistingCards(url);
  
  const newPayload = {};
  let newCount = 0;
  
  for (const [key, cardData] of Object.entries(fullPayload)) {
    if (!existingCards[key]) {
      newPayload[key] = cardData;
      newCount++;
    }
  }

  if (newCount === 0) {
    console.log("All cards already exist in Firebase. Nothing to upload.");
    return;
  }

  console.log(`Found ${newCount} new cards to upload. Pushing to Firebase...`);

  const firstAttempt = await uploadPayload(url, newPayload);

  if (firstAttempt.ok) {
    console.log(`Successfully imported ${newCount} new cards to Firebase.`);
    return;
  }

  const firstErr = await firstAttempt.text();
  if (firstAttempt.status !== 401 && firstAttempt.status !== 403) {
    console.error(`Import failed (${firstAttempt.status}):`, firstErr);
    process.exit(1);
  }

  console.log("Auth required. Please sign in.");
  const { email, password } = await askForCredentials();

  try {
    const idToken = await signIn(email, password);
    const secondAttempt = await uploadPayload(url, newPayload, idToken);

    if (!secondAttempt.ok) {
      console.error("Import failed after auth:", await secondAttempt.text());
      process.exit(1);
    }

    console.log(`Successfully imported ${newCount} new cards to Firebase.`);
  } catch (err) {
    console.error("Error during auth/upload:", err);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
