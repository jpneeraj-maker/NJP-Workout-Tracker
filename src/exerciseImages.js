import ezbarSkullcrushers from "./Assets/images/arms/ezbar_skullcrushers.png";
import farmersCarry from "./Assets/images/arms/farmers_carry.png";
import hammerCurl from "./Assets/images/arms/hammer_curl.png";
import inclineBicepCurl from "./Assets/images/arms/incline_bicep_curl.png";

import barbellRows from "./Assets/images/back/barbell_rows.png";
import dumbbellPullovers from "./Assets/images/back/Dumbbell_Pullover_Exercise.png";
import singleArmDumbbellRow from "./Assets/images/back/single_arm_dumbbell_row.png";

import dumbbellFlatBenchPress from "./Assets/images/chest/dumbbell_flat_bench_press.png";
import flatBenchPress from "./Assets/images/chest/flat_bench_press.png";
import inclineDumbbellChestPress from "./Assets/images/chest/incline_dumbbell_chest_press.png";

import abRollout from "./Assets/images/core/ab_rollout.png";
import legRaises from "./Assets/images/core/leg_raises.png";
import rkcPlank from "./Assets/images/core/rkc_plank.png";

import bandHamstringCurl from "./Assets/images/legs/band_hamstring_curl.png";
import barbellRdls from "./Assets/images/legs/barbell_rdls.png";
import bulgarianSplitSquats from "./Assets/images/legs/bulgarian_split_squats.png";
import calfRaises from "./Assets/images/legs/calf_raises.png";
import hipThrust from "./Assets/images/legs/hip_thrust.png";
import squats from "./Assets/images/legs/squats.png";

import lateralRaises from "./Assets/images/shoulders/lateral_raises.png";
import rearDeltFly from "./Assets/images/shoulders/rear_delt_fly.png";
import shoulderPress from "./Assets/images/shoulders/shoulder_press.png";
import uprightRows from "./Assets/images/shoulders/upright_rows.png";

import bandShoulderDislocates from "./Assets/images/stretching and mobility/band_shoulder_dislocates.png";
import deepSquatHold from "./Assets/images/stretching and mobility/deep_sqaut_hold.png";
import foamRolling from "./Assets/images/stretching and mobility/foam_rolling.png";
import stretching from "./Assets/images/stretching and mobility/stretching.png";
import worldsGreatestStretch from "./Assets/images/stretching and mobility/worlds_greatest_stretch.png";

/** Equipment modality inferred from an exercise / map key name. */
const EQUIPMENT_PATTERNS = [
  { id: "band", test: /\bband\b/i },
  { id: "dumbbell", test: /\b(dumbbells?|dbs?)\b/i },
  { id: "barbell", test: /\b(barbell|bb|ez\s?bars?|ezbar)\b/i },
  { id: "cable", test: /\bcable\b/i },
];

/**
 * Equipment tag for each bundled asset (from the demo shown).
 * Empty set = generic / bodyweight / mixed — usable by any non-band-specific name.
 */
const IMAGE_EQUIPMENT = new Map([
  [bandHamstringCurl, new Set(["band"])],
  [bandShoulderDislocates, new Set(["band"])],
  [dumbbellFlatBenchPress, new Set(["dumbbell"])],
  [inclineDumbbellChestPress, new Set(["dumbbell"])],
  [dumbbellPullovers, new Set(["dumbbell"])],
  [singleArmDumbbellRow, new Set(["dumbbell"])],
  [hammerCurl, new Set(["dumbbell"])],
  [inclineBicepCurl, new Set(["dumbbell"])],
  [lateralRaises, new Set(["dumbbell"])],
  [rearDeltFly, new Set(["dumbbell"])],
  [shoulderPress, new Set(["dumbbell"])],
  [uprightRows, new Set(["dumbbell"])],
  [farmersCarry, new Set(["dumbbell"])],
  [flatBenchPress, new Set(["barbell"])],
  [barbellRows, new Set(["barbell"])],
  [barbellRdls, new Set(["barbell"])],
  [ezbarSkullcrushers, new Set(["barbell"])],
  [hipThrust, new Set(["barbell"])],
  [squats, new Set(["barbell"])],
  [bulgarianSplitSquats, new Set(["dumbbell"])],
  [calfRaises, new Set()],
  [abRollout, new Set(["bodyweight"])],
  [legRaises, new Set(["bodyweight"])],
  [rkcPlank, new Set(["bodyweight"])],
  [deepSquatHold, new Set(["bodyweight"])],
  [foamRolling, new Set(["bodyweight"])],
  [stretching, new Set(["bodyweight"])],
  [worldsGreatestStretch, new Set(["bodyweight"])],
]);

