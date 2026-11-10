import ezbarSkullcrushers from "./Assets/images/arms/ezbar_skullcrushers.png";
import farmersCarry from "./Assets/images/arms/farmers_carry.png";
import hammerCurl from "./Assets/images/arms/hammer_curl.png";
import inclineBicepCurl from "./Assets/images/arms/incline_bicep_curl.png";

import barbellRows from "./Assets/images/back/barbell_rows.png";
import dumbbellPullovers from "./Assets/images/back/dumbbell_pullovers.png";
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
  "decline db bench press": flatBenchPress,
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
  "x3 band squat": squats,
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
  { test: /hamstring curl/i, image: bandHamstringCurl },
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
  { test: /dislocate/i, image: bandShoulderDislocates },
  { test: /foam roll/i, image: foamRolling },
  { test: /world.?s greatest|greatest stretch/i, image: worldsGreatestStretch },
  { test: /stretch|mobility|foam/i, image: stretching },
];

function normalizeExerciseName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getExerciseImage(exercise) {
  if (exercise?.image) return exercise.image;

  const key = normalizeExerciseName(exercise?.name);
  if (!key) return null;

  if (EXERCISE_IMAGES_BY_NAME[key]) {
    return EXERCISE_IMAGES_BY_NAME[key];
  }

  for (const rule of KEYWORD_IMAGE_RULES) {
    if (rule.test.test(key)) return rule.image;
  }

  return null;
}
