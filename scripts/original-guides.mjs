// Original code-native vector poses. These are simplified form guides, not filmed motion.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const standing = {
  head: [240, 65],
  neck: [240, 96],
  hips: [240, 210],
  leftArm: [
    [224, 111],
    [208, 160],
    [207, 205],
  ],
  rightArm: [
    [256, 111],
    [274, 160],
    [275, 205],
  ],
  leftLeg: [
    [230, 210],
    [214, 265],
    [209, 322],
  ],
  rightLeg: [
    [250, 210],
    [266, 265],
    [271, 322],
  ],
};
const guides = {
  "hollow-body-hold": {
    name: "Hollow Body Hold",
    muscles: ["abdominals"],
    steps: [
      "Lie on your back and press your lower back into the floor. Lift your shoulders and legs slightly, keeping your ribs down.",
      "Hold the shape while breathing steadily. Bend your knees or raise your legs if your lower back lifts. Log the hold in seconds.",
    ],
    poses: [
      {
        head: [130, 225],
        neck: [158, 240],
        hips: [245, 280],
        leftArm: [
          [165, 244],
          [127, 205],
          [92, 171],
        ],
        rightArm: [
          [172, 250],
          [134, 213],
          [101, 178],
        ],
        leftLeg: [
          [245, 280],
          [309, 264],
          [377, 239],
        ],
        rightLeg: [
          [250, 283],
          [316, 270],
          [385, 248],
        ],
      },
      {
        head: [130, 225],
        neck: [158, 240],
        hips: [245, 280],
        leftArm: [
          [165, 244],
          [127, 205],
          [92, 171],
        ],
        rightArm: [
          [172, 250],
          [134, 213],
          [101, 178],
        ],
        leftLeg: [
          [245, 280],
          [309, 264],
          [377, 239],
        ],
        rightLeg: [
          [250, 283],
          [316, 270],
          [385, 248],
        ],
      },
    ],
  },
  "bayesian-cable-curl": {
    name: "Bayesian Cable Curl",
    muscles: ["biceps"],
    equipment: "low-cable",
    steps: [
      "Face away from a low cable with your working arm slightly behind your torso. Stand tall and keep your upper arm steady.",
      "Curl the handle toward your shoulder without swinging or letting the elbow drift. Lower slowly and repeat on the other side.",
    ],
    poses: [
      {
        ...standing,
        leftArm: [
          [224, 111],
          [189, 164],
          [157, 207],
        ],
      },
      {
        ...standing,
        leftArm: [
          [224, 111],
          [189, 164],
          [228, 118],
        ],
      },
    ],
  },
  "single-arm-cable-press": {
    name: "Single-Arm Cable Press",
    muscles: ["chest"],
    equipment: "chest-cable",
    steps: [
      "Stand facing away from a chest-height pulley in a staggered stance. Hold the handle beside your chest and brace your torso.",
      "Press one hand forward without rotating your body. Return slowly until the hand is beside your chest; switch sides.",
    ],
    poses: [
      {
        ...standing,
        leftArm: [
          [224, 111],
          [196, 145],
          [223, 125],
        ],
      },
      {
        ...standing,
        leftArm: [
          [224, 111],
          [295, 119],
          [355, 125],
        ],
      },
    ],
  },
  "lean-away-lateral-raise": {
    name: "Lean-Away Lateral Raise",
    muscles: ["shoulders"],
    equipment: "support",
    steps: [
      "Hold a stable support with one hand. Keep your feet close to it and lean away slightly, letting the dumbbell hang at your free side.",
      "Raise your free arm out to shoulder height with a soft elbow. Lower slowly; keep your neck relaxed and avoid shrugging.",
    ],
    poses: [
      {
        ...standing,
        head: [218, 65],
        neck: [218, 96],
        hips: [249, 210],
        leftArm: [
          [202, 111],
          [178, 164],
          [162, 210],
        ],
        rightArm: [
          [234, 111],
          [289, 115],
          [350, 120],
        ],
      },
      {
        ...standing,
        head: [218, 65],
        neck: [218, 96],
        hips: [249, 210],
        leftArm: [
          [202, 111],
          [145, 116],
          [86, 121],
        ],
        rightArm: [
          [234, 111],
          [289, 115],
          [350, 120],
        ],
      },
    ],
  },
  "y-raise": {
    name: "Y Raise",
    muscles: ["lower trapezius", "shoulders"],
    steps: [
      "Stand tall with light weights and palms facing inward. Brace your trunk and start with your arms by your sides.",
      "Raise both arms diagonally into a Y without shrugging or arching your back. Pause, then lower with control.",
    ],
    poses: [
      standing,
      {
        ...standing,
        leftArm: [
          [224, 111],
          [170, 81],
          [117, 38],
        ],
        rightArm: [
          [256, 111],
          [310, 81],
          [363, 38],
        ],
      },
    ],
  },
  "pike-push-up": {
    name: "Pike Push-Up",
    muscles: ["shoulders", "triceps"],
    steps: [
      "Place your hands on the floor and lift your hips into an inverted V. Keep the weight controlled over your hands.",
      "Bend the elbows to lower your head toward the floor between and slightly ahead of your hands. Press back up, keeping your hips high.",
    ],
    poses: [
      {
        head: [166, 179],
        neck: [184, 160],
        hips: [256, 82],
        leftArm: [
          [179, 165],
          [147, 226],
          [117, 298],
        ],
        rightArm: [
          [193, 171],
          [160, 231],
          [130, 301],
        ],
        leftLeg: [
          [256, 82],
          [298, 191],
          [345, 300],
        ],
        rightLeg: [
          [266, 88],
          [310, 194],
          [358, 301],
        ],
      },
      {
        head: [177, 261],
        neck: [198, 234],
        hips: [256, 82],
        leftArm: [
          [190, 228],
          [126, 236],
          [117, 298],
        ],
        rightArm: [
          [204, 234],
          [140, 242],
          [130, 301],
        ],
        leftLeg: [
          [256, 82],
          [298, 191],
          [345, 300],
        ],
        rightLeg: [
          [266, 88],
          [310, 194],
          [358, 301],
        ],
      },
    ],
  },
  "cross-body-cable-extension": {
    name: "Cross-Body Cable Extension",
    muscles: ["triceps"],
    equipment: "high-cable",
    steps: [
      "Stand beside a high pulley and hold its handle with the opposite hand. Bring the working elbow in front of your torso and keep it still.",
      "Extend the elbow diagonally down and across your body. Control the return without moving your shoulder; repeat on the other side.",
    ],
    poses: [
      {
        ...standing,
        rightArm: [
          [256, 111],
          [244, 167],
          [197, 121],
        ],
      },
      {
        ...standing,
        rightArm: [
          [256, 111],
          [244, 167],
          [290, 215],
        ],
      },
    ],
  },
  "landmine-press": {
    name: "Landmine Press",
    muscles: ["shoulders", "chest"],
    equipment: "landmine",
    steps: [
      "Secure one end of the bar in a landmine attachment. Stand in a staggered stance and hold the free end near one shoulder.",
      "Brace your torso and press the bar upward and forward. Lower to your shoulder with control, without leaning back.",
    ],
    poses: [
      {
        ...standing,
        rightArm: [
          [256, 111],
          [271, 151],
          [277, 104],
        ],
      },
      {
        ...standing,
        rightArm: [
          [256, 111],
          [296, 87],
          [330, 54],
        ],
      },
    ],
  },
};
const line = (points, color, width) =>
  `<polyline points="${points.map((p) => p.join(",")).join(" ")}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
function svg(g, p, index) {
  const hand = g.equipment === "high-cable" ? p.rightArm[2] : p.leftArm[2];
  let equipment = "";
  if (g.equipment?.includes("cable")) {
    const y =
      g.equipment === "low-cable"
        ? 307
        : g.equipment === "high-cable"
          ? 50
          : 125;
    equipment = `<path d="M65 35V320H100" fill="none" stroke="#b6bbc2" stroke-width="10"/><circle cx="65" cy="${y}" r="10" fill="#777f8b"/>${line([[65, y], hand], "#b6bbc2", 3)}`;
  }
  if (g.equipment === "support")
    equipment = '<path d="M350 30V330" stroke="#b6bbc2" stroke-width="12"/>';
  if (g.equipment === "landmine")
    equipment =
      line([[430, 320], p.rightArm[2]], "#707681", 9) +
      '<circle cx="430" cy="320" r="12" fill="#e36952"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="white"/><path d="M35 332H445" stroke="#e6e7ea" stroke-width="2"/>${equipment}${line(p.rightLeg, "#b6bbc2", 19)}${line(p.leftLeg, "#969da8", 21)}${line([p.neck, p.hips], "#9da4ae", 35)}${line(p.rightArm, "#c6cbd2", 15)}${line(p.leftArm, "#e36952", 16)}<circle cx="${p.head[0]}" cy="${p.head[1]}" r="23" fill="#a6adb7"/><text x="20" y="348" font-family="sans-serif" font-size="10" fill="#777">ORIGINAL FORM GUIDE · ${index === 0 ? "START" : "ACTION / HOLD"}</text></svg>`;
}
mkdirSync("public/demos", { recursive: true });
for (const [id, g] of Object.entries(guides)) {
  mkdirSync(`public/demos/${id}`, { recursive: true });
  g.poses.forEach((p, i) =>
    writeFileSync(`public/demos/${id}/${i}.svg`, svg(g, p, i)),
  );
}
writeFileSync(
  "scripts/original-guides.json",
  JSON.stringify(
    Object.fromEntries(
      Object.entries(guides).map(([id, g]) => [
        id,
        {
          sourceName: g.name,
          kind: "original-guide",
          images: [`demos/${id}/0.svg`, `demos/${id}/1.svg`],
          video: `demos/${id}/loop.mp4`,
          muscles: g.muscles,
          steps: g.steps,
          sourceURL: "",
        },
      ]),
    ),
    null,
    2,
  ),
);
