//#region node_modules/.nitro/vite/services/ssr/assets/floid-entities-CYSl5pKy.js
/** Entidades soportadas por Floid Payouts Perú (client-safe). */
var FLOID_ENTITIES = [
	{
		code: "BCP",
		label: "Banco de Crédito del Perú"
	},
	{
		code: "INTERBANK",
		label: "Interbank"
	},
	{
		code: "SCOTIABANK",
		label: "Scotiabank Perú S.A.A."
	},
	{
		code: "BBVA",
		label: "BBVA Continental"
	},
	{
		code: "NACION",
		label: "Banco de la Nación"
	},
	{
		code: "PICHINCHA",
		label: "Banco Pichincha"
	},
	{
		code: "FALABELLA",
		label: "Banco Falabella Perú S.A."
	},
	{
		code: "ALFIN",
		label: "Banco Azteca del Perú S.A. - Alfin"
	},
	{
		code: "BANBIF",
		label: "BANBIF"
	},
	{
		code: "MIBANCO",
		label: "Mi Banco"
	},
	{
		code: "YAPE",
		label: "Yape (Billetera Digital)"
	},
	{
		code: "CPIURA",
		label: "Caja Piura"
	},
	{
		code: "CAREQUIPA",
		label: "Caja Arequipa"
	},
	{
		code: "CHUANCAYO",
		label: "Caja Huancayo"
	},
	{
		code: "CTRUJILLO",
		label: "Caja Trujillo"
	},
	{
		code: "CSULLANA",
		label: "Caja Sullana"
	},
	{
		code: "CCUZCO",
		label: "Caja Cuzco"
	}
];
/** Límites por transacción según la documentación de Floid. */
var FLOID_LIMITS = {
	YAPE: {
		PEN: {
			min: 1,
			max: 3500
		},
		USD: {
			min: 1,
			max: 3500
		}
	},
	BANK: {
		PEN: {
			min: 1,
			max: 3e4
		},
		USD: {
			min: 1,
			max: 1e4
		}
	}
};
function floidLimitsFor(entity, currency) {
	return entity === "YAPE" ? FLOID_LIMITS.YAPE[currency] : FLOID_LIMITS.BANK[currency];
}
//#endregion
export { FLOID_ENTITIES, floidLimitsFor };
