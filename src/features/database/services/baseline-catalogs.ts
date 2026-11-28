export interface BaselineTerritoryDoc {
  docId: string;
  city: string;
  province: string;
  region: string;
  barangays: string[];
}

export interface BaselineQuestTemplateDoc {
  id: string;
  title: string;
  description: string;
  category: "daily" | "weekly";
  type: "steps" | "distance" | "scanBreed" | "boopSightings";
  targetValue: number;
  rewardPawPoints: number;
  targetBreed: string | null;
  isActive: boolean;
  weight: number;
}

export interface BaselineDexSpeciesDoc {
  id: string;
  dexNumber: number;
  name: string;
  commonName: string;
  coatPattern: string;
  rarity: "common" | "uncommon" | "rare" | "veryRare" | "mythic";
  description: string;
  habitat: string;
  defaultSeed: string;
}

export interface BaselineExplorerTitleDoc {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  tier: "bronze" | "silver" | "gold" | "platinum";
  isEquipped: boolean;
  unlockedAt: null;
}

export interface BaselineAchievementMilestoneDoc {
  tier: "bronze" | "silver" | "gold" | "platinum";
  targetValue: number;
  rewardPawPoints: number;
  rewardTitle: BaselineExplorerTitleDoc | null;
  isClaimed: boolean;
}

export interface BaselineAchievementTrackDoc {
  id: string;
  title: string;
  description: string;
  category:
    | "movement"
    | "discovery"
    | "environment"
    | "community"
    | "collection"
    | "mastery";
  currentProgress: number;
  unit: string;
  milestones: BaselineAchievementMilestoneDoc[];
}

const KNOWN_MOCK_USER_IDS = new Set([
  "user-mactan-boss",
  "user-purrfect-cap",
  "user-basak-paws",
  "user-mingming-hunter",
  "user-marigondon-kit",
  "user-tabby-tracker",
  "user-punta-meow",
  "user-calico-queen",
  "user-whiskers-ace",
  "user-prowler-sam",
  "user-cebu-strays",
  "user-bicol-explorer",
  "user-manila-whisperer",
  "user-tokyo-neko",
  "user-london-voyager",
  "user-seoul-paws",
]);

const KNOWN_MOCK_USERNAMES = new Set([
  "mactanboss",
  "purrfectcaptain",
  "basakpawprint",
  "mingminghunter",
  "marigondonkitty",
  "tabbytrackerph",
  "puntameow",
  "calicoqueen",
  "whiskersace",
  "alleyprowlersam",
  "cebustrayfinder",
  "bicolfelines",
  "manilacatwhisperer",
  "tokyonekomaster",
  "londonfelinevoyager",
  "seoulstreetpaws",
  "test.explorer",
]);

export function isMockFirestoreDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): boolean {
  const idLower = docId.toLowerCase();

  if (
    idLower.startsWith("seed-") ||
    idLower.startsWith("seed_") ||
    idLower.startsWith("mock-") ||
    idLower.startsWith("mock_") ||
    idLower.startsWith("dev-user-") ||
    idLower.startsWith("bot-") ||
    idLower.startsWith("demo-") ||
    idLower.startsWith("story-seed-") ||
    idLower.startsWith("sighting-seed-")
  ) {
    return true;
  }

  if (data.isMock === true || data.isSeed === true || data.isDemo === true) {
    return true;
  }

  if (collectionName === "users") {
    if (KNOWN_MOCK_USER_IDS.has(idLower) || /^user_\d+$/.test(idLower)) {
      return true;
    }
    const email = typeof data.email === "string" ? data.email.toLowerCase() : "";
    const username =
      typeof data.username === "string" ? data.username.toLowerCase() : "";
    if (
      email === "test.explorer@pokeiring.app" ||
      email.endsWith("@mock.pokeiring.app") ||
      KNOWN_MOCK_USERNAMES.has(username)
    ) {
      return true;
    }
  }

  if (collectionName === "sightings" || collectionName === "stories") {
    const ownerId =
      typeof data.userId === "string"
        ? data.userId.toLowerCase()
        : typeof data.explorerId === "string"
          ? data.explorerId.toLowerCase()
          : "";
    if (
      ownerId.startsWith("dev-user-") ||
      ownerId.startsWith("seed-") ||
      ownerId.startsWith("mock-") ||
      KNOWN_MOCK_USER_IDS.has(ownerId) ||
      /^user_\d+$/.test(ownerId)
    ) {
      return true;
    }
  }

  if (collectionName === "events") {
    // Flag legacy non-Calico demo event records seeded before deployment prep
    if (
      (docId === "event_moonlit_strays_2026" &&
        Number(data.bannerColorValue) === 0xff4c1d95) ||
      (docId === "event_cebu_shelter_partnership_2026" &&
        Number(data.bannerColorValue) === 0xff0f766e)
    ) {
      return true;
    }
  }

  return false;
}

