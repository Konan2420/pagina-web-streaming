//#region node_modules/.nitro/vite/services/ssr/assets/avatar-effects-XfJ0Ki_h.js
var AVATAR_EFFECTS = [
	{
		id: "none",
		label: "Sin efecto",
		desc: "Avatar limpio, sin animación."
	},
	{
		id: "white-flame",
		label: "Llama blanca",
		desc: "Aura blanca suave girando."
	},
	{
		id: "red-fire",
		label: "Fuego rojo",
		desc: "Llamas rojas premium."
	},
	{
		id: "neon-energy",
		label: "Energía neón",
		desc: "Anillo neón rojo, azul y violeta."
	},
	{
		id: "electric",
		label: "Relámpago",
		desc: "Arcos eléctricos en el borde."
	},
	{
		id: "cyber-ring",
		label: "Anillo cyberpunk",
		desc: "HUD digital giratorio."
	},
	{
		id: "energy-pulse",
		label: "Pulso de energía",
		desc: "Pulso circular expansivo."
	},
	{
		id: "galaxy",
		label: "Órbita galáctica",
		desc: "Partículas en órbita."
	},
	{
		id: "gold-premium",
		label: "Oro premium",
		desc: "Anillo metálico dorado."
	},
	{
		id: "particles",
		label: "Tormenta de partículas",
		desc: "Partículas luminosas."
	},
	{
		id: "holographic",
		label: "Holográfico",
		desc: "Reflejos cian y violeta."
	},
	{
		id: "rgb-neon",
		label: "RGB neón",
		desc: "Degradado animado multicolor."
	},
	{
		id: "white-energy",
		label: "Energía blanca",
		desc: "Estela de luz continua."
	},
	{
		id: "meteor",
		label: "Órbita meteoro",
		desc: "Meteoro con estela corta."
	},
	{
		id: "scanner",
		label: "Escáner digital",
		desc: "Barrido de luz vertical."
	}
];
var AVATAR_EFFECT_IDS = AVATAR_EFFECTS.map((e) => e.id);
/** Tupla no vacía para validación con zod en el servidor. */
var AVATAR_EFFECT_VALUES = AVATAR_EFFECTS.map((e) => e.id);
/** Etiqueta legible de un efecto ("Relámpago", "Oro premium", ...). */
function effectLabel(value) {
	const id = normalizeEffect(value);
	return AVATAR_EFFECTS.find((e) => e.id === id)?.label ?? "Sin efecto";
}
function normalizeEffect(value) {
	return AVATAR_EFFECT_IDS.includes(value ?? "") ? value : "none";
}
//#endregion
export { normalizeEffect as i, AVATAR_EFFECT_VALUES as n, effectLabel as r, AVATAR_EFFECTS as t };