const EXERCISE_IMAGES_BY_NAME = {
  // Chest
  "dumbbell flat bench press": dumbbellFlatBenchPress,
  "flat db bench press": dumbbellFlatBenchPress,
  "db flat bench press": dumbbellFlatBenchPress,
  "db bench press": dumbbellFlatBenchPress,
  "flat bench press": flatBenchPress,
  "bench press": flatBenchPress,
  "barbell bench press": flatBenchPress,
  "barbell flat bench press": flatBenchPress,
  "incline dumbbell chest press": inclineDumbbellChestPress,
  "incline db bench press": inclineDumbbellChestPress,
  "incline db bench press (30 deg)": inclineDumbbellChestPress,
  "db incline press": inclineDumbbellChestPress,
  "db incline bench press": inclineDumbbellChestPress,
  "incline dumbbell press": inclineDumbbellChestPress,
  "incline dumbbell bench press": inclineDumbbellChestPress,
  "decline bench press": flatBenchPress,
  "decline db bench press": dumbbellFlatBenchPress,
  "flat dumbbell fly": dumbbellFlatBenchPress,
  "flat db fly": dumbbellFlatBenchPress,
  "dumbbell fly": dumbbellFlatBenchPress,
  "db fly": dumbbellFlatBenchPress,

  // Back
  "barbell rows": barbellRows,
  "barbell row": barbellRows,
  "bent over rows": barbellRows,
  "bent over row": barbellRows,
  "dumbbell pullovers": dumbbellPullovers,
  "dumbbell pullover": dumbbellPullovers,
  "db pullover": dumbbellPullovers,
  "single arm dumbbell row": singleArmDumbbellRow,
  "one arm db row": singleArmDumbbellRow,
  "one-arm db row": singleArmDumbbellRow,
  "one arm dumbbell row": singleArmDumbbellRow,
  "db row": singleArmDumbbellRow,
  "chest supported db rows": singleArmDumbbellRow,
  "chest supported db row": singleArmDumbbellRow,
  "face pull": rearDeltFly,
  "face pulls": rearDeltFly,
  "cable face pull": rearDeltFly,

  // Shoulders
  "lateral raises": lateralRaises,
  "lateral raise": lateralRaises,
  "db lateral raise": lateralRaises,
  "db lateral raises": lateralRaises,
  "rear delt fly": rearDeltFly,
  "rear delt flies": rearDeltFly,
  "db rear delt fly": rearDeltFly,
  "shoulder press": shoulderPress,
  "db shoulder press": shoulderPress,
  "seated db overhead press": shoulderPress,
  "overhead press": shoulderPress,
  "upright rows": uprightRows,
  "upright row": uprightRows,
  "upright high pull": uprightRows,
  "db upright y raise": uprightRows,
  "shoulder shrugs": uprightRows,
  "shrugs": uprightRows,
  "db shrugs": uprightRows,

  // Arms
  "ezbar skullcrushers": ezbarSkullcrushers,
  "ez skull crushers": ezbarSkullcrushers,
  "ez skullcrushers": ezbarSkullcrushers,
  "skull crushers": ezbarSkullcrushers,
  "skullcrushers": ezbarSkullcrushers,
  "db overhead extension": ezbarSkullcrushers,
  "overhead extension": ezbarSkullcrushers,
  "triceps pushdown": ezbarSkullcrushers,
  "x3 triceps pushdown": ezbarSkullcrushers,
  "triceps extension": ezbarSkullcrushers,
  "farmers carry": farmersCarry,
  "farmer carry": farmersCarry,
  "farmers carries": farmersCarry,
  "farmer carries": farmersCarry,
  "hammer curl": hammerCurl,
  "hammer curls": hammerCurl,
  "db hammer curl": hammerCurl,
  "db hammer curls": hammerCurl,
  "incline bicep curl": inclineBicepCurl,
  "incline biceps curl": inclineBicepCurl,
  "incline db curl": inclineBicepCurl,
  "db curl": inclineBicepCurl,
  "barbell curl": inclineBicepCurl,
  "x3 biceps curl": inclineBicepCurl,
  "bench preacher curl": inclineBicepCurl,
  "db wrist curl (palms up)": inclineBicepCurl,
  "db wrist curl (palms down)": hammerCurl,
  "wrist curl": inclineBicepCurl,
  "wrist curls": inclineBicepCurl,

  // Legs
  "band hamstring curl": bandHamstringCurl,
  "hamstring curl": bandHamstringCurl,
  "barbell rdls": barbellRdls,
  "barbell rdl": barbellRdls,
  "db rdl": barbellRdls,
  "rdl": barbellRdls,
  "romanian deadlift": barbellRdls,
  "deadlift": barbellRdls,
  "conventional deadlift": barbellRdls,
  "barbell deadlift": barbellRdls,
  "bulgarian split squats": bulgarianSplitSquats,
  "bulgarian split squat": bulgarianSplitSquats,
  "calf raises": calfRaises,
  "calf raise": calfRaises,
  "standing calf raises": calfRaises,
  "single leg calf raise": calfRaises,
  "hip thrust": hipThrust,
  "hip thrusts": hipThrust,
  "db hip thrust": hipThrust,
  "barbell hip thrust": hipThrust,
  "squats": squats,
  "squat": squats,
  "walking lunges": bulgarianSplitSquats,

  // Core
  "ab rollout": abRollout,
  "ab rollouts": abRollout,
  "leg raises": legRaises,
  "leg raise": legRaises,
  "leg raises amrap": legRaises,
  "rkc plank": rkcPlank,
  "plank": rkcPlank,
  "plank amrap": rkcPlank,
  "anti rotation hold": rkcPlank,
  "anti-rotation hold": rkcPlank,
  "pallof press": rkcPlank,

  // Stretching / mobility
  "band shoulder dislocates": bandShoulderDislocates,
  "shoulder dislocates": bandShoulderDislocates,
  "deep squat hold": deepSquatHold,
  "deep sqaut hold": deepSquatHold,
  "foam rolling": foamRolling,
  "foam roll": foamRolling,
  "stretching": stretching,
  "mobility": stretching,
  "mobility & stretching": stretching,
  "worlds greatest stretch": worldsGreatestStretch,
  "world's greatest stretch": worldsGreatestStretch,
};