export function buildBaselineAppConfig(nowIso = new Date().toISOString()) {
  return {
    maintenanceMode: false,
    maintenanceMessage:
      "Poke: Iring is undergoing scheduled upgrades. Exploring resumes shortly.",
    minAppVersion: "0.33.0",
    broadcastBanner: "",
    isBroadcastActive: false,
    doublePointsGlobal: false,
    updatedAt: nowIso,
    updatedBy: "Deployment Baseline Seeder",
  };
}

export function buildBaselineActiveSeason(now = new Date()) {
  const startsAt = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const endsAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
  return {
    id: "season_1",
    number: 1,
    title: "Season 1: Sunshine Strays",
    description:
      "Document sunny street cats and establish neighborhood territory control.",
    startsAt,
    endsAt,
    status: "active",
  };
}

function toTerritoryDocId(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

const RAW_TERRITORIES: Omit<BaselineTerritoryDoc, "docId">[] = [
  {
    city: "Lapu-Lapu City",
    province: "Cebu",
    region: "Central Visayas",
    barangays: [
      "Bankal",
      "Basak",
      "Buaya",
      "Gun-ob",
      "Ibo",
      "Mactan",
      "Marigondon",
      "Pajac",
      "Pajo",
      "Poblacion",
      "Pusok",
      "Subabasbas",
      "Canjulao",
      "Looc",
    ],
  },
  {
    city: "Cebu City",
    province: "Cebu",
    region: "Central Visayas",
    barangays: [
      "Lahug",
      "Banilad",
      "Guadalupe",
      "Mabolo",
      "Kasambagan",
      "Apas",
      "Kamputhaw",
      "Talamban",
      "Labangon",
      "Pardo",
      "Capitol Site",
      "Sambag I",
      "Sambag II",
    ],
  },
  {
    city: "Mandaue City",
    province: "Cebu",
    region: "Central Visayas",
    barangays: [
      "Tipolo",
      "Subangdaku",
      "Bakilid",
      "Banilad",
      "Casuntingan",
      "Maguikay",
      "Centro",
      "Guizo",
      "Ibabao-Estancia",
      "Cabancalan",
    ],
  },
  {
    city: "Taguig City",
    province: "Metro Manila",
    region: "National Capital Region",
    barangays: [
      "Fort Bonifacio (BGC)",
      "Western Bicutan",
      "Ususan",
      "Pinagsama",
      "Central Signal",
      "Upper Bicutan",
    ],
  },
  {
    city: "Makati City",
    province: "Metro Manila",
    region: "National Capital Region",
    barangays: [
      "Bel-Air",
      "Poblacion",
      "San Lorenzo",
      "Legazpi Village",
      "Pio del Pilar",
      "Bangkal",
    ],
  },
  {
    city: "Quezon City",
    province: "Metro Manila",
    region: "National Capital Region",
    barangays: [
      "Diliman",
      "Katipunan",
      "New Manila",
      "Cubao",
      "Commonwealth",
      "Batasan Hills",
      "Tandang Sora",
    ],
  },
  {
    city: "Manila City",
    province: "Metro Manila",
    region: "National Capital Region",
    barangays: [
      "Malate",
      "Ermita",
      "Intramuros",
      "Santa Cruz",
      "Sampaloc",
      "Binondo",
      "Paco",
    ],
  },
  {
    city: "Pasig City",
    province: "Metro Manila",
    region: "National Capital Region",
    barangays: [
      "Kapasigan",
      "San Antonio",
      "Ugong",
      "Oranbo",
      "Kapitolyo",
      "Maybunga",
      "Caniogan",
    ],
  },
  {
    city: "Davao City",
    province: "Davao del Sur",
    region: "Davao Region",
    barangays: [
      "Poblacion",
      "Buhangin",
      "Talomo",
      "Matina Crossing",
      "Agdao",
      "Toril",
    ],
  },
  {
    city: "Cagayan de Oro City",
    province: "Misamis Oriental",
    region: "Northern Mindanao",
    barangays: [
      "Carmen",
      "Macasandig",
      "Nazareth",
      "Kauswagan",
      "Lapasan",
      "Poblacion",
    ],
  },
  {
    city: "Iloilo City",
    province: "Iloilo",
    region: "Western Visayas",
    barangays: [
      "Jaro",
      "Mandurriao",
      "Molo",
      "La Paz",
      "City Proper",
      "Villa Arevalo",
    ],
  },
  {
    city: "Bacolod City",
    province: "Negros Occidental",
    region: "Western Visayas",
    barangays: [
      "Mandalagan",
      "Villamonte",
      "Mansilingan",
      "Singcang",
      "Bata",
      "Tangub",
    ],
  },
  {
    city: "Baguio City",
    province: "Benguet",
    region: "Cordillera Administrative Region",
    barangays: [
      "Session Road",
      "Burnham - Legarda",
      "Camp 7",
      "Loakan Proper",
      "Irisan",
      "Mines View",
    ],
  },
  {
    city: "Angeles City",
    province: "Pampanga",
    region: "Central Luzon",
    barangays: [
      "Balibago",
      "Malabañas",
      "Cutcut",
      "Sto. Rosario",
      "Pulung Maragul",
    ],
  },
];

export const BASELINE_TERRITORIES: BaselineTerritoryDoc[] = RAW_TERRITORIES.map(
  (t) => ({
    ...t,
    docId: toTerritoryDocId(t.city),
  })
);

export const BASELINE_QUEST_TEMPLATES: BaselineQuestTemplateDoc[] = [
  {
    id: "tpl_morning_prowl",
    title: "Morning Prowl",
    description: "Walk 1,500 steps today to map neighborhood cat spots.",
    category: "daily",
    type: "steps",
    targetValue: 1500,
    rewardPawPoints: 40,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_afternoon_stride",
    title: "Afternoon Stride",
    description: "Take 2,500 steps exploring alleyways and park perimeters.",
    category: "daily",
    type: "steps",
    targetValue: 2500,
    rewardPawPoints: 50,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_night_patrol",
    title: "Dusk Wanderer",
    description: "Walk 3,000 steps during cool dusk feline roaming hours.",
    category: "daily",
    type: "steps",
    targetValue: 3000,
    rewardPawPoints: 60,
    targetBreed: null,
    isActive: true,
    weight: 8,
  },
  {
    id: "tpl_cartographer_step",
    title: "Cartographer Step",
    description: "Cover 1.2 km exploring local feline territory.",
    category: "daily",
    type: "distance",
    targetValue: 1.2,
    rewardPawPoints: 50,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_alley_route",
    title: "Alley Route",
    description: "Walk 2.0 km charting stray routes through your barangay.",
    category: "daily",
    type: "distance",
    targetValue: 2.0,
    rewardPawPoints: 65,
    targetBreed: null,
    isActive: true,
    weight: 9,
  },
  {
    id: "tpl_perimeter_trek",
    title: "Perimeter Trek",
    description: "Cover 2.5 km inspecting nearby community landmarks.",
    category: "daily",
    type: "distance",
    targetValue: 2.5,
    rewardPawPoints: 75,
    targetBreed: null,
    isActive: true,
    weight: 7,
  },
  {
    id: "tpl_puspin_discovery",
    title: "Puspin Discovery",
    description: "Photograph and catalog a native Puspin street cat.",
    category: "daily",
    type: "scanBreed",
    targetValue: 1,
    rewardPawPoints: 50,
    targetBreed: "Puspin",
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_calico_whispers",
    title: "Calico Whispers",
    description: "Spot and catalog a tricolor Calico pattern cat.",
    category: "daily",
    type: "scanBreed",
    targetValue: 1,
    rewardPawPoints: 60,
    targetBreed: "Calico",
    isActive: true,
    weight: 8,
  },
  {
    id: "tpl_tabby_tracker",
    title: "Tabby Tracker",
    description: "Scan and identify a striped or classic Tabby cat.",
    category: "daily",
    type: "scanBreed",
    targetValue: 1,
    rewardPawPoints: 50,
    targetBreed: "Tabby",
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_friendly_neighbor",
    title: "Friendly Neighbor",
    description: "Boop 3 community cat sighting pins on the live map.",
    category: "daily",
    type: "boopSightings",
    targetValue: 3,
    rewardPawPoints: 40,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_territory_wanderer",
    title: "Territory Wanderer",
    description: "Accumulate 12,000 steps during your weekly patrols.",
    category: "weekly",
    type: "steps",
    targetValue: 12000,
    rewardPawPoints: 200,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_stray_guardian_steps",
    title: "Stray Vanguard",
    description: "Log 20,000 steps this week guarding local feline paths.",
    category: "weekly",
    type: "steps",
    targetValue: 20000,
    rewardPawPoints: 350,
    targetBreed: null,
    isActive: true,
    weight: 8,
  },
  {
    id: "tpl_weekly_distance_master",
    title: "Barangay Scout",
    description: "Cover 8.0 km total on foot charting feline territory.",
    category: "weekly",
    type: "distance",
    targetValue: 8.0,
    rewardPawPoints: 250,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_weekly_boop_marathon",
    title: "Community Pillar",
    description: "Boop 8 community cat sightings on the live map.",
    category: "weekly",
    type: "boopSightings",
    targetValue: 8,
    rewardPawPoints: 180,
    targetBreed: null,
    isActive: true,
    weight: 10,
  },
  {
    id: "tpl_multi_breed_chronicler",
    title: "Species Chronicler",
    description: "Scan and catalog 4 cat sightings into your Iring-Dex.",
    category: "weekly",
    type: "scanBreed",
    targetValue: 4,
    rewardPawPoints: 300,
    targetBreed: null,
    isActive: true,
    weight: 8,
  },
];

export const BASELINE_DEX_SPECIES: BaselineDexSpeciesDoc[] = [
  {
    id: "dex_001",
    dexNumber: 1,
    name: "Domestic Shorthair",
    commonName: "Classic Tabby Puspin",
    coatPattern: "Tabby",
    rarity: "common",
    description:
        "The iconic neighborhood explorer with agile reflexes and stripes suited for island sun.",
    habitat: "Residential fences, sari-sari store porches",
    defaultSeed: "Tabby Puspin 1",
  },
  {
    id: "dex_002",
    dexNumber: 2,
    name: "Puspin Calico",
    commonName: "Tricolor Fortune Cat",
    coatPattern: "Calico",
    rarity: "uncommon",
    description:
        "Celebrated for vibrant tri-colored patches believed to bring good fortune to homeowners.",
    habitat: "Awnings, flowerpots, rooftop edges",
    defaultSeed: "Calico Puspin 2",
  },
  {
    id: "dex_003",
    dexNumber: 3,
    name: "Puspin Tortoiseshell",
    commonName: "Tortie Guardian",
    coatPattern: "Tortoiseshell",
    rarity: "uncommon",
    description:
        "Spirited feline with rich mottled amber, gold, and dark patches and bold personality.",
    habitat: "Garden thickets, mango tree bases",
    defaultSeed: "Tortoiseshell 3",
  },
  {
    id: "dex_004",
    dexNumber: 4,
    name: "Puspin Tuxedo",
    commonName: "Dapper Night Patrol",
    coatPattern: "Tuxedo",
    rarity: "common",
    description:
        "Crisp black coat with white chest bib and white mittens, always dressed for patrol duty.",
    habitat: "Sports complexes, barangay halls",
    defaultSeed: "Tuxedo 4",
  },
  {
    id: "dex_005",
    dexNumber: 5,
    name: "Ginger Puspin",
    commonName: "Marmalade Sunbasker",
    coatPattern: "Orange Tabby",
    rarity: "common",
    description:
        "Playful orange feline with a single shared thought and exceptional midday loafing skills.",
    habitat: "Warm tricycle seats, tin roofs",
    defaultSeed: "Ginger Puspin 5",
  },
  {
    id: "dex_006",
    dexNumber: 6,
    name: "Midnight Puspin",
    commonName: "Solid Black Shadow",
    coatPattern: "Solid Black",
    rarity: "common",
    description:
        "Sleek ebony coat with gleaming green or copper eyes, master of neighborhood stealth.",
    habitat: "Quiet alleyways, vehicle shade",
    defaultSeed: "Midnight Shadow 6",
  },
  {
    id: "dex_007",
    dexNumber: 7,
    name: "Cloud Puspin",
    commonName: "Solid White Ghost",
    coatPattern: "Solid White",
    rarity: "rare",
    description:
        "Striking pure white feline often gifted with heterochromia odd-eyes.",
    habitat: "Sunlit verandas, tiled doorways",
    defaultSeed: "Cloud Puspin 7",
  },
  {
    id: "dex_008",
    dexNumber: 8,
    name: "Siamese",
    commonName: "Wichien Maat Point",
    coatPattern: "Colorpoint",
    rarity: "rare",
    description:
        "Elegant ancient breed characterized by vivid blue almond eyes and deep espresso color points.",
    habitat: "Gated courtyards, quiet balconies",
    defaultSeed: "Siamese 8",
  },
  {
    id: "dex_009",
    dexNumber: 9,
    name: "Persian",
    commonName: "Fluff Monarch",
    coatPattern: "Longhair Solid",
    rarity: "veryRare",
    description:
        "Luxurious long coat and calm dignified demeanor, rarely venturing into rough streets.",
    habitat: "Indoor window perches, manicured lawns",
    defaultSeed: "Persian 9",
  },
  {
    id: "dex_010",
    dexNumber: 10,
    name: "British Shorthair",
    commonName: "Cheshire Round Loaf",
    coatPattern: "Solid Blue",
    rarity: "rare",
    description:
        "Dense plush blue-gray coat and chubby cheeks with distinctive calm curiosity.",
    habitat: "Cozy cafes, indoor verandas",
    defaultSeed: "British Shorthair 10",
  },
  {
    id: "dex_011",
    dexNumber: 11,
    name: "Bengal",
    commonName: "Miniature Leopard",
    coatPattern: "Rosetted",
    rarity: "mythic",
    description:
        "Exotic wild-patterned coat with rosettes and high energy, an extraordinary neighborhood encounter.",
    habitat: "Tree branches, secured perimeters",
    defaultSeed: "Bengal Leopard 11",
  },
  {
    id: "dex_012",
    dexNumber: 12,
    name: "Scottish Fold",
    commonName: "Owl-Eared Sweetheart",
    coatPattern: "Folded Tabby",
    rarity: "veryRare",
    description:
        "Charming forward-folded ears and large expressive owl eyes that capture hearts immediately.",
    habitat: "Soft cushions, open doorways",
    defaultSeed: "Scottish Fold 12",
  },
  {
    id: "dex_013",
    dexNumber: 13,
    name: "Ragdoll",
    commonName: "Sapphire Ragdoll",
    coatPattern: "Mitted Point",
    rarity: "veryRare",
    description:
        "Docile, placid cat known for going limp in gentle arms and piercing sapphire gaze.",
    habitat: "Quiet living rooms, garden gazebos",
    defaultSeed: "Ragdoll 13",
  },
  {
    id: "dex_014",
    dexNumber: 14,
    name: "Russian Blue",
    commonName: "Emerald Gaze Blue",
    coatPattern: "Silvery Slate",
    rarity: "rare",
    description:
        "Silvery shimmer across a dense double coat accented by vivid emerald green eyes.",
    habitat: "Quiet shady lanes, high vantage walls",
    defaultSeed: "Russian Blue 14",
  },
  {
    id: "dex_015",
    dexNumber: 15,
    name: "Maine Coon",
    commonName: "Gentle Island Giant",
    coatPattern: "Tufted Shag",
    rarity: "mythic",
    description:
        "Majestic feline with lynx ear tufts, lion ruff mane, and enormous gentle presence.",
    habitat: "Spacious gardens, sea breeze perches",
    defaultSeed: "Maine Coon 15",
  },
  {
    id: "dex_016",
    dexNumber: 16,
    name: "Sphynx",
    commonName: "Sunstone Guardian",
    coatPattern: "Hairless Chamois",
    rarity: "mythic",
    description:
        "Warm chamois suede-like skin and big bat ears, warmth-seeking companion found in shaded spots.",
    habitat: "Heated indoor mats, shaded sun spots",
    defaultSeed: "Sphynx 16",
  },
];

function makeTitle(
  id: string,
  name: string,
  description: string,
  rarity: BaselineExplorerTitleDoc["rarity"],
  tier: BaselineExplorerTitleDoc["tier"]
): BaselineExplorerTitleDoc {
  return {
    id,
    name,
    description,
    rarity,
    tier,
    isEquipped: false,
    unlockedAt: null,
  };
}

function makeTrack(params: {
  id: string;
  title: string;
  description: string;
  category: BaselineAchievementTrackDoc["category"];
  unit: string;
  targets: [number, number, number, number];
  points: [number, number, number, number];
  bronzeTitle?: BaselineExplorerTitleDoc;
  silverTitle?: BaselineExplorerTitleDoc;
  goldTitle?: BaselineExplorerTitleDoc;
  platTitle?: BaselineExplorerTitleDoc;
}): BaselineAchievementTrackDoc {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    category: params.category,
    currentProgress: 0,
    unit: params.unit,
    milestones: [
      {
        tier: "bronze",
        targetValue: params.targets[0],
        rewardPawPoints: params.points[0],
        rewardTitle: params.bronzeTitle ?? null,
        isClaimed: false,
      },
      {
        tier: "silver",
        targetValue: params.targets[1],
        rewardPawPoints: params.points[1],
        rewardTitle: params.silverTitle ?? null,
        isClaimed: false,
      },
      {
        tier: "gold",
        targetValue: params.targets[2],
        rewardPawPoints: params.points[2],
        rewardTitle: params.goldTitle ?? null,
        isClaimed: false,
      },
      {
        tier: "platinum",
        targetValue: params.targets[3],
        rewardPawPoints: params.points[3],
        rewardTitle: params.platTitle ?? null,
        isClaimed: false,
      },
    ],
  };
}

