// src/world/config.mjs — Live-editable Biome, Zone, Matter & Body parameters (zero silent clamping!)
// All values can be tuned or intentionally pushed to extremes by the Owner ("conscious breaking" rule).

export const DEFAULT_CONFIG = Object.freeze({
  // Spacious living biome (3200 x 2200) — smooth radial + organic zone gradient
  width: 3200,
  height: 2200,

  // Spatial Risk -> Reward Gradient (NO frantic global catastrophe!)
  // Sanctuary center at (0.5*W, 0.5*H), smooth transitions outward:
  //   0..sanctuaryRadius -> Sanctuary (100% peaceful, warm recovery, basic gentle food)
  //   sanctuaryRadius..twilightRadius -> Twilight Gardens (rock corridors, geodes, rich food, mild local drafts)
  //   > twilightRadius -> Wild Deep (high-value Living Cores + local anomalies/currents/hazards)
  sanctuaryRadius: 460,
  twilightRadius: 960,
  wildsStressRate: 0.0022,      // gentle ambient exposure stress in exposed Wild Deep (0 in Sanctuary!)
  wildsDamageRate: 0.0014,      // gradual integrity drain ONLY when exposed in Wild anomalies/currents
  sanctuaryRegenRate: 0.0022,   // soothing integrity recovery inside Sanctuary
  shelterRegenRate: 0.0018,     // recovery in boulder lee shadows or calm caves
  anomalyStrength: 0.28,        // local flow/pulse force inside Wild anomaly pockets (0 = totally calm world)
  anomalyDamage: 0.0028,        // integrity drain inside active Wild anomaly core when unshielded

  // Ecology counts & renewal (scaled organically to the spacious 3200x2200 biome!)
  numRockFormations: 16,
  numLocalAnomalies: 6,         // placed ONLY in the outer Wild Deep!
  numBoulders: 24,
  numGeodes: 32,                // fragile crumble geodes (mostly Twilight + Wilds)
  numHazards: 36,               // burning minerals (ONLY Twilight outer edge & Wilds — NEVER in Sanctuary!)
  initialSanctuaryFood: 18,
  initialTwilightFood: 26,
  initialWildCores: 28,         // high-reward Living Cores in Wild Deep!
  maxConsumables: 112,
  foodRespawnEvery: 28,
  geodeRespawnEvery: 170,

  // Gentle vs intentional collision physics (touching/rubbing NEVER hurts!)
  baseDrag: 0.16,
  gentleTouchThreshold: 3.4,    // normal swimming & rubbing NEVER causes damage!
  intentionalImpactDmg: 0.09,   // damage ONLY when dashing/ramming hard above threshold
  baseEnergyBurn: 0.00024,
  thrustEnergyBurn: 0.00032,
  staminaDrain: 0.0065,
  staminaRegen: 0.0055,

  // Reproduction / Lineage (optional — triggered by high vitality surplus from rich resources)
  allowReproduction: true,
  reproEnergyThreshold: 0.94,
  reproCooldownTicks: 1600,
  maxPopulation: 18,
  mutationScale: 0.14,

  // Retina & Touch (strictly private, 300px horizon on a 3200x2200 biome -> real beyond-horizon navigation!)
  retinaRays: 36,
  retinaFov: (195 * Math.PI) / 180,
  retinaRange: 300,
  maxGazeOffset: 1.05,
  gazeTurnRate: 0.11,
  touchSectors: 8,
});

// 5 well-separated, tasteful natural hues (randomly permuted across core material archetypes per seed!)
// Designed around Jozz's "Fundament / Głębia" aesthetic — rich organic pigments, NOT cheap 2005 neon.
// Separated cleanly in distance-invariant opponent-color chroma space (R-G, B-Y).
export const MATTER_PALETTE = Object.freeze([
  Object.freeze({ name: 'mięta', rgb: Object.freeze([0.18, 0.80, 0.56]) }),      // organic emerald-sage
  Object.freeze({ name: 'bursztyn', rgb: Object.freeze([0.92, 0.64, 0.18]) }),   // warm amber-ochre
  Object.freeze({ name: 'koral', rgb: Object.freeze([0.88, 0.24, 0.30]) }),      // deep coral-terracotta
  Object.freeze({ name: 'ametyst', rgb: Object.freeze([0.66, 0.28, 0.86]) }),    // muted amethyst-plum
  Object.freeze({ name: 'błękit', rgb: Object.freeze([0.20, 0.64, 0.90]) }),     // deep mineral cerulean
]);

export const CORE_ARCHETYPES = Object.freeze([
  'sanctuaryBerry', // gentle basic food (Sanctuary + Twilight)
  'wildCore',       // high-reward Living Core (Wild Deep & cracked geodes!)
  'geode',          // fragile breakable shell -> bursts into high-energy shards on hard impact
  'boulder',        // heavy movable shelter stone (blocks local Wild currents & sight)
  'emberMineral',   // burning/painful hazard mineral (Twilight edge & Wilds only)
]);

