export function createEmptySet() {
  return {
    id: crypto.randomUUID(),

    type: "Working Set",

    plannedWeight: "",
    targetReps: "",

    actualWeight: "",
    actualReps: ""
  };
}

export function createExercise(name = "New Exercise") {
  return {
    id: crypto.randomUUID(),

    name,

    remarks: "",

    sets: [createEmptySet()]
  };
}

export function createWorkoutEntry({
  date,
  routineName = "",
  workoutType = "",
  duration = ""
}) {
  return {
    id: crypto.randomUUID(),

    saveKey: date,
    date,

    type: "workout",

    routineName,
    workoutType,

    duration,

    createdAt: Date.now(),

    exercises: []
  };
}

export function createRestEntry(date) {
  return {
    id: crypto.randomUUID(),

    saveKey: date,
    date,

    type: "rest",

    createdAt: Date.now(),
  };
}