import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useSound-RUCf2ylS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function getAudioContextConstructor() {
	return window.AudioContext || window.webkitAudioContext;
}
var useFuturisticSound = () => {
	const audioCtx = (0, import_react.useRef)(null);
	return {
		playHover: (0, import_react.useCallback)(() => {
			try {
				if (!audioCtx.current) {
					const AudioContextConstructor = getAudioContextConstructor();
					if (!AudioContextConstructor) return;
					audioCtx.current = new AudioContextConstructor();
				}
				if (audioCtx.current.state === "suspended") audioCtx.current.resume();
				const ctx = audioCtx.current;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(800, ctx.currentTime);
				osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + .1);
				gain.gain.setValueAtTime(.15, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .1);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start();
				osc.stop(ctx.currentTime + .1);
			} catch (e) {
				console.warn("Audio play failed:", e);
			}
		}, []),
		playClick: (0, import_react.useCallback)(() => {
			try {
				if (!audioCtx.current) {
					const AudioContextConstructor = getAudioContextConstructor();
					if (!AudioContextConstructor) return;
					audioCtx.current = new AudioContextConstructor();
				}
				if (audioCtx.current.state === "suspended") audioCtx.current.resume();
				const ctx = audioCtx.current;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "square";
				osc.frequency.setValueAtTime(1200, ctx.currentTime);
				osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + .05);
				gain.gain.setValueAtTime(.1, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .05);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start();
				osc.stop(ctx.currentTime + .05);
			} catch (e) {
				console.warn("Audio play failed:", e);
			}
		}, [])
	};
};
//#endregion
export { useFuturisticSound as t };