// Structural & zone atmosphere hues (smooth spatial sky/ground tint on open horizon rays)
export const ZONE_SKY_SANCTUARY = Object.freeze([0.07, 0.12, 0.14]); // warm serene slate-teal
export const ZONE_SKY_TWILIGHT = Object.freeze([0.07, 0.09, 0.14]);  // deep dusk indigo
export const ZONE_SKY_WILDS = Object.freeze([0.14, 0.08, 0.11]);     // subtle brooding plum-umber
export const COLOR_ROCK = Object.freeze([0.22, 0.25, 0.30]);         // dark natural basalt formations

// Distinct creature & Player body hues (separated from all 5 materials & rock in opponent-color chroma + luminance!)
export const COLOR_SCOUT = Object.freeze([0.92, 0.89, 0.82]);        // warm ivory-pearl agile body
export const COLOR_RAM = Object.freeze([0.34, 0.42, 0.84]);          // deep cobalt-indigo heavy shell
export const COLOR_PLAYER = Object.freeze([0.64, 0.90, 0.24]);       // living olive-moss resident

export const BODY_MORPHS = Object.freeze({
  scout: Object.freeze({
    kind: 'scout',
    radius: 12,
    mass: 1.0,
    maxThrust: 0.36,
    turnRate: 0.115,
    gripRange: 26,
    gripStiffness: 0.15,
    energyBurnMult: 0.82,
    ramBonus: 0.62,
    rgb: COLOR_SCOUT,
  }),
  ram: Object.freeze({
    kind: 'ram',
    radius: 16.5,
    mass: 2.4,
    maxThrust: 0.37,
    turnRate: 0.085,
    gripRange: 30,
    gripStiffness: 0.28,
    energyBurnMult: 1.05,
    ramBonus: 2.1,
    rgb: COLOR_RAM,
  }),
  // Player shares the EXACT SAME living stats & physics (with optional godMode toggle in UI!)
  player: Object.freeze({
    kind: 'player',
    radius: 14.5,
    mass: 1.85, // gentle enough not to bully small scouts on casual contact!
    maxSpeed: 3.25,
    dashSpeed: 6.4,
    dashDuration: 14,
    dashCooldown: 30,
    gripRange: 64,
    energyBurnMult: 0.75,
    ramBonus: 2.25,
    rgb: COLOR_PLAYER,
  }),
});

export function createMaterialProps(archetype, rgb) {
  if (archetype === 'sanctuaryBerry') {
    return {
      archetype,
      rgb: [...rgb],
      radius: 7.5,
      mass: 0.45,
      movable: true,
      edible: true,
      energyGain: 0.16,
      integrityGain: 0.02,
      burnDamage: 0,
      burnKnockback: 0,
      breakable: false,
      hp: 1,
      breakImpulseMin: 99,
      burstCount: 0,
      shelterStrength: 0,
      valueTier: 1,
    };
  }
  if (archetype === 'wildCore') {
    return {
      archetype,
      rgb: [...rgb],
      radius: 10,
      mass: 0.75,
      movable: true,
      edible: true,
      energyGain: 0.46,
      integrityGain: 0.10,
      burnDamage: 0,
      burnKnockback: 0,
      breakable: false,
      hp: 1,
      breakImpulseMin: 99,
      burstCount: 0,
      shelterStrength: 0,
      valueTier: 3,
    };
  }
  if (archetype === 'geode') {
    return {
      archetype,
      rgb: [...rgb],
      radius: 20,
      mass: 1.65,
      movable: true,
      edible: false,
      energyGain: 0,
      integrityGain: 0,
      burnDamage: 0,
      burnKnockback: 0,
      breakable: true,
      hp: 1.0,
      breakImpulseMin: 1.15,
      burstCount: 3,
      shelterStrength: 0.25,
      valueTier: 2,
    };
  }
  if (archetype === 'boulder') {
    return {
      archetype,
      rgb: [...rgb],
      radius: 34,
      mass: 4.5,
      movable: true,
      edible: false,
      energyGain: 0,
      integrityGain: 0,
      burnDamage: 0,
      burnKnockback: 0,
      breakable: false,
      hp: 99,
      breakImpulseMin: 99,
      burstCount: 0,
      shelterStrength: 0.92,
      valueTier: 0,
    };
  }
  // emberMineral
  return {
    archetype: 'emberMineral',
    rgb: [...rgb],
    radius: 16,
    mass: 3.0,
    movable: false,
    edible: false,
    energyGain: 0,
    integrityGain: 0,
    burnDamage: 0.13,
    burnKnockback: 2.7,
    breakable: false,
    hp: 99,
    breakImpulseMin: 99,
    burstCount: 0,
    shelterStrength: 0,
    valueTier: -2,
  };
}
