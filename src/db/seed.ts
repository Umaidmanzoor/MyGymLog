import { db } from "./schema";
export const library: Record<string, string[]> = {
  Abs: [
    "Incline Bench Sit-Ups",
    "Hanging Leg Raises",
    "Dumbbell Side Bends",
    "Crunches",
    "Sit-Ups",
    "Cable Crunch",
    "Ab Wheel Rollout",
    "Plank",
    "Side Plank",
    "Russian Twist",
    "Reverse Crunch",
    "Bicycle Crunch",
    "Lying Leg Raise",
    "Mountain Climber",
    "Dead Bug",
    "Hollow Body Hold",
    "V-Up",
  ],
  Back: [
    "Deadlift",
    "Pull-Up",
    "Lat Pulldown",
    "Barbell Row",
    "Seated Cable Row",
    "One-Arm Dumbbell Row",
    "T-Bar Row",
    "Face Pull",
    "Straight-Arm Pulldown",
    "Chin-Up",
    "Chest-Supported Row",
    "Machine Row",
    "Inverted Row",
    "Back Extension",
    "Single-Arm Cable Row",
  ],
  Biceps: [
    "Barbell Curl",
    "Dumbbell Curl",
    "Hammer Curl",
    "Preacher Curl",
    "Incline Dumbbell Curl",
    "Cable Curl",
    "Concentration Curl",
    "EZ-Bar Curl",
    "Spider Curl",
    "Reverse Curl",
    "Cross-Body Hammer Curl",
    "Seated Dumbbell Curl",
    "Standing Alternating Curl",
    "High Cable Curl",
    "Machine Biceps Curl",
    "Drag Curl",
    "Zottman Curl",
    "Rope Hammer Curl",
    "Single-Arm Preacher Curl",
    "Bayesian Cable Curl",
  ],
  Calf: [
    "Standing Calf Raise",
    "Seated Calf Raise",
    "Leg Press Calf Raise",
    "Single-Leg Calf Raise",
    "Donkey Calf Raise",
    "Smith Machine Calf Raise",
    "Dumbbell Calf Raise",
    "Bent-Knee Calf Raise",
    "Tibialis Raise",
  ],
  Chest: [
    "Barbell Bench Press",
    "Incline Barbell Press",
    "Dumbbell Bench Press",
    "Incline Dumbbell Press",
    "Machine Chest Press",
    "Cable Fly",
    "Pec Deck",
    "Push-Up",
    "Dips (Chest)",
    "Decline Barbell Press",
    "Decline Dumbbell Press",
    "Dumbbell Fly",
    "Incline Dumbbell Fly",
    "Low Cable Fly",
    "High Cable Fly",
    "Smith Machine Bench Press",
    "Incline Machine Press",
    "Close-Grip Push-Up",
    "Wide Push-Up",
    "Incline Push-Up",
    "Decline Push-Up",
    "Dumbbell Pullover",
    "Single-Arm Cable Press",
  ],
  Forearms: [
    "Wrist Curl",
    "Reverse Wrist Curl",
    "Farmer Carry",
    "Wrist Roller",
  ],
  Legs: [
    "Back Squat",
    "Front Squat",
    "Leg Press",
    "Romanian Deadlift",
    "Leg Curl",
    "Leg Extension",
    "Walking Lunge",
    "Bulgarian Split Squat",
    "Goblet Squat",
    "Hack Squat",
    "Hip Thrust",
    "Glute Bridge",
    "Sumo Deadlift",
    "Step-Up",
    "Reverse Lunge",
    "Seated Leg Curl",
    "Single-Leg Romanian Deadlift",
    "Cable Kickback",
    "Hip Abduction",
    "Hip Adduction",
  ],
  Shoulders: [
    "Overhead Press",
    "Dumbbell Shoulder Press",
    "Lateral Raise",
    "Rear Delt Fly",
    "Front Raise",
    "Arnold Press",
    "Upright Row",
    "Shrugs",
    "Seated Barbell Press",
    "Machine Shoulder Press",
    "Cable Lateral Raise",
    "Cable Front Raise",
    "Reverse Pec Deck",
    "Bent-Over Lateral Raise",
    "Landmine Press",
    "Single-Arm Dumbbell Press",
    "Smith Machine Shoulder Press",
    "Plate Front Raise",
    "Cable Rear Delt Fly",
    "Dumbbell Scaption",
    "Lean-Away Lateral Raise",
    "Y Raise",
    "Pike Push-Up",
  ],
  Triceps: [
    "Triceps Pushdown",
    "Skull Crusher",
    "Overhead Triceps Extension",
    "Close-Grip Bench Press",
    "Dips (Triceps)",
    "Kickback",
    "Rope Pushdown",
    "Single-Arm Pushdown",
    "Reverse-Grip Pushdown",
    "Dumbbell Overhead Extension",
    "Cable Overhead Extension",
    "Lying Dumbbell Extension",
    "Bench Dip",
    "Diamond Push-Up",
    "Machine Triceps Extension",
    "Cross-Body Cable Extension",
    "Tate Press",
    "Single-Arm Overhead Extension",
  ],
};
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
function equipment(
  name: string,
): "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "other" {
  if (
    /Dumbbell|Hammer|Concentration|Arnold|Zottman|Goblet|Tate|Scaption/.test(
      name,
    )
  )
    return "dumbbell";
  if (/Cable|Rope|Pushdown|Pulldown|Bayesian/.test(name)) return "cable";
  if (
    /Machine|Pec Deck|Leg Press|Leg Curl|Leg Extension|Hack|Hip Ab/.test(name)
  )
    return "machine";
  if (
    /Barbell|EZ-Bar|Deadlift|Back Squat|Front Squat|Overhead Press|Skull|Upright|T-Bar|Close-Grip Bench/.test(
      name,
    )
  )
    return "barbell";
  if (
    /Push-Up|Pull-Up|Chin-Up|Plank|Crunch|Sit-Up|Leg Raise|Dip|Dead Bug|Hollow|V-Up|Bridge|Climber|Inverted/.test(
      name,
    )
  )
    return "bodyweight";
  return "other";
}
function cues(name: string, group: string) {
  if (/Plank|Hollow/.test(name))
    return "Brace your abdomen and keep ribs stacked over your pelvis. Breathe steadily; end the hold when your position changes. Log hold duration in reps as seconds.";
  if (/Curl/.test(name) && group !== "Legs")
    return "Keep your upper arms still and wrists neutral. Curl through a comfortable range without swinging, then lower slowly.";
  if (/Press|Push-Up/.test(name))
    return "Keep wrists stacked over elbows and your torso braced. Lower with control through a comfortable range, then press smoothly without bouncing.";
  if (/Squat|Lunge|Step-Up/.test(name))
    return "Brace your torso and keep your whole foot planted. Let knees track with toes, lower under control, then drive through your feet.";
  if (/Deadlift|Hip Thrust|Glute Bridge/.test(name))
    return "Brace before each rep. Move through your hips with a neutral spine; finish by standing tall without leaning back.";
  if (/Row|Pulldown|Pull-Up|Chin-Up/.test(name))
    return "Keep your torso stable and shoulders away from ears. Drive elbows toward your ribs, pause briefly, and return with control.";
  if (group === "Abs")
    return "Keep your neck relaxed and ribs down. Move with your abdomen rather than momentum, exhaling through the effort.";
  if (group === "Calf")
    return "Keep pressure through the ball of the foot. Rise without bouncing, pause at the top, then lower through a comfortable range.";
  if (group === "Triceps")
    return "Keep elbows stable and shoulders relaxed. Extend your elbows smoothly, then control the return without swinging.";
  if (group === "Shoulders")
    return "Keep a soft bend in the elbows and avoid shrugging. Raise through a comfortable range with a stable torso and lower slowly.";
  return "Set up in a stable position and brace your torso. Use a comfortable range of motion and a controlled return; stop if you feel pain.";
}
export async function seed() {
  await db.transaction("rw", db.groups, db.exercises, db.settings, async () => {
    if (await db.settings.get("seeded")) return;
    const groups = Object.keys(library);
    await db.groups.bulkPut(
      groups.map((name, order) => ({
        id: slug(name),
        name,
        icon: slug(name),
        order,
      })),
    );
    await db.exercises.bulkPut(
      groups.flatMap((group) =>
        library[group].map((name) => ({
          id: slug(name),
          groupId: slug(group),
          name,
          equipment: equipment(name),
          isCustom: false,
          notes: cues(name, group),
        })),
      ),
    );
    await db.settings.bulkPut([
      { key: "seeded", value: true },
      { key: "theme", value: "light" },
      { key: "firstUsed", value: Date.now() },
    ]);
  });
}