export const BASELINE_ACHIEVEMENT_TRACKS: BaselineAchievementTrackDoc[] = [
  makeTrack({
    id: "movement_steps",
    title: "Trail Paws",
    description: "Walk steps across your neighborhood and explore.",
    category: "movement",
    unit: "steps",
    targets: [1000, 10000, 50000, 250000],
    points: [25, 75, 200, 500],
    goldTitle: makeTitle(
      "title_wanderer",
      "Wanderer",
      "Logged over 50,000 neighborhood steps.",
      "rare",
      "gold"
    ),
    platTitle: makeTitle(
      "title_marathon_paws",
      "Marathon Paws",
      "A dedicated walker crossing 250,000 steps.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "movement_distance",
    title: "Distance Explorer",
    description: "Cover real-world ground during cat rescue walks.",
    category: "movement",
    unit: "km",
    targets: [1, 10, 50, 200],
    points: [25, 75, 200, 500],
    silverTitle: makeTitle(
      "title_trekker",
      "Trekker",
      "Traversed 10 km on foot.",
      "rare",
      "silver"
    ),
    platTitle: makeTitle(
      "title_pathfinder",
      "Pathfinder",
      "Journeyed over 200 km through island terrain.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "movement_calories",
    title: "Calorie Crusher",
    description: "Burn calories while pursuing street cat sightings.",
    category: "movement",
    unit: "kcal",
    targets: [100, 1000, 5000, 20000],
    points: [20, 60, 150, 400],
    goldTitle: makeTitle(
      "title_active_explorer",
      "Active Explorer",
      "Burned 5,000 active calories on cat patrols.",
      "rare",
      "gold"
    ),
  }),
  makeTrack({
    id: "movement_streak",
    title: "Dedicated Explorer",
    description: "Maintain continuous daily exploration streaks.",
    category: "movement",
    unit: "days",
    targets: [1, 3, 7, 30],
    points: [20, 50, 150, 600],
    platTitle: makeTitle(
      "title_relentless",
      "Relentless",
      "Maintained a 30-day continuous exploration streak.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "discovery_scans",
    title: "Feline Spotter",
    description: "Document and classify live community cats.",
    category: "discovery",
    unit: "cats",
    targets: [1, 10, 50, 200],
    points: [30, 80, 250, 750],
    silverTitle: makeTitle(
      "title_cat_spotter",
      "Cat Spotter",
      "Documented 10 individual neighborhood felines.",
      "rare",
      "silver"
    ),
    platTitle: makeTitle(
      "title_feline_chronicler",
      "Feline Chronicler",
      "Documented 200 felines across communities.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "discovery_accuracy",
    title: "Eagle Eye Classifier",
    description: "Achieve high-confidence AI vision classifications.",
    category: "discovery",
    unit: "scans",
    targets: [1, 5, 25, 100],
    points: [25, 75, 200, 500],
    goldTitle: makeTitle(
      "title_eagle_eye",
      "Eagle Eye",
      "Achieved 25 sharp high-confidence feline scans.",
      "epic",
      "gold"
    ),
  }),
  makeTrack({
    id: "discovery_puspin",
    title: "Puspin Guardian",
    description: "Document indigenous Philippine coat patterns.",
    category: "discovery",
    unit: "coats",
    targets: [1, 3, 5, 10],
    points: [30, 90, 250, 600],
    goldTitle: makeTitle(
      "title_puspin_champion",
      "Puspin Champion",
      "Preserved documentation of 5 Puspin coat types.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_puspin_guardian",
      "Puspin Guardian",
      "The ultimate guardian of native Philippine cats.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "discovery_rare",
    title: "Mythic Tracker",
    description: "Encounter and photograph uncommon or exotic breeds.",
    category: "discovery",
    unit: "breeds",
    targets: [1, 3, 5, 10],
    points: [50, 150, 350, 800],
    goldTitle: makeTitle(
      "title_mythic_tracker",
      "Mythic Tracker",
      "Discovered 5 rare or pedigree neighborhood cats.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_legendary_whisperer",
      "Legendary Whisperer",
      "Mastered encounters with the rarest island felines.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "discovery_quick_snap",
    title: "Quick Reflexes",
    description: "Capture roaming cats within 5 seconds of opening camera.",
    category: "discovery",
    unit: "snaps",
    targets: [1, 5, 20, 50],
    points: [25, 75, 200, 500],
    goldTitle: makeTitle(
      "title_snap_master",
      "Snap Master",
      "Reacted with lightning precision on 20 quick snaps.",
      "epic",
      "gold"
    ),
  }),
  makeTrack({
    id: "env_night",
    title: "Night Prowler",
    description: "Spot roaming felines under moonlight (9 PM – 4 AM).",
    category: "environment",
    unit: "snaps",
    targets: [1, 5, 20, 50],
    points: [30, 90, 250, 650],
    goldTitle: makeTitle(
      "title_night_prowler",
      "Night Prowler",
      "Mastered nocturnal feline encounters in the dark.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_shadow_walker",
      "Shadow Walker",
      "Completed 50 midnight cat explorations.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "env_golden_hour",
    title: "Golden Hour Seeker",
    description: "Capture glowing cat silhouettes during sunset twilight.",
    category: "environment",
    unit: "snaps",
    targets: [1, 5, 20, 50],
    points: [25, 75, 200, 500],
    goldTitle: makeTitle(
      "title_sun_chaser",
      "Sun Chaser",
      "Photographed 20 felines during golden hour light.",
      "rare",
      "gold"
    ),
  }),
  makeTrack({
    id: "env_dawn",
    title: "Dawn Patrol",
    description: "Encounter waking felines early in the morning (5 AM – 8 AM).",
    category: "environment",
    unit: "snaps",
    targets: [1, 5, 20, 50],
    points: [25, 75, 200, 500],
    goldTitle: makeTitle(
      "title_early_bird",
      "Early Bird",
      "Greeted 20 early morning street felines at sunrise.",
      "rare",
      "gold"
    ),
  }),
  makeTrack({
    id: "env_weatherproof",
    title: "All-Weather Explorer",
    description: "Conduct outdoor cat missions across diverse weather.",
    category: "environment",
    unit: "sessions",
    targets: [1, 5, 15, 30],
    points: [30, 80, 220, 550],
    platTitle: makeTitle(
      "title_stalwart",
      "Stalwart",
      "Weathered 30 intense outdoor exploration patrols.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "community_boops_given",
    title: "Neighborhood Booper",
    description: "Send community boop endorsements to neighbor cat sightings.",
    category: "community",
    unit: "boops",
    targets: [5, 25, 100, 500],
    points: [20, 60, 180, 500],
    silverTitle: makeTitle(
      "title_boop_enthusiast",
      "Boop Enthusiast",
      "Blessed 25 neighborhood sightings with gentle boops.",
      "common",
      "silver"
    ),
    platTitle: makeTitle(
      "title_friendly_hand",
      "Friendly Hand",
      "Shared 500 boops across the active explorer network.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "community_boops_received",
    title: "Local Celebrity",
    description: "Earn community boop reactions on your cat sightings.",
    category: "community",
    unit: "boops",
    targets: [5, 20, 50, 100],
    points: [30, 90, 240, 600],
    goldTitle: makeTitle(
      "title_local_celebrity",
      "Local Celebrity",
      "Your sightings received over 50 community boops.",
      "epic",
      "gold"
    ),
  }),
  makeTrack({
    id: "community_barangays",
    title: "Territory Scout",
    description: "Catalog cat discoveries across different barangays.",
    category: "community",
    unit: "barangays",
    targets: [1, 2, 5, 10],
    points: [30, 80, 250, 700],
    silverTitle: makeTitle(
      "title_barangay_scout",
      "Barangay Scout",
      "Explored feline routes across 2 distinct barangays.",
      "rare",
      "silver"
    ),
    platTitle: makeTitle(
      "title_island_rover",
      "Island Rover",
      "Mapped felines across 10 distinct island barangays.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "community_stories",
    title: "Community Chronicler",
    description: "Publish 24-hour visual stories from your cat walks.",
    category: "community",
    unit: "stories",
    targets: [1, 5, 20, 50],
    points: [25, 70, 200, 500],
    goldTitle: makeTitle(
      "title_chronicler",
      "Chronicler",
      "Broadcasted 20 stories of real-world feline encounters.",
      "epic",
      "gold"
    ),
  }),
  makeTrack({
    id: "dex_unique_breeds",
    title: "Dex Initiate",
    description: "Fill the Iring-Dex with distinct cataloged breeds.",
    category: "collection",
    unit: "breeds",
    targets: [2, 5, 10, 16],
    points: [30, 100, 300, 800],
    goldTitle: makeTitle(
      "title_zoologist",
      "Zoologist",
      "Cataloged 10 verified feline breeds in the Dex.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_dex_master",
      "Dex Master",
      "Completed cataloging of all 16 Dex feline entries.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "dex_gallery_pinned",
    title: "Album Curator",
    description: "Curate your private cat album with favorite snapshots.",
    category: "collection",
    unit: "photos",
    targets: [3, 9, 18, 36],
    points: [20, 60, 160, 450],
    silverTitle: makeTitle(
      "title_curator",
      "Curator",
      "Carefully curated 9 high-res cat portraits.",
      "rare",
      "silver"
    ),
  }),
  makeTrack({
    id: "dex_metallic",
    title: "Gilded Paws",
    description: "Capture felines eligible for Gold or Silver rarity tiers.",
    category: "collection",
    unit: "sightings",
    targets: [1, 3, 7, 15],
    points: [40, 120, 300, 750],
    goldTitle: makeTitle(
      "title_gilded_paws",
      "Gilded Paws",
      "Discovered 7 glittering metallic rarity felines.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_precious_finder",
      "Precious Finder",
      "Encountered 15 top-tier metallic rarity felines.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "dex_quirks_read",
    title: "Feline Scholar",
    description: "Read behavioural quirk profiles inside the Iring-Dex.",
    category: "collection",
    unit: "quirks",
    targets: [5, 15, 30, 50],
    points: [20, 50, 140, 400],
    goldTitle: makeTitle(
      "title_cat_scholar",
      "Cat Scholar",
      "Deeply studied 30 unique feline behavioural quirks.",
      "rare",
      "gold"
    ),
  }),
  makeTrack({
    id: "mastery_quests_claimed",
    title: "Bounty Hunter",
    description: "Complete daily and weekly Paw Quests.",
    category: "mastery",
    unit: "quests",
    targets: [3, 15, 40, 100],
    points: [30, 90, 260, 700],
    goldTitle: makeTitle(
      "title_bounty_hunter",
      "Bounty Hunter",
      "Fulfilled 40 challenging exploration quest contracts.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_quest_grandmaster",
      "Quest Grandmaster",
      "Achieved legendary status completing 100 Paw Quests.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "mastery_weekly_sets",
    title: "Weekly Champion",
    description: "Clear complete 7-day weekly mission sets.",
    category: "mastery",
    unit: "sets",
    targets: [1, 4, 12, 24],
    points: [50, 150, 400, 1000],
    platTitle: makeTitle(
      "title_unstoppable",
      "Unstoppable",
      "Dominated 24 full weekly mission rotation sets.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "mastery_paw_points",
    title: "Paw Point Tycoon",
    description: "Accumulate lifetime Paw Points from all activities.",
    category: "mastery",
    unit: "points",
    targets: [100, 500, 2500, 10000],
    points: [30, 100, 300, 900],
    goldTitle: makeTitle(
      "title_tycoon",
      "Tycoon",
      "Amassed 2,500 total Paw Points in explorer savings.",
      "rare",
      "gold"
    ),
    platTitle: makeTitle(
      "title_paw_millionaire",
      "Paw Millionaire",
      "Banked over 10,000 lifetime Paw Points.",
      "legendary",
      "platinum"
    ),
  }),
  makeTrack({
    id: "mastery_titles_unlocked",
    title: "The Renowned",
    description: "Unlock honorary Explorer Titles through dedicated play.",
    category: "mastery",
    unit: "titles",
    targets: [2, 5, 10, 20],
    points: [50, 150, 400, 1000],
    goldTitle: makeTitle(
      "title_the_renowned",
      "The Renowned",
      "Unlocked 10 prestigious explorer titles.",
      "epic",
      "gold"
    ),
    platTitle: makeTitle(
      "title_grand_champion",
      "Grand Champion",
      "Unlocked 20 explorer titles. The ultimate master.",
      "legendary",
      "platinum"
    ),
  }),
];

const DEFAULT_EVENT_BORDERS = [
  {
    id: "border_cherry_blossom",
    name: "Cherry Blossom",
    description:
      "Delicate spring petals and soft rose aura wrapping your explorer persona.",
    rarity: "rare",
    cost: 80,
    gradientColors: [0xfff472b6, 0xfffda4af],
    strokeWidth: 3.0,
    glowColorValue: 0x55f472b6,
    glowBlurRadius: 6.0,
    isActive: true,
  },
  {
    id: "border_golden_aureole",
    name: "Golden Aureole",
    description:
      "Radiant amber halo reflecting sun-warmed cat naps and champion territory conquests.",
    rarity: "legendary",
    cost: 220,
    gradientColors: [0xfff59e0b, 0xfffcd34d],
    strokeWidth: 3.5,
    glowColorValue: 0x77f59e0b,
    glowBlurRadius: 10.0,
    isActive: true,
  },
  {
    id: "border_mythic_dragon",
    name: "Mythic Ember",
    description:
      "Fiery marmalade flames and molten glow honoring apex stray protectors.",
    rarity: "mythic",
    cost: 380,
    gradientColors: [0xffdc2626, 0xfff97316],
    strokeWidth: 4.0,
    glowColorValue: 0x88dc2626,
    glowBlurRadius: 12.0,
    isActive: true,
  },
];

export function buildCalicoStarterEvents(now = new Date()) {
  const nowIso = now.toISOString();
  const festivalStart = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
  const festivalEnd = new Date(
    now.getTime() + 14 * 24 * 3600 * 1000
  ).toISOString();
  const careStart = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const careEnd = new Date(now.getTime() + 21 * 24 * 3600 * 1000).toISOString();

  return [
    {
      id: "event_calico_dusk_gala",
      title: "Calico Dusk Gala",
      subtitle: "Launch Celebration",
      description:
        "Stroll through your barangay at dusk and dawn to catalog native Puspin coats and earn Marmalade Tokens for exclusive profile borders.",
      eventType: "festival",
      multiplier: 2.0,
      priority: 10,
      startDate: festivalStart,
      endDate: festivalEnd,
      startsAt: festivalStart,
      endsAt: festivalEnd,
      isActive: true,
      isFeaturedInCarousel: true,
      showPopupOnLaunch: true,
      currencyName: "Marmalade Tokens",
      currencyCode: "MRM",
      bannerColorValue: 0xff231a16,
      accentColorValue: 0xffff8c1a,
      bannerImageUrl: "",
      logoImageUrl: "",
      bannerUrl: "",
      logoUrl: "",
      quests: [
        {
          id: "eq_golden_hour_spot",
          title: "Sunset Whisker Hunt",
          description:
              "Scan and register a cat sighting during afternoon twilight hours.",
          rewardCoins: 60,
          targetValue: 1,
          type: "golden_hour",
          targetBreed: null,
        },
        {
          id: "eq_festival_patrol",
          title: "Gala Evening Patrol",
          description:
              "Accumulate 3,000 explorer steps charting local feline paths.",
          rewardCoins: 80,
          targetValue: 3000,
          type: "steps",
          targetBreed: null,
        },
        {
          id: "eq_community_booper",
          title: "Friend of Strays",
          description:
              "Send 3 boops to community cat sightings on the live map.",
          rewardCoins: 50,
          targetValue: 3,
          type: "boops",
          targetBreed: null,
        },
      ],
      borders: DEFAULT_EVENT_BORDERS,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "event_island_sanctuary_drive",
      title: "Cebu Sanctuary Care Drive",
      subtitle: "Community Welfare Initiative",
      description:
        "Partnering with local volunteer feeders to map neighborhood colony cats and support spay, neuter, and feeding stations.",
      eventType: "partnership",
      partnerName: "Island Rescue Org (IRO)",
      multiplier: 1.5,
      priority: 8,
      startDate: careStart,
      endDate: careEnd,
      startsAt: careStart,
      endsAt: careEnd,
      isActive: true,
      isFeaturedInCarousel: true,
      showPopupOnLaunch: false,
      currencyName: "Rescue Stars",
      currencyCode: "STR",
      bannerColorValue: 0xff5c2d16,
      accentColorValue: 0xffffb04f,
      bannerImageUrl: "",
      logoImageUrl: "",
      bannerUrl: "",
      logoUrl: "",
      quests: [
        {
          id: "eq_sanctuary_feeding",
          title: "Colony Caretaker",
          description:
              "Document 2 cat sightings in your assigned home barangay.",
          rewardCoins: 75,
          targetValue: 2,
          type: "scans",
          targetBreed: null,
        },
        {
          id: "eq_sanctuary_steps",
          title: "Rescue Route March",
          description:
              "Cover 4,500 steps along community welfare patrol lines.",
          rewardCoins: 90,
          targetValue: 4500,
          type: "steps",
          targetBreed: null,
        },
      ],
      borders: DEFAULT_EVENT_BORDERS,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}