const KEYWORD_IMAGE_RULES = [
  { test: /incline.*(bench|press)|db incline/i, image: inclineDumbbellChestPress },
  { test: /(flat )?db (flat )?bench|dumbbell flat bench|db bench press/i, image: dumbbellFlatBenchPress },
  { test: /bench press/i, image: flatBenchPress },
  { test: /pullover/i, image: dumbbellPullovers },
  { test: /(one.?arm|single arm|chest supported).*row|db row/i, image: singleArmDumbbellRow },
  { test: /barbell row|bent over row/i, image: barbellRows },
  { test: /lateral raise/i, image: lateralRaises },
  { test: /rear delt/i, image: rearDeltFly },
  { test: /shoulder press|overhead press/i, image: shoulderPress },
  { test: /upright (row|high pull|y raise)/i, image: uprightRows },
  { test: /skull\s?crush|overhead extension|triceps (pushdown|extension)/i, image: ezbarSkullcrushers },
  { test: /farmer/i, image: farmersCarry },
  { test: /band.*hamstring curl|hamstring curl.*band/i, image: bandHamstringCurl },
  { test: /hammer curl/i, image: hammerCurl },
  { test: /wrist curl/i, image: inclineBicepCurl },
  { test: /curl/i, image: inclineBicepCurl },
  { test: /bulgarian|split squat|lunge/i, image: bulgarianSplitSquats },
  { test: /rdl|romanian|deadlift/i, image: barbellRdls },
  { test: /hip thrust/i, image: hipThrust },
  { test: /calf/i, image: calfRaises },
  { test: /squat/i, image: squats },
  { test: /leg raise/i, image: legRaises },
  { test: /plank|anti.?rotation|pallof/i, image: rkcPlank },
  { test: /rollout|ab roll/i, image: abRollout },
  { test: /face pull/i, image: rearDeltFly },
  { test: /shrug/i, image: uprightRows },
  { test: /fly|flies/i, image: dumbbellFlatBenchPress },
  { test: /band.*dislocate|dislocate.*band/i, image: bandShoulderDislocates },
  { test: /foam roll/i, image: foamRolling },
  { test: /world.?s greatest|greatest stretch/i, image: worldsGreatestStretch },
  { test: /stretch|mobility|foam/i, image: stretching },
];

