import { Sparkles } from "lucide-react";
import { FaMicrosoft, FaXbox } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useState } from "react";
import {
  SiAnthropic,
  SiAppletv,
  SiApplemusic,
  SiCrunchyroll,
  SiDeezer,
  SiDiscord,
  SiDropbox,
  SiEpicgames,
  SiFacebook,
  SiFigma,
  SiGmail,
  SiGoogle,
  SiGooglegemini,
  SiHbo,
  SiInstagram,
  SiMubi,
  SiNetflix,
  SiOpenvpn,
  SiNotion,
  SiParamountplus,
  SiPlaystation,
  SiPlex,
  SiRiotgames,
  SiRoblox,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiYoutubemusic,
} from "react-icons/si";
import { cn } from "@/lib/utils";

export type PlatformIconDefinition = {
  id: string;
  name: string;
  categoryId: string;
  searchTerm: string;
  fallback: string;
  aliases?: string[];
  assetUrl?: string;
  Icon?: IconType;
  surface: string;
  isAiHub?: boolean;
};

const platformAsset = (name: string) => `/platforms/${name}.png`;
const neutralSurface = "bg-white/[0.08] text-white";

/**
 * Catálogo único de los íconos predefinidos de la tienda.
 * Para agregar uno nuevo basta con incluir una entrada en este arreglo.
 */
