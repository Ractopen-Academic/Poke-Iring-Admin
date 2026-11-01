"use client";

import { useState } from "react";
import {
  ArrowRight,
  Award,
  Check,
  Clock,
  Eye,
  Handshake,
  Megaphone,
  Smartphone,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import type { EventType } from "../types/event.types";

export interface CalicoPalettePreset {
  id: string;
  name: string;
  bannerHex: string;
  accentHex: string;
  tagline: string;
}

export const CALICO_EVENT_PRESETS: CalicoPalettePreset[] = [
  {
    id: "obsidian_gala",
    name: "Obsidian Gala",
    bannerHex: "#231a16",
    accentHex: "#ff8c1a",
    tagline: "Signature Calico dark fur & marmalade",
  },
  {
    id: "marmalade_festival",
    name: "Marmalade Sun",
    bannerHex: "#b84a06",
    accentHex: "#ffd699",
    tagline: "Warm roasted ginger & cream highlight",
  },
  {
    id: "cinnamon_sanctuary",
    name: "Cinnamon Care",
    bannerHex: "#5c2d16",
    accentHex: "#ffb04f",
    tagline: "Cozy sanctuary brown & honey gold",
  },
  {
    id: "terracotta_raid",
    name: "Terracotta Raid",
    bannerHex: "#7c2d12",
    accentHex: "#fb923c",
    tagline: "High-energy barangay blitz amber",
  },
  {
    id: "espresso_blossom",
    name: "Espresso Pink",
    bannerHex: "#2c2320",
    accentHex: "#ffb4be",
    tagline: "Charcoal coat & soft nose-bean pink",
  },
];

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function evaluateCalicoThemeCohesion(
  bannerHex: string,
  accentHex: string
): {
  contrastRatio: number;
  isReadableOnWhiteText: boolean;
  isWarmCohesive: boolean;
  recommendation: string;
} {
  const rgb = parseHexRgb(bannerHex) ?? { r: 35, g: 26, b: 22 };
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const contrastWithWhite = (1.0 + 0.05) / (lum + 0.05);
  const isReadableOnWhiteText = contrastWithWhite >= 4.2;

  const isCoolDominant = rgb.b > rgb.r + 35 && rgb.b > 110;
  const isWarmCohesive = !isCoolDominant && isReadableOnWhiteText;

  let recommendation = "Matches the mobile Calico cream & marmalade UI cleanly.";
  if (!isReadableOnWhiteText) {
    recommendation =
      "Banner is too bright for white mobile text. Pick a deeper shade or a Calico preset.";
  } else if (isCoolDominant) {
    recommendation =
      "Cool blue/purple tones contrast starkly with the warm #FFF9F2 Calico shell. Consider a warm preset.";
  } else if (accentHex.toLowerCase() === bannerHex.toLowerCase()) {
    recommendation =
      "Accent badge matches banner background; pick a brighter accent so currency pills stand out.";
  }

  return {
    contrastRatio: Math.round(contrastWithWhite * 10) / 10,
    isReadableOnWhiteText,
    isWarmCohesive,
    recommendation,
  };
}

function darkenHex(hex: string, factor = 0.28): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return "#140f0d";
  const target = { r: 20, g: 15, b: 13 };
  const mix = (a: number, b: number) => Math.round(a + (b - a) * factor);
  const r = mix(rgb.r, target.r).toString(16).padStart(2, "0");
  const g = mix(rgb.g, target.g).toString(16).padStart(2, "0");
  const b = mix(rgb.b, target.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function formatRemainingPreview(startDate: string, endDate: string): string {
  const startMs = Date.parse(startDate);
  const endMs = Date.parse(endDate);
  if (Number.isNaN(endMs)) return "7d 0h left";
  const baseMs = Number.isNaN(startMs) ? endMs - 7 * 86400000 : startMs;
  const diffMs = endMs - baseMs;
  if (diffMs <= 0) return "Concluded";
  const totalHours = Math.floor(diffMs / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.max(1, Math.floor((diffMs % 3600000) / 60000));
  return totalHours > 0 ? `${totalHours}h ${mins}m left` : `${mins}m left`;
}

export interface EventMobilePreviewProps {
  title: string;
  subtitle: string;
  description: string;
  eventType: EventType;
  multiplier: number;
  startDate: string;
  endDate: string;
  currencyName: string;
  currencyCode: string;
  bannerHex: string;
  accentHex: string;
  bannerImageUrl?: string;
  logoImageUrl?: string;
  partnerName?: string;
  isActive: boolean;
  isFeaturedInCarousel: boolean;
  showPopupOnLaunch: boolean;
}

export function EventMobilePreview({
  title,
  subtitle,
  description,
  eventType,
  multiplier,
  startDate,
  endDate,
  currencyName,
  currencyCode,
  bannerHex,
  accentHex,
  bannerImageUrl,
  logoImageUrl,
  partnerName,
  isActive,
  isFeaturedInCarousel,
  showPopupOnLaunch,
}: EventMobilePreviewProps) {
  const [previewMode, setPreviewMode] = useState<"carousel" | "popup">(
    "carousel"
  );

  const safeBannerHex = /^#[0-9a-fA-F]{6}$/.test(bannerHex)
    ? bannerHex
    : "#231a16";
  const safeAccentHex = /^#[0-9a-fA-F]{6}$/.test(accentHex)
    ? accentHex
    : "#ff8c1a";
  const gradientEnd = darkenHex(safeBannerHex, 0.28);

  const isPartnership =
    eventType === "partnership" || Boolean(partnerName && partnerName.trim());
  const carouselBadgeLabel =
    partnerName && partnerName.trim().length > 0
      ? partnerName.trim()
      : isPartnership
        ? "Partnership"
        : subtitle.trim() || "Limited Event";
  const popupBadgeLabel =
    partnerName && partnerName.trim().length > 0
      ? partnerName.trim()
      : isPartnership
        ? "Partnership Spotlight"
        : subtitle.trim() || "Seasonal Gala";

  const displayTitle = title.trim() || "Calico Dusk Festival";
  const displayDesc =
    description.trim() ||
    "Stroll through your barangay at dusk to catalog Puspin cats and earn event tokens for exclusive borders.";
  const displayCode = currencyCode.trim().toUpperCase() || "MLT";
  const displayCurrency = currencyName.trim() || "Moonlit Tokens";
  const clampedMult = Math.min(5, Math.max(1, Number(multiplier) || 1));
  const formattedMult =
    Math.round(clampedMult) === clampedMult
      ? `${clampedMult.toFixed(0)}x`
      : `${clampedMult.toFixed(1)}x`;
  const remainingLabel = formatRemainingPreview(startDate, endDate);
  const hasBannerImg = Boolean(
    bannerImageUrl && bannerImageUrl.trim().startsWith("https://")
  );
  const hasLogoImg = Boolean(
    logoImageUrl && logoImageUrl.trim().startsWith("https://")
  );

  const cohesion = evaluateCalicoThemeCohesion(safeBannerHex, safeAccentHex);

  return (
    <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950/80 p-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[#FF8C1A]" />
          <div>
            <div className="text-xs font-semibold text-neutral-100">
              Live Explorer Preview
            </div>
            <div className="text-[10px] text-neutral-400">
              Exact 1:1 Flutter Calico UI shell rendering
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setPreviewMode("carousel")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              previewMode === "carousel"
                ? "bg-[#FF8C1A] text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Home Card
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("popup")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              previewMode === "popup"
                ? "bg-[#FF8C1A] text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Launch Modal
          </button>
        </div>
      </div>

      {/* Cohesion & Contrast Banner */}
      <div
        className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] ${
          cohesion.isWarmCohesive
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
        }`}
      >
        {cohesion.isWarmCohesive ? (
          <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
        ) : (
          <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
        )}
        <div className="leading-snug">
          <span className="font-semibold">
            Contrast {cohesion.contrastRatio}:1
          </span>{" "}
          &mdash; {cohesion.recommendation}
        </div>
      </div>

      {/* Simulated Mobile Viewport */}
      <div className="mt-3 flex justify-center">
        <div className="relative w-full max-w-[320px] overflow-hidden rounded-[28px] border-[5px] border-[#1B1614] bg-[#FFF9F2] text-[#1E1815] shadow-2xl">
          {/* Phone Top Bar */}
          <div className="flex items-center justify-center gap-1.5 pt-2.5 pb-2 bg-[#FFF9F2]">
            <span className="h-2 w-2 rounded-full bg-[#FF8C1A]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#1B1614]" />
            <span className="text-xs font-extrabold tracking-tight text-[#1E1815]">
              Poke: Iring
            </span>
          </div>

          {/* Visibility State Pill */}
          {(!isActive ||
            (previewMode === "carousel" && !isFeaturedInCarousel) ||
            (previewMode === "popup" && !showPopupOnLaunch)) && (
            <div className="mx-3 mb-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-center text-[10px] font-semibold text-amber-900">
              {!isActive
                ? "Draft / Paused: Hidden from live players until Active State is enabled"
                : previewMode === "carousel"
                  ? "Carousel toggle is OFF: Card will not appear on Home"
                  : "Launch Popup toggle is OFF: Modal will not auto-open on launch"}
            </div>
          )}

          {/* Explorer Home Underlying Content */}
          <div className="px-3.5 pb-16 space-y-2.5">
            {/* Mini Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1B1614] px-2 py-0.5 text-[9px] font-bold text-white">
                  <Sparkles className="h-2.5 w-2.5 text-[#FF8C1A]" />
                  Welcome back,
                </span>
                <div className="mt-0.5 text-sm font-black text-[#1E1815]">
                  MarmaladeScout
                </div>
              </div>
              <span className="rounded-full border border-[#FFCFA3] bg-[#FFEFE0] px-2 py-0.5 text-[9px] font-bold text-[#E06D00]">
                Barangay Scout
              </span>
            </div>

            {/* Mini Territory Champions Card */}
            <div className="rounded-2xl border border-[#F2E3D3] bg-white p-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1B1614]">
                    <Trophy className="h-3.5 w-3.5 text-[#FF8C1A]" />
                  </span>
                  <div>
                    <div className="text-[11px] font-extrabold text-[#1E1815]">
                      Territory Champions
                    </div>
                    <div className="text-[9px] text-[#6E5F57]">
                      Top explorers this season
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-[#FFCFA3] bg-[#FFEFE0] px-2 py-0.5 text-[9px] font-extrabold text-[#E06D00]">
                  View Ranks
                </span>
              </div>
            </div>

            {/* Live ActiveEventsCarousel Card */}
            <div
              className="relative overflow-hidden rounded-[18px] p-3.5 text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${safeBannerHex} 0%, ${gradientEnd} 100%)`,
                border: `1.3px solid ${safeAccentHex}66`,
              }}
            >
              {hasBannerImg ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerImageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(27,22,20,0.40) 0%, rgba(27,22,20,0.72) 100%)",
                    }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full"
                    style={{ backgroundColor: `${safeAccentHex}26` }}
                  />
                  <div
                    className="pointer-events-none absolute -right-2 top-7 h-12 w-12 rounded-full"
                    style={{ backgroundColor: "rgba(255,250,244,0.08)" }}
                  />
                </>
              )}

              <div className="relative z-10 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-xs">
                    {hasLogoImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoImageUrl}
                        alt=""
                        className="h-3.5 w-3.5 rounded-xs object-cover"
                      />
                    ) : isPartnership ? (
                      <Handshake className="h-3 w-3 text-white" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-white" />
                    )}
                    <span className="truncate max-w-[120px]">
                      {carouselBadgeLabel}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-md bg-black/25 px-1.5 py-0.5 text-[9px] font-semibold text-white/85">
                    <Clock className="h-2.5 w-2.5" />
                    {remainingLabel}
                  </span>
                </div>

                <div>
                  <div className="truncate text-[13.5px] font-extrabold leading-tight text-white">
                    {displayTitle}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/80">
                    {displayDesc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
                      style={{
                        backgroundColor: `${safeAccentHex}33`,
                        border: `1px solid ${safeAccentHex}80`,
                        color: safeAccentHex,
                      }}
                    >
                      Earn {displayCode}
                    </span>
                    {clampedMult > 1 && (
                      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                        {formattedMult} Points
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white">
                    View Event
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Paw Quests Preview */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#1E1815]">
                  Paw Quests
                </span>
                <span className="rounded-full border border-[#F2E3D3] bg-[#FFF2E4] px-2 py-0.5 text-[8.5px] font-semibold text-[#6E5F57]">
                  Daily Patrol
                </span>
              </div>
              <div className="rounded-xl border border-[#F2E3D3] bg-white p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-[#1E1815]">
                    Puspin Discovery
                  </span>
                  <span className="rounded-full bg-[#FFEFE0] px-1.5 py-0.5 text-[9px] font-extrabold text-[#E06D00]">
                    +50
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#FFF2E4]">
                  <div className="h-full w-2/5 rounded-full bg-[#FF8C1A]" />
                </div>
              </div>
            </div>
          </div>

          {/* Launch Modal Overlay when in 'popup' mode */}
          {previewMode === "popup" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-3.5 backdrop-blur-[1px]">
              <div className="w-full overflow-hidden rounded-[20px] border border-[#FFCFA3] bg-[#FFF9F2] shadow-2xl">
                {/* Modal Header Banner */}
                <div
                  className="relative overflow-hidden p-3.5 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${safeBannerHex} 0%, ${gradientEnd} 100%)`,
                  }}
                >
                  {hasBannerImg && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerImageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(27,22,20,0.40) 0%, rgba(27,22,20,0.75) 100%)",
                        }}
                      />
                    </>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[9.5px] font-bold text-white">
                        {hasLogoImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoImageUrl}
                            alt=""
                            className="h-3.5 w-3.5 rounded-xs object-cover"
                          />
                        ) : (
                          <Megaphone className="h-3 w-3 text-white" />
                        )}
                        <span className="truncate max-w-[140px]">
                          {popupBadgeLabel}
                        </span>
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white">
                        <X className="h-3 w-3" />
                      </span>
                    </div>

                    <div className="mt-2.5 text-[15px] font-extrabold leading-tight text-white">
                      {displayTitle}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-black/25 px-1.5 py-0.5 text-[9px] font-semibold text-white/85">
                        <Clock className="h-2.5 w-2.5" />
                        {remainingLabel}
                      </span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                        style={{
                          backgroundColor: `${safeAccentHex}33`,
                          border: `1px solid ${safeAccentHex}80`,
                          color: safeAccentHex,
                        }}
                      >
                        {displayCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-3.5 space-y-2.5 text-[#1E1815]">
                  <p className="text-[10.5px] leading-relaxed text-[#6E5F57] line-clamp-3">
                    {displayDesc}
                  </p>

                  <div className="flex items-center gap-2 rounded-xl border border-[#F2E3D3] bg-white p-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFEFE0] text-[#FF8C1A]">
                      <Award className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[10px] font-bold text-[#1E1815]">
                        {clampedMult > 1
                          ? `${formattedMult} Paw Points Boost Active`
                          : "Festival Quests & Borders Active"}
                      </div>
                      <div className="text-[9px] text-[#6E5F57]">
                        Complete patrols to earn {displayCode} rewards
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9.5px] text-[#6E5F57]">
                    <span className="h-3 w-3 rounded-[3px] border border-[#C9B8AD] bg-white" />
                    Don&apos;t show this announcement again today
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <div className="rounded-lg border border-[#F2E3D3] bg-white py-1.5 text-center text-[10px] font-semibold text-[#6E5F57]">
                      Later
                    </div>
                    <div className="col-span-2 rounded-lg bg-[#FF8C1A] py-1.5 text-center text-[10.5px] font-extrabold text-white">
                      Explore Event
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simulated Calico Obsidian Bottom Nav */}
          <div className="absolute inset-x-2.5 bottom-2 z-10 flex h-11 items-center justify-around rounded-2xl bg-[#1B1614] px-2 text-[8.5px] font-bold text-[#A6958B] shadow-lg">
            <div className="flex flex-col items-center text-[#FF8C1A]">
              <span className="mb-0.5 h-0.5 w-3.5 rounded-full bg-[#FF8C1A]" />
              <span>Home</span>
            </div>
            <span>Dex</span>
            <div className="-mt-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FFF9F2] bg-[#FF8C1A] text-[8px] font-black text-white shadow-md">
              MAP
            </div>
            <span>Ranks</span>
            <span>Account</span>
          </div>
        </div>
      </div>
    </div>
  );
}