export function normalizeExerciseName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getEquipmentModalities(name) {
  const key = normalizeExerciseName(name);
  const mods = new Set();
  if (!key) return mods;
  for (const pattern of EQUIPMENT_PATTERNS) {
    if (pattern.test.test(key)) mods.add(pattern.id);
  }
  return mods;
}

/** Infer equipment context from a routine title (Band, No Equipment, etc.). */
export function getRoutineEquipmentModalities(routineName) {
  const key = normalizeExerciseName(routineName);
  const mods = new Set();
  if (!key) return mods;

  if (
    /\b(no\s*equip(?:ment)?|without\s*equip(?:ment)?|body\s*weight|bodyweight|calisthenics)\b/.test(
      key
    ) ||
    /\bbw\b/.test(key)
  ) {
    mods.add("bodyweight");
  }

  for (const pattern of EQUIPMENT_PATTERNS) {
    if (pattern.test.test(key)) mods.add(pattern.id);
  }

  return mods;
}

/**
 * Routine context fills in when the exercise name has no load equipment token.
 * Explicit exercise tokens (band / db / barbell / cable) win.
 */
export function mergeEquipmentModalities(exerciseMods, routineMods) {
  const merged = new Set(exerciseMods || []);
  const exerciseHasLoad = ["band", "dumbbell", "barbell", "cable"].some((m) =>
    merged.has(m)
  );
  if (exerciseHasLoad) return merged;

  for (const mod of routineMods || []) {
    merged.add(mod);
  }
  return merged;
}

function getImageEquipment(image) {
  return IMAGE_EQUIPMENT.get(image) || new Set();
}

/**
 * Band is exclusive: band context only gets band images.
 * Bodyweight / no-equipment only gets bodyweight or untagged assets.
 * Dumbbell / barbell names reject the opposite exclusive asset.
 */
export function isEquipmentCompatible(exerciseNameOrMods, image) {
  const exerciseMods =
    exerciseNameOrMods instanceof Set
      ? exerciseNameOrMods
      : getEquipmentModalities(exerciseNameOrMods);
  const imageMods = getImageEquipment(image);

  if (exerciseMods.has("band")) {
    return imageMods.has("band");
  }

  if (exerciseMods.has("bodyweight")) {
    if (imageMods.has("band") || imageMods.has("dumbbell") || imageMods.has("barbell")) {
      return false;
    }
    return imageMods.size === 0 || imageMods.has("bodyweight");
  }

  if (exerciseMods.has("dumbbell") && imageMods.has("barbell") && !imageMods.has("dumbbell")) {
    return false;
  }
  if (exerciseMods.has("barbell") && imageMods.has("dumbbell") && !imageMods.has("barbell")) {
    return false;
  }

  return true;
}

/** Unique display names for bundled default images (deduped by image asset). */
export function getBundledExerciseNames() {
  const seen = new Set();
  const names = [];
  for (const [name, image] of Object.entries(EXERCISE_IMAGES_BY_NAME)) {
    if (seen.has(image)) continue;
    seen.add(image);
    names.push(name);
  }
  return names;
}

export function getExerciseImage(exercise, options = {}) {
  if (exercise?.image) return exercise.image;

  const key = normalizeExerciseName(exercise?.name);
  if (!key) return null;

  const mods = mergeEquipmentModalities(
    getEquipmentModalities(key),
    getRoutineEquipmentModalities(options.routineName)
  );

  if (EXERCISE_IMAGES_BY_NAME[key]) {
    const image = EXERCISE_IMAGES_BY_NAME[key];
    if (isEquipmentCompatible(mods, image)) {
      return image;
    }
  }

  for (const rule of KEYWORD_IMAGE_RULES) {
    if (!rule.test.test(key)) continue;
    if (!isEquipmentCompatible(mods, rule.image)) continue;
    return rule.image;
  }

  return null;
}