export const platformIcons: readonly PlatformIconDefinition[] = [
  { id: "netflix", name: "Netflix", categoryId: "streaming", searchTerm: "Netflix", fallback: "N", assetUrl: platformAsset("netflix"), Icon: SiNetflix, surface: neutralSurface },
  { id: "prime-video", name: "Prime Video", categoryId: "streaming", searchTerm: "Prime Video", fallback: "P", assetUrl: platformAsset("prime-video"), surface: neutralSurface },
  { id: "disney-plus", name: "Disney+", categoryId: "streaming", searchTerm: "Disney+", fallback: "D", assetUrl: platformAsset("disney-plus"), surface: neutralSurface },
  { id: "hbo-max", name: "HBO Max", categoryId: "streaming", searchTerm: "HBO Max", fallback: "H", assetUrl: platformAsset("hbo-max"), Icon: SiHbo, surface: neutralSurface },
  { id: "paramount-plus", name: "Paramount+", categoryId: "streaming", searchTerm: "Paramount", fallback: "P+", assetUrl: platformAsset("paramount-plus"), Icon: SiParamountplus, surface: neutralSurface },
  { id: "crunchyroll", name: "Crunchyroll", categoryId: "streaming", searchTerm: "Crunchyroll", fallback: "C", assetUrl: platformAsset("crunchyroll"), Icon: SiCrunchyroll, surface: neutralSurface },
  { id: "youtube-premium", name: "YouTube Premium", categoryId: "streaming", searchTerm: "YouTube Premium", fallback: "Y", assetUrl: platformAsset("youtube-premium"), Icon: SiYoutube, surface: neutralSurface },
  { id: "spotify", name: "Spotify", categoryId: "music", searchTerm: "Spotify", fallback: "S", assetUrl: platformAsset("spotify"), Icon: SiSpotify, surface: neutralSurface },
  { id: "apple-music", name: "Apple Music", categoryId: "music", searchTerm: "Apple Music", fallback: "A", assetUrl: platformAsset("apple-music"), Icon: SiApplemusic, surface: neutralSurface },
  { id: "deezer", name: "Deezer", categoryId: "music", searchTerm: "Deezer", fallback: "D", assetUrl: platformAsset("deezer"), Icon: SiDeezer, surface: neutralSurface },
  { id: "chatgpt-plus", name: "ChatGPT Plus", categoryId: "ia", searchTerm: "ChatGPT Plus", fallback: "AI", aliases: ["OpenAI", "ChatGPT"], assetUrl: platformAsset("chatgpt-plus"), surface: neutralSurface },
  { id: "claude-pro", name: "Claude Pro", categoryId: "ia", searchTerm: "Claude Pro", fallback: "C", aliases: ["Anthropic"], assetUrl: platformAsset("claude-pro"), Icon: SiAnthropic, surface: neutralSurface },
  { id: "gemini-advanced", name: "Gemini Advanced", categoryId: "ia", searchTerm: "Gemini", fallback: "G", aliases: ["Google Gemini"], assetUrl: platformAsset("gemini-advanced"), Icon: SiGooglegemini, surface: neutralSurface },
  { id: "microsoft-copilot", name: "Microsoft Copilot", categoryId: "ia", searchTerm: "Copilot", fallback: "M", assetUrl: platformAsset("microsoft-copilot"), surface: neutralSurface },
  { id: "adobe-creative-cloud", name: "Adobe Creative Cloud", categoryId: "apps", searchTerm: "Adobe Creative Cloud", fallback: "A", aliases: ["Adobe"], assetUrl: platformAsset("adobe-creative-cloud"), surface: neutralSurface },
  { id: "canva-pro", name: "Canva Pro", categoryId: "apps", searchTerm: "Canva Pro", fallback: "C", aliases: ["Canva"], assetUrl: platformAsset("canva-pro"), surface: neutralSurface },
  { id: "dropbox", name: "Dropbox", categoryId: "apps", searchTerm: "Dropbox", fallback: "D", assetUrl: platformAsset("dropbox"), Icon: SiDropbox, surface: neutralSurface },
  { id: "gmail", name: "Gmail", categoryId: "apps", searchTerm: "Gmail", fallback: "G", Icon: SiGmail, surface: "bg-white text-[#ea4335]" },
  { id: "google", name: "Google", categoryId: "apps", searchTerm: "Google", fallback: "G", Icon: SiGoogle, surface: "bg-white text-[#4285f4]" },
  { id: "microsoft", name: "Microsoft", categoryId: "apps", searchTerm: "Microsoft", fallback: "M", Icon: FaMicrosoft, surface: "bg-white text-[#00a4ef]" },
  { id: "eset-nod32", name: "ESET NOD32", categoryId: "licencias", searchTerm: "ESET NOD32", fallback: "E", assetUrl: platformAsset("eset-nod32"), surface: neutralSurface },
  { id: "apple-tv", name: "Apple TV", categoryId: "streaming", searchTerm: "Apple TV", fallback: "TV", Icon: SiAppletv, surface: "bg-[#f4f4f5] text-black" },
  { id: "mubi", name: "MUBI", categoryId: "streaming", searchTerm: "MUBI", fallback: "M", Icon: SiMubi, surface: "bg-[#f4f4f5] text-black" },
  { id: "youtube-music", name: "YouTube Music", categoryId: "music", searchTerm: "YouTube Music", fallback: "YM", Icon: SiYoutubemusic, surface: "bg-[#ff0033] text-white" },
  { id: "plex", name: "Plex", categoryId: "streaming", searchTerm: "", fallback: "P", Icon: SiPlex, surface: "bg-[#e5a00d] text-black" },
  { id: "steam", name: "Steam", categoryId: "videojuegos", searchTerm: "", fallback: "S", Icon: SiSteam, surface: "bg-[#162234] text-white" },
  { id: "playstation", name: "PlayStation", categoryId: "videojuegos", searchTerm: "", fallback: "PS", Icon: SiPlaystation, surface: "bg-[#006fcd] text-white" },
  { id: "epic-games", name: "Epic Games", categoryId: "videojuegos", searchTerm: "", fallback: "EG", Icon: SiEpicgames, surface: "bg-[#27272a] text-white" },
  { id: "roblox", name: "Roblox", categoryId: "videojuegos", searchTerm: "", fallback: "R", Icon: SiRoblox, surface: "bg-[#e2231a] text-white" },
  { id: "xbox", name: "Xbox", categoryId: "videojuegos", searchTerm: "Xbox", fallback: "X", Icon: FaXbox, surface: "bg-[#107c10] text-white" },
  { id: "riot-games", name: "Riot Games", categoryId: "videojuegos", searchTerm: "", fallback: "RG", Icon: SiRiotgames, surface: "bg-[#d32936] text-white" },
  { id: "discord", name: "Discord", categoryId: "videojuegos", searchTerm: "", fallback: "D", Icon: SiDiscord, surface: "bg-[#5865f2] text-white" },
  { id: "twitch", name: "Twitch", categoryId: "videojuegos", searchTerm: "", fallback: "T", Icon: SiTwitch, surface: "bg-[#9146ff] text-white" },
  { id: "notion", name: "Notion", categoryId: "apps", searchTerm: "", fallback: "N", Icon: SiNotion, surface: "bg-[#f4f4f5] text-black" },
  { id: "figma", name: "Figma", categoryId: "apps", searchTerm: "", fallback: "F", Icon: SiFigma, surface: "bg-[#2c2c2e] text-white" },
  { id: "openvpn", name: "OpenVPN", categoryId: "apps", searchTerm: "VPN", fallback: "VPN", Icon: SiOpenvpn, surface: "bg-[#ea7e20] text-white" },
  { id: "telegram", name: "Telegram", categoryId: "redes", searchTerm: "Telegram", fallback: "TG", Icon: SiTelegram, surface: "bg-[#229ed9] text-white" },
  { id: "instagram", name: "Instagram", categoryId: "redes", searchTerm: "Instagram", fallback: "IG", Icon: SiInstagram, surface: "bg-[linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)] text-white" },
  { id: "facebook", name: "Facebook", categoryId: "redes", searchTerm: "Facebook", fallback: "F", Icon: SiFacebook, surface: "bg-[#1877f2] text-white" },
  { id: "tiktok", name: "TikTok", categoryId: "redes", searchTerm: "TikTok", fallback: "TT", Icon: SiTiktok, surface: "bg-black text-white" },
  { id: "whatsapp", name: "WhatsApp", categoryId: "redes", searchTerm: "WhatsApp", fallback: "WA", Icon: SiWhatsapp, surface: "bg-[#25d366] text-white" },
  { id: "x", name: "X", categoryId: "redes", searchTerm: "X", fallback: "X", Icon: SiX, surface: "bg-black text-white" },
  { id: "ia", name: "IA", categoryId: "ia", searchTerm: "", fallback: "IA", aliases: ["Inteligencia Artificial"], surface: "border border-violet-200/35 bg-[radial-gradient(circle_at_30%_20%,#c084fc_0%,#7c3aed_36%,#312e81_75%)] text-white shadow-[0_0_14px_rgba(139,92,246,0.55)]", isAiHub: true },
];

