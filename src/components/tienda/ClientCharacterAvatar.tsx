import { cn } from "@/lib/utils";

const femaleCharacters = [0, 2, 5, 6] as const;
const maleCharacters = [1, 3, 4, 7] as const;
const allCharacters = [0, 1, 2, 3, 4, 5, 6, 7] as const;

const femaleNames = new Set([
  "ana",
  "andrea",
  "angela",
  "beatriz",
  "camila",
  "carla",
  "carmen",
  "carolina",
  "catalina",
  "claudia",
  "daniela",
  "diana",
  "elena",
  "elisa",
  "gabriela",
  "isabel",
  "isabella",
  "jessica",
  "julieta",
  "karen",
  "laura",
  "lucia",
  "luisa",
  "maria",
  "mariana",
  "marisol",
  "marta",
  "melissa",
  "monica",
  "natalia",
  "noa",
  "paola",
  "patricia",
  "rosa",
  "rocio",
  "sandra",
  "sara",
  "sofia",
  "valentina",
  "valeria",
  "vanessa",
  "veronica",
  "amparo",
  "cielo",
  "consuelo",
  "rosario",
]);
const maleNames = new Set([
  "adrian",
  "alejandro",
  "andres",
  "antonio",
  "benjamin",
  "borja",
  "bruno",
  "carlos",
  "cesar",
  "cristian",
  "daniel",
  "david",
  "diego",
  "eduardo",
  "emilio",
  "enrique",
  "felipe",
  "fernando",
  "francisco",
  "gabriel",
  "gonzalo",
  "guillermo",
  "hector",
  "hugo",
  "ivan",
  "javier",
  "jesus",
  "joaquin",
  "jorge",
  "jose",
  "juan",
  "julian",
  "luca",
  "lucas",
  "luis",
  "manuel",
  "marco",
  "martin",
  "mateo",
  "maximo",
  "miguel",
  "nicolas",
  "oscar",
  "pablo",
  "pedro",
  "rafael",
  "raul",
  "ricardo",
  "roberto",
  "rodrigo",
  "samuel",
  "sebastian",
  "sergio",
  "tomas",
  "victor",
]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function nameStyle(name: string): "female" | "male" | "unknown" {
  // El nombre es solo una pista visual, no una declaración de identidad.
  if (!name.trim() || name.includes("@")) return "unknown";
  const firstName =
    normalize(name)
      .split(/\s+/)[0]
      ?.replace(/[^a-z]/g, "") ?? "";
  if (femaleNames.has(firstName)) return "female";
  if (maleNames.has(firstName)) return "male";
  if (firstName.length < 3) return "unknown";
  if (firstName.endsWith("a")) return "female";
  if (firstName.endsWith("o")) return "male";
  return "unknown";
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function selectClientCharacter(name: string) {
  const style = nameStyle(name);
  const pool =
    style === "female" ? femaleCharacters : style === "male" ? maleCharacters : allCharacters;
  return pool[stableHash(normalize(name)) % pool.length];
}

export function ClientCharacterAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const avatarClass = cn(
    "block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border",
    className,
  );
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={cn(avatarClass, "object-cover")} loading="lazy" />;
  }

  const character = selectClientCharacter(name);
  const column = character % 4;
  const row = Math.floor(character / 4);
  return (
    <span
      aria-hidden="true"
      className={cn(avatarClass, "bg-white bg-no-repeat")}
      style={{
        backgroundImage: "url('/avatars/personajes.png')",
        backgroundSize: "400% auto",
        backgroundPosition: `${(column * 100) / 3}% ${row === 0 ? 4 : 84}%`,
      }}
    />
  );
}
