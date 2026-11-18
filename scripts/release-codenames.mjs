const prefixes = [
  "Ashen", "Autumn", "Blood", "Crimson", "Darkwood", "Dusk",
  "Ebon", "Eternal", "Fallen", "Feral", "Forgotten", "Frost",
  "Ghostly", "Hallowed", "Hollow", "Ivory", "Lunar", "Midnight",
  "Moonlit", "Mystic", "Nightfall", "Obsidian", "Phantom", "Raven",
  "Scarlet", "Shadow", "Silent", "Silver", "Twilight", "Wicked",
];

const endings = [
  "Covenant", "Crown", "Dawn", "Dominion", "Dream", "Eclipse",
  "Ember", "Fang", "Forest", "Guardian", "Harvest", "Howl",
  "Hunt", "Legacy", "Moon", "Oath", "Omen", "Pack", "Pact",
  "Path", "Reckoning", "Ritual", "Secrets", "Shadow", "Song",
  "Spirit", "Throne", "Veil", "Vigil", "Whisper",
];

const key = (name) => name.trim().toLowerCase();

export function validateCodenameData(data) {
  for (const field of ["available", "used"]) {
    if (!Array.isArray(data?.[field])
      || data[field].some((name) => typeof name !== "string" || !name.trim())) {
      throw new Error(`Lista de codinomes "${field}" inválida.`);
    }
  }
}

export function selectCodename(data, version, currentCodename) {
  validateCodenameData(data);
  if (typeof currentCodename !== "string" || !currentCodename.trim()) {
    throw new Error("O codinome atual do pacote é inválido.");
  }
  if (typeof version !== "string" || !version.trim()) {
    throw new Error("A versão da release é inválida.");
  }

  const used = new Set(data.used.map(key));
  if (!used.has(key(currentCodename))) {
    data.used.push(currentCodename);
    used.add(key(currentCodename));
  }

  let codename;
  while (data.available.length > 0 && !codename) {
    const candidate = data.available.shift().trim();
    if (!used.has(key(candidate))) codename = candidate;
  }

  if (!codename) {
    for (const prefix of prefixes) {
      codename = endings.map((ending) => `${prefix} ${ending}`)
        .find((candidate) => !used.has(key(candidate)));
      if (codename) break;
    }
  }

  if (!codename) {
    const base = `Moonlit Legacy v${version}`;
    codename = base;
    for (let suffix = 2; used.has(key(codename)); suffix += 1) {
      codename = `${base} ${suffix}`;
    }
  }

  data.used.push(codename);
  return codename;
}