const platformIconById = new Map(platformIcons.map((icon) => [icon.id, icon]));
const platformIconIdByName = new Map(
  platformIcons.map((icon) => [icon.name.toLocaleLowerCase(), icon.id]),
);

export function getPlatformIcon(iconId?: string | null) {
  return iconId ? platformIconById.get(iconId) ?? null : null;
}

export function getPlatformIconIdByName(name?: string | null) {
  return name ? platformIconIdByName.get(name.toLocaleLowerCase()) ?? null : null;
}

/** Renderiza una marca del catálogo central en cualquier interfaz. */
export function PlatformIconMark({
  iconId,
  className,
  iconClassName,
}: {
  iconId?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const platform = getPlatformIcon(iconId);
  const [imageFailed, setImageFailed] = useState(false);
  if (!platform) return null;

  const Icon = platform.Icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid h-9 w-9 place-items-center overflow-hidden rounded-full shadow-sm",
        platform.surface,
        className,
      )}
    >
      {platform.assetUrl && !imageFailed ? (
        <img
          src={platform.assetUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain p-1.5"
        />
      ) : platform.isAiHub ? (
        <>
          <Sparkles className="absolute right-1 top-1 h-2.5 w-2.5 text-violet-100" />
          <span className="relative text-[10px] font-black tracking-[-0.08em]">IA</span>
        </>
      ) : Icon ? (
        <Icon className={cn("h-[18px] w-[18px]", iconClassName)} />
      ) : (
        <span className="text-xs font-black">{platform.fallback}</span>
      )}
    </span>
  );
}
