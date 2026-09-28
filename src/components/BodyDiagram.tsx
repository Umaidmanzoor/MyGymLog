export default function BodyDiagram({
  group,
  back = false,
  thumbnail = false,
}: {
  group: string;
  back?: boolean;
  thumbnail?: boolean;
}) {
  const color = (part: string) => (part === group ? "#f18a76" : "#d9dbdf");
  return (
    <svg
      viewBox={
        thumbnail
          ? group === "calf"
            ? "25 115 70 68"
            : group === "legs"
              ? "20 88 80 82"
              : "8 25 104 95"
          : "0 0 120 180"
      }
      role="img"
      aria-label={`${back ? "Back" : "Front"} body diagram highlighting ${group}`}
    >
      <g stroke="#aaaeb5" strokeWidth=".8" strokeLinejoin="round">
        <path
          fill="#d9dbdf"
          d="M49 29V22Q42 17 46 6Q50-3 60 1Q73-3 75 8Q78 19 70 23V29L91 38L99 63L103 90L113 116L108 122L99 112L89 90L82 68L79 101L85 125L80 151L75 178H65L62 143L60 120L57 143L55 178H45L40 150L35 124L41 101L38 68L29 90L21 112L12 122L7 116L17 90L21 63L29 38Z"
        />
        <path
          fill={color("shoulders")}
          d="M49 30Q27 29 24 54L37 61L46 47ZM71 30Q93 29 96 54L83 61L74 47Z"
        />
        <path
          fill={color(back ? "back" : "chest")}
          d="M47 35L59 40V62Q45 69 38 58L41 44ZM73 35L61 40V62Q75 69 82 58L79 44Z"
        />
        <path
          fill={color(back ? "back" : "abs")}
          d="M45 66L59 65V103L51 116L42 94ZM75 66L61 65V103L69 116L78 94Z"
        />
        <path
          fill={color(back ? "triceps" : "biceps")}
          d="M25 57L36 64L30 84L20 90ZM95 57L84 64L90 84L100 90Z"
        />
        <path
          fill={color("forearms")}
          d="M20 91L29 87L22 110L14 115ZM100 91L91 87L98 110L106 115Z"
        />
        <path
          fill={color("legs")}
          d="M43 103L56 119L54 143L43 146L38 123ZM77 103L64 119L66 143L77 146L82 123Z"
        />
        <path
          fill={color("calf")}
          d="M43 148L54 148L52 169L47 174ZM77 148L66 148L68 169L73 174Z"
        />
        <path
          fill="none"
          d="M46 76H58M62 76H74M46 87H58M62 87H74M49 97H58M62 97H71M60 29V37"
        />
      </g>
    </svg>
  );
}
