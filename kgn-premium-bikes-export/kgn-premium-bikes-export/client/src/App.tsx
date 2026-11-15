import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fileToBase64 } from "@hatch/space-sdk/client";
import { api, type ApiResponse } from "./api";

import imgClassic from "./assets/bikes/classic-350.jpg";
import imgInterceptor from "./assets/bikes/interceptor-650.jpg";
import imgHimalayan from "./assets/bikes/himalayan-450.jpg";
import imgHunter from "./assets/bikes/hunter-350.jpg";
import imgKtm390 from "./assets/bikes/ktm-390-duke.jpg";
import imgKtm250 from "./assets/bikes/ktm-250-duke.jpg";
import imgCb350 from "./assets/bikes/honda-cb350.jpg";
import imgNs400 from "./assets/bikes/pulsar-ns400z.jpg";
import imgDominar from "./assets/bikes/dominar-400.jpg";
import imgXpulse from "./assets/bikes/xpulse-200.jpg";
import imgR15 from "./assets/bikes/yamaha-r15.jpg";
import imgRr310 from "./assets/bikes/apache-rr310.jpg";
import imgGt650 from "./assets/bikes/continental-gt-650.jpg";
import imgTeamFounder from "./assets/team-founder.webp";
import imgTeamCeo from "./assets/team-ceo.webp";
import imgTeamTreasurer from "./assets/team-treasurer.webp";

const IMAGES: Record<string, string> = {
  "continental-gt-650": imgGt650,
  "classic-350": imgClassic,
  "interceptor-650": imgInterceptor,
  "himalayan-450": imgHimalayan,
  "hunter-350": imgHunter,
  "ktm-390-duke": imgKtm390,
  "ktm-250-duke": imgKtm250,
  "honda-cb350": imgCb350,
  "pulsar-ns400z": imgNs400,
  "dominar-400": imgDominar,
  "xpulse-200": imgXpulse,
  "yamaha-r15": imgR15,
  "apache-rr310": imgRr310,
};

type Bike = ApiResponse<typeof api, "listBikes">["bikes"][number];
type Settings = ApiResponse<typeof api, "getSettings">;
type Account = { id: number; username: string; fullName: string; phone: string; email: string; contact: string };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const digits = (s: string) => s.replace(/[^0-9]/g, "");

function waLink(settings: Settings | undefined, bike?: Bike | null) {
  const raw = digits(settings?.whatsappNumber ?? "");
  if (!raw) return null;
  // WhatsApp needs the full international number: stored numbers may be
  // 10-digit Indian numbers, so prefix +91 the same way telLink does.
  const num = raw.length <= 10 ? `91${raw}` : raw;
  const text = bike
    ? `Hi KGN Premium Bikes, I'm interested in the ${bike.year} ${bike.brand} ${bike.modelName} listed at ${inr(bike.price)}. Is it available?`
    : "Hi KGN Premium Bikes, I'd like to know more about your bikes.";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
function telLink(settings: Settings | undefined) {
  const num = digits(settings?.callNumber || settings?.whatsappNumber || "");
  return num ? `tel:+${num.startsWith("91") ? num : "91" + num}` : null;
}

/* Brand logos for the showroom contact items — inline SVG so the real
   Phone / WhatsApp / Instagram marks render crisply at any size. */
function PhoneLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}
function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function MapPinLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

/* Reels taken from the shop's own Instagram page @kgn_premium_bikes
   (verified on the live page — see DATA-PLAN.md for provenance).
   Each label is what that reel actually shows. */
const INSTAGRAM_REELS: Array<{ url: string; label: string }> = [
  { url: "https://www.instagram.com/reel/DR_ROP5CYn1/", label: "Royal Enfield GT — 2025, ~5,000 km" },
  { url: "https://www.instagram.com/reel/DTHpV6xCTw2/", label: "Royal Enfield Classic — 2018 & 2020 models" },
  { url: "https://www.instagram.com/reel/DSrb5miCd1W/", label: "Classic 350 & Gixxer SF 155 — Christmas sale" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: "bg-[#1f9d55] text-white",
    RESERVED: "bg-[#e8760a] text-white",
    SOLD: "bg-[#3a3d42] text-white",
  };
  const label = status === "AVAILABLE" ? "Available" : status === "RESERVED" ? "Booked / Under Inspection" : "Sold";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-gray-500 text-white"}`}>{label}</span>;
}

/* A bike “has a reel” when the owner has pasted an Instagram reel link
   for it (reelUrl is non-empty — including the seeded reels sourced
   from @kgn_premium_bikes). Everywhere a bike is listed, this badge
   tells the customer at a glance that a reel is available to watch. */
function hasReel(bike: Bike): boolean {
  return !!(bike.reelUrl && bike.reelUrl.trim().length > 0);
}
function ReelBadge({ size = "md" }: { size?: "sm" | "md" }) {
  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm" title="Instagram reel available for this bike" aria-label="Reel available">
        <span aria-hidden="true">🎬</span> Reel
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }} title="Instagram reel available for this bike">
      <span aria-hidden="true" className="text-sm leading-none">🎬</span> Reel available
    </span>
  );
}

/* Labels for the owners' profile-change notes (Our Family history).
   Password values are never part of a note — only the fact of a change. */
const CHANGE_LABELS: Record<string, { icon: string; label: string }> = {
  SIGNUP: { icon: "🆕", label: "Joined KGN" },
  PASSWORD_SET: { icon: "🔑", label: "Password set" },
  PASSWORD_CHANGED: { icon: "🔒", label: "Password changed" },
  PROFILE_UPDATED: { icon: "✏️", label: "Profile updated" },
};
function changeLabel(t: string): { icon: string; label: string } {
  return CHANGE_LABELS[t] ?? { icon: "•", label: t.replace(/_/g, " ") };
}

function BikePhoto({ bike, className }: { bike: Bike; className?: string }) {
  // Owner-uploaded photos (gallery, in owner order 1,2,3…) win over the
  // built-in catalog photo. First photo is the cover everywhere.
  const firstGalleryUrl = (bike as unknown as { photos?: Array<{ url: string }> }).photos?.[0]?.url;
  const src = firstGalleryUrl || bike.imageUrl || IMAGES[bike.imageKey];
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-[#2a2c2e] text-center ${className ?? ""}`} role="img" aria-label={`${bike.brand} ${bike.modelName}`}>
        <span className="font-display px-3 text-lg font-bold text-[#f6f3ee]">{bike.brand} {bike.modelName}</span>
      </div>
    );
  }
  return <img src={src} alt={`${bike.year} ${bike.brand} ${bike.modelName} — ${bike.color}`} className={className} loading="lazy" />;
}

/* ---------------- Chat thread (shared: customer + admin) ---------------- */
function ChatThread({ enquiryId, as, onClose, ownerToken }: { enquiryId: number; as: "CUSTOMER" | "DEALER"; onClose: () => void; ownerToken?: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const msgs = useQuery({
    queryKey: ["messages", enquiryId],
    queryFn: () => api.listMessages({ enquiryId }),
    refetchInterval: 4000,
  });
  useEffect(() => {
    void api.markRead({ enquiryId, reader: as }).then(() => {
      void qc.invalidateQueries({ queryKey: ["myData"] });
      void qc.invalidateQueries({ queryKey: ["adminEnquiries"] });
    });
  }, [enquiryId, as, qc, msgs.data?.messages.length]);

  const send = useMutation({
    mutationFn: async () => api.sendMessage({ enquiryId, sender: as, text: draft, ownerToken: ownerToken ?? "" }),
    onSuccess: () => { setDraft(""); void qc.invalidateQueries({ queryKey: ["messages", enquiryId] }); },
  });
  const submit = (e: FormEvent) => { e.preventDefault(); if (draft.trim()) send.mutate(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 sm:items-center sm:px-4" role="dialog" aria-label="Chat thread">
      <div className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-[var(--surface)] sm:rounded-3xl lg:max-w-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="font-display text-base font-bold text-[var(--text)]">{as === "CUSTOMER" ? "Chat with KGN Premium Bikes" : "Customer chat"}</p>
            <p className="text-xs text-[var(--good)]">● Dealer online — replies during showroom hours</p>
          </div>
          <button type="button" aria-label="Close chat" onClick={onClose} className="rounded-full bg-[var(--bg)] px-3 py-1 text-lg font-bold text-[var(--text)]">✕</button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
          {msgs.isPending && <p className="text-sm text-[var(--dim)]">Loading messages…</p>}
          {msgs.data?.messages.length === 0 && <p className="text-sm text-[var(--dim)]">No messages yet — say hello and ask about price, finance or a test ride.</p>}
          {msgs.data?.messages.map((m) => {
            const mine = m.sender === as;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] text-[var(--text)]"}`}>
                  <p>{m.text}</p>
                  <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/80" : "text-[var(--dim)]"}`}>
                    {new Date(m.sentAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} {mine ? (m.isRead ? "· Seen ✓✓" : "· Sent ✓") : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-[var(--border)] p-3 pb-safe">
          <label htmlFor={`chat-input-${enquiryId}`} className="sr-only">Type a message</label>
          <input id={`chat-input-${enquiryId}`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text)]" />
          <button type="submit" disabled={send.isPending} className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Send</button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Bike detail ---------------- */
function BikeDetail({ bikeId, account, settings, onBack, onNeedAccount }: {
  bikeId: number; account: Account | null; settings: Settings | undefined;
  onBack: () => void; onNeedAccount: () => void;
}) {
  const qc = useQueryClient();
  const [chatId, setChatId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [galleryIdx, setGalleryIdx] = useState(0);
  const detail = useQuery({ queryKey: ["bike", bikeId], queryFn: () => api.getBike({ id: bikeId }) });
  const myData = useQuery({
    queryKey: ["myData", account?.id],
    queryFn: () => api.getMyData({ accountId: account!.id }),
    enabled: !!account,
  });
  const bike = detail.data?.bike ?? null;
  const saved = !!bike && (myData.data?.wishlistBikeIds.includes(bike.id) ?? false);

  const wish = useMutation({
    mutationFn: async () => api.toggleWishlist({ accountId: account!.id, bikeId: bike!.id }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["myData"] }); },
  });
  const enquire = useMutation({
    mutationFn: async (input: { channel: "CHAT" | "WHATSAPP" | "CALL" | "FORM"; message: string }) =>
      api.createEnquiry({
        bikeId: bike!.id, accountId: account?.id ?? null,
        customerName: account?.fullName ?? "Website visitor", customerPhone: account?.phone || account?.email || "",
        channel: input.channel, message: input.message,
      }),
    onSuccess: (r, vars) => {
      void qc.invalidateQueries({ queryKey: ["myData"] });
      void qc.invalidateQueries({ queryKey: ["adminEnquiries"] });
      if (vars.channel === "CHAT") setChatId(r.enquiryId);
      else setNotice(vars.channel === "WHATSAPP" ? "Enquiry logged — opening WhatsApp…" : vars.channel === "CALL" ? "Enquiry logged — opening your dialler…" : "Enquiry sent to the dealership.");
    },
  });

  if (detail.isPending) return <p className="px-4 py-10 text-center text-sm text-[var(--dim)]">Loading bike…</p>;
  if (!bike) return <div className="px-4 py-10 text-center"><p className="text-sm text-[var(--dim)]">This bike is no longer listed.</p><button type="button" onClick={onBack} className="mt-3 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-bold text-white">Back to catalog</button></div>;

  const wa = waLink(settings, bike);
  const tel = telLink(settings);
  const ytId = bike.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)?.[1];
  // reelUrl may hold one link, or several separated by commas / spaces /
  // new lines (e.g. two Classic reels sourced from the Instagram page).
  const reelItems = bike.reelUrl
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url) => {
      const m = url.match(/instagram\.com\/(reel|p|tv)\/([\w-]+)/);
      return m?.[1] && m?.[2] ? { url, embed: `https://www.instagram.com/${m[1]}/${m[2]}/embed/` } : null;
    })
    .filter((x): x is { url: string; embed: string } => x !== null);
  const otherReels = INSTAGRAM_REELS.filter((r) => !reelItems.some((i) => i.url === r.url));

  const startChat = () => {
    if (!account) { onNeedAccount(); return; }
    const existing = myData.data?.enquiries.find((e) => e.bikeId === bike.id && e.status !== "CLOSED");
    if (existing) { setChatId(existing.id); return; }
    enquire.mutate({ channel: "CHAT", message: `Hi, I'm interested in the ${bike.year} ${bike.brand} ${bike.modelName} listed at ${inr(bike.price)}.` });
  };

  const specs: Array<[string, string]> = [
    ["Engine", bike.engineType || "—"],
    ["Displacement", `${bike.displacementCc} cc`],
    ["Fuel tank", bike.fuelCapacityL ? `${bike.fuelCapacityL} L` : "—"],
    ["Transmission", bike.transmission || "—"],
    ["Mileage (claimed)", bike.mileageKmpl ? `${bike.mileageKmpl} km/l` : "—"],
    ["Odometer", bike.condition === "NEW" ? "New bike" : `${bike.odometerKm.toLocaleString("en-IN")} km`],
    ["Colour", bike.color || "—"],
    ["Registration", bike.registration || "—"],
    ["Condition", bike.condition === "NEW" ? "New" : "Pre-owned"],
  ];

  // Gallery: owner-uploaded photos in owner order (1,2,3…). If none,
  // fall back to the single cover / catalog photo.
  const galleryUrls: string[] = (() => {
    const photos = (bike as unknown as { photos?: Array<{ url: string }> }).photos ?? [];
    const urls = photos.map((p) => p.url).filter(Boolean);
    if (urls.length > 0) return urls;
    const single = bike.imageUrl || IMAGES[bike.imageKey];
    return single ? [single] : [];
  })();
  const safeGalleryIdx = Math.min(galleryIdx, Math.max(0, galleryUrls.length - 1));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-28">
      <button type="button" onClick={onBack} className="mt-3 text-sm font-bold text-[var(--accent)]">← All bikes</button>
      <div className="relative mt-3 overflow-hidden rounded-3xl">
        {galleryUrls.length > 0 ? (
          <img src={galleryUrls[safeGalleryIdx]} alt={`${bike.year} ${bike.brand} ${bike.modelName} — photo ${safeGalleryIdx + 1} of ${galleryUrls.length}`} className="aspect-[4/3] w-full object-cover min-[480px]:aspect-[16/10] lg:aspect-[16/8]" />
        ) : (
          <BikePhoto bike={bike} className="aspect-[4/3] w-full object-cover min-[480px]:aspect-[16/10] lg:aspect-[16/8]" />
        )}
        {hasReel(bike) && (
          <span className="absolute left-3 top-3"><ReelBadge /></span>
        )}
      </div>
      {galleryUrls.length > 1 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-[var(--dim)]">Photos ({galleryUrls.length}) — in the order set by the owner. Tap a photo to view it large.</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Bike photo gallery">
            {galleryUrls.map((url, i) => (
              <button key={`${url}-${i}`} type="button" onClick={() => setGalleryIdx(i)} aria-label={`View photo ${i + 1}`} aria-pressed={safeGalleryIdx === i} className={`relative shrink-0 overflow-hidden rounded-xl border-2 ${safeGalleryIdx === i ? "border-[var(--accent)]" : "border-transparent opacity-80"}`}>
                <img src={url} alt="" className="h-16 w-24 object-cover" loading="lazy" />
                <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{bike.brand} · {bike.year} · {bike.condition === "NEW" ? "New" : "Pre-owned"}</p>
          <h2 className="font-display mt-1 text-[1.65rem] font-extrabold leading-tight text-[var(--text)] min-[480px]:text-3xl lg:text-4xl">{bike.modelName}</h2>
          <p className="mt-1 text-sm text-[var(--dim)]">{bike.displacementCc} cc · {bike.color}{bike.condition === "PRE_OWNED" ? ` · ${bike.odometerKm.toLocaleString("en-IN")} km run` : ""} · {bike.views} views</p>
          {hasReel(bike) && (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><ReelBadge /> <span className="text-[var(--dim)]">Watch this bike in its Instagram reel — just below the specifications.</span></p>
          )}
        </div>
        <div className="text-left sm:text-right">
          <p className="font-display text-[1.65rem] font-extrabold text-[var(--text)] min-[480px]:text-3xl lg:text-4xl">{inr(bike.price)}</p>
          <p className="text-xs text-[var(--dim)]">Indicative ex-showroom — confirm at showroom</p>
          <div className="mt-2"><StatusBadge status={bike.status} /></div>
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-[var(--text)]">{bike.description}</p>

      {/* Order requested by the owner: Specifications FIRST, then the
          Reel section immediately next, so customers read the specs and
          then watch this bike's reel without hunting for either. */}
      <h3 className="font-display mt-6 text-lg font-bold text-[var(--text)]">Specifications</h3>
      <dl className="mt-2 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:grid lg:grid-cols-2 lg:gap-x-10">
        {specs.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-[var(--dim)]">{k}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-semibold text-[var(--text)]">{v}</dd>
          </div>
        ))}
      </dl>

      {reelItems.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display flex items-center gap-2 text-lg font-bold text-[var(--text)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}><InstagramLogo className="h-5 w-5" /></span>
            <span aria-hidden="true">🎬</span>
            {reelItems.length > 1 ? "See it in our Instagram reels" : "See it in our Instagram reel"}
          </h3>
          <p className="mt-1 text-sm text-[var(--dim)]">This bike has a reel — watch it in action, straight from @kgn_premium_bikes.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 sm:justify-start">
            {reelItems.map((item) => (
              <div key={item.url} className="w-full max-w-[320px] sm:max-w-sm">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[#2a2c2e]">
                  <iframe title={`Instagram reel — ${bike.brand} ${bike.modelName}`} src={item.embed} className="absolute inset-0 h-full w-full" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" loading="lazy" scrolling="no" />
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-[var(--accent)]">Watch on Instagram ↗</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reels from the shop's Instagram page — shown on every bike view,
          with this bike's own reel(s) embedded above when it has one. */}
      <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="font-display flex items-center gap-2 text-base font-bold text-[var(--text)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}><InstagramLogo className="h-5 w-5" /></span>
          {reelItems.length > 0 ? "More reels from @kgn_premium_bikes" : "Reels from @kgn_premium_bikes"}
        </h3>
        <p className="mt-1 text-sm text-[var(--dim)]">Latest bike reels straight from the showroom's Instagram page — tap one to watch it on Instagram.</p>
        <div className="mt-3 space-y-2">
          {(reelItems.length > 0 ? otherReels : INSTAGRAM_REELS).map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-[var(--bg)] px-3 py-2.5">
              <InstagramLogo className="h-5 w-5 shrink-0 text-[#c13584]" />
              <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--text)]">{r.label}</span>
              <span className="shrink-0 text-sm font-bold text-[var(--accent)]">Watch ↗</span>
            </a>
          ))}
        </div>
        <a href="https://www.instagram.com/kgn_premium_bikes/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold text-[var(--accent)]">Follow @kgn_premium_bikes on Instagram ↗</a>
      </div>

      {ytId && (
        <div className="mt-5">
          <h3 className="font-display text-lg font-bold text-[var(--text)]">Walkaround video</h3>
          <div className="mt-2 aspect-video w-full overflow-hidden rounded-2xl">
            <iframe title={`Walkaround video — ${bike.brand} ${bike.modelName}`} src={`https://www.youtube-nocookie.com/embed/${ytId}`} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {notice && <p role="status" className="mt-4 rounded-xl bg-[#e7f6ee] px-4 py-3 text-sm font-semibold text-[#146c3c] dark:bg-[#14301f] dark:text-[#7fe0a8]">{notice}</p>}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 pb-safe backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-1.5 px-2 py-3 sm:gap-2 sm:px-4 lg:px-6">
          <button type="button" aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => (account ? wish.mutate() : onNeedAccount())} className="rounded-full border border-[var(--border)] px-3 py-2.5 text-base sm:px-4" >{saved ? "♥" : "♡"}</button>
          <button type="button" onClick={startChat} disabled={enquire.isPending} className="flex-1 rounded-full bg-[var(--ink)] px-2 py-2.5 text-[13px] font-bold text-[var(--ink-text)] disabled:opacity-50 sm:px-3 sm:text-sm">💬 Chat on Site</button>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" onClick={() => { if (account) enquire.mutate({ channel: "WHATSAPP", message: "" }); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25d366] px-2 py-2.5 text-center text-[13px] font-bold text-white sm:px-3 sm:text-sm"><WhatsAppLogo className="h-4 w-4 shrink-0" />WhatsApp</a>
          ) : (
            <button type="button" onClick={() => setNotice("WhatsApp number is being set up by the showroom — please use Chat on Site or the enquiry form and we will call you back.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25d366] px-2 py-2.5 text-[13px] font-bold text-white sm:px-3 sm:text-sm"><WhatsAppLogo className="h-4 w-4 shrink-0" />WhatsApp</button>
          )}
          {tel ? (
            <a href={tel} onClick={() => { if (account) enquire.mutate({ channel: "CALL", message: "" }); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-2 py-2.5 text-center text-[13px] font-bold text-white sm:px-3 sm:text-sm"><PhoneLogo className="h-4 w-4 shrink-0" />Call</a>
          ) : (
            <button type="button" onClick={() => setNotice("Call number is being set up by the showroom — please use Chat on Site and we will call you back.")} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-2 py-2.5 text-[13px] font-bold text-white sm:px-3 sm:text-sm"><PhoneLogo className="h-4 w-4 shrink-0" />Call</button>
          )}
        </div>
      </div>
      {chatId !== null && <ChatThread enquiryId={chatId} as="CUSTOMER" onClose={() => setChatId(null)} />}
    </div>
  );
}

/* ---------------- Account / My KGN ---------------- */
type ProfileSection = "wishlist" | "chats" | "profile";
function AccountView({ account, bikes, onSignIn, onOpenBike, section, onSectionChange, onBrowseBikes, onSignOut }: {
  account: Account | null; bikes: Bike[]; onSignIn: (a: Account) => void; onOpenBike: (id: number) => void;
  section?: ProfileSection; onSectionChange?: (s: ProfileSection) => void; onBrowseBikes?: () => void; onSignOut?: () => void;
}) {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [usernameCheck, setUsernameCheck] = useState<{ state: "idle" | "checking" | "ok" | "bad"; message: string }>({ state: "idle", message: "" });
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [chatId, setChatId] = useState<number | null>(null);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [showChangePw, setShowChangePw] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [localSection, setLocalSection] = useState<ProfileSection>("wishlist");
  const activeSection: ProfileSection = section ?? localSection;
  const setActiveSection = (s: ProfileSection) => { if (onSectionChange) onSectionChange(s); else setLocalSection(s); };

  const myData = useQuery({
    queryKey: ["myData", account?.id],
    queryFn: () => api.getMyData({ accountId: account!.id }),
    enabled: !!account,
  });
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  // Live duplicate-username check while signing up: usernames must be
  // unique (case-insensitive), so as soon as the typed username is
  // taken the form says so and blocks sign-up — the server enforces
  // the same rule again on submit (registerAccount + UNIQUE column).
  useEffect(() => {
    const u = username.trim();
    if (mode !== "signup" || u.length < 3) { setUsernameCheck({ state: "idle", message: "" }); return; }
    setUsernameCheck((c) => ({ state: "checking", message: c.state === "bad" || c.state === "ok" ? c.message : "" }));
    const t = window.setTimeout(() => {
      void api.checkUsernameAvailable({ username: u }).then((r) => {
        setUsernameCheck({ state: r.available ? "ok" : "bad", message: r.message });
      }).catch(() => setUsernameCheck({ state: "idle", message: "" }));
    }, 450);
    return () => window.clearTimeout(t);
  }, [username, mode]);
  const register = useMutation({
    mutationFn: async () => api.registerAccount({ username, fullName, contact, password }),
    onSuccess: (r) => {
      setMsg(r.message);
      if (r.ok && r.account) { onSignIn(r.account); void qc.invalidateQueries({ queryKey: ["myData"] }); }
    },
    onError: () => setMsg("Something went wrong — check the details and try again. Passwords need at least 8 characters."),
  });
  const signInExisting = useMutation({
    mutationFn: async () => api.signInAccount({ identifier, password: signInPassword }),
    onSuccess: (r) => {
      setMsg(r.message);
      if (r.ok && r.account) { onSignIn(r.account); void qc.invalidateQueries({ queryKey: ["myData"] }); }
    },
    onError: () => setMsg("Something went wrong — check the details and try again."),
  });
  const changePw = useMutation({
    mutationFn: async () => api.changeAccountPassword({ accountId: account!.id, currentPassword: curPw, newPassword: newPw }),
    onSuccess: (r) => {
      setPwMsg(r.message);
      if (r.ok) { setCurPw(""); setNewPw(""); setConfirmNewPw(""); setShowChangePw(false); }
    },
    onError: () => setPwMsg("Could not change the password — the new password needs at least 8 characters."),
  });
  const editProfile = useMutation({
    mutationFn: async () => api.updateAccountProfile({ accountId: account!.id, fullName: editName, contact: editContact }),
    onSuccess: (r) => {
      setProfileMsg(r.message);
      if (r.ok && r.account) { onSignIn(r.account); setShowEditProfile(false); void qc.invalidateQueries({ queryKey: ["myData"] }); }
    },
    onError: () => setProfileMsg("Could not save — check the name and mobile number / Gmail and try again."),
  });
  const wish = useMutation({
    mutationFn: async (bikeId: number) => api.toggleWishlist({ accountId: account!.id, bikeId }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["myData"] }); },
  });

  if (!account) {
    const inputCls = "mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]";
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8">
        <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">{mode === "signup" ? "Create your account" : "Welcome back — sign in"}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">
          {mode === "signup"
            ? "Sign up once with a username, your mobile number or Gmail, and a password. Your account is saved with KGN — not just on this phone — so from next time you can sign in from anywhere with your username, mobile number or Gmail, plus your password."
            : "Your account lives with KGN, not on one device. Enter your username, mobile number or Gmail and your password — from any phone or computer — and your wishlist and enquiries will be right here."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Sign up or sign in">
          <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setMsg(""); }} className={`rounded-full py-2.5 text-sm font-bold ${mode === "signup" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "border border-[var(--border)] text-[var(--text)]"}`}>Sign up</button>
          <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => { setMode("signin"); setMsg(""); }} className={`rounded-full py-2.5 text-sm font-bold ${mode === "signin" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "border border-[var(--border)] text-[var(--text)]"}`}>Sign in</button>
        </div>
        {mode === "signup" ? (
          <form className="mt-5 space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (usernameCheck.state === "bad") { setMsg(usernameCheck.message + " Duplicate usernames are not accepted — please pick a different username."); return; }
            if (password !== confirmPassword) { setMsg("The two passwords don't match — please re-enter them."); return; }
            setMsg("");
            register.mutate();
          }}>
            <div>
              <label htmlFor="reg-username" className="text-sm font-semibold text-[var(--text)]">Username</label>
              <input id="reg-username" required minLength={3} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. william_rides" className={inputCls} aria-invalid={usernameCheck.state === "bad"} aria-describedby="reg-username-status" />
              {usernameCheck.state === "bad" || usernameCheck.state === "ok" ? (
                <p id="reg-username-status" role="status" className={`mt-1 text-xs font-bold ${usernameCheck.state === "bad" ? "text-[#b3261e] dark:text-[#ff9d97]" : "text-[#146c3c] dark:text-[#7fe0a8]"}`}>{usernameCheck.message}</p>
              ) : (
                <p id="reg-username-status" className="mt-1 text-xs text-[var(--dim)]">Pick a unique username — duplicates are not accepted, and you'll use it to sign in.{usernameCheck.state === "checking" ? " Checking…" : ""}</p>
              )}
            </div>
            <div>
              <label htmlFor="reg-name" className="text-sm font-semibold text-[var(--text)]">Full name</label>
              <input id="reg-name" required minLength={2} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
            </div>
            <div>
              <label htmlFor="reg-contact" className="text-sm font-semibold text-[var(--text)]">Mobile number or Gmail</label>
              <input id="reg-contact" required minLength={5} autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="10-digit mobile number or your@gmail.com" className={inputCls} />
              <p className="mt-1 text-xs text-[var(--dim)]">Give either one — your mobile number or your Gmail. You can sign in with it from anywhere.</p>
            </div>
            <div>
              <label htmlFor="reg-password" className="text-sm font-semibold text-[var(--text)]">Password</label>
              <input id="reg-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputCls} />
            </div>
            <div>
              <label htmlFor="reg-confirm" className="text-sm font-semibold text-[var(--text)]">Confirm password</label>
              <input id="reg-confirm" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Type the password again" className={inputCls} />
            </div>
            <button type="submit" disabled={register.isPending || usernameCheck.state === "bad"} className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white disabled:opacity-50">Sign up</button>
            {msg && <p role="status" className="text-sm font-semibold text-[var(--text)]">{msg}</p>}
          </form>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); signInExisting.mutate(); }}>
            <div>
              <label htmlFor="signin-id" className="text-sm font-semibold text-[var(--text)]">Username, mobile number or Gmail</label>
              <input id="signin-id" required minLength={3} autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Your username, mobile number or Gmail" className={inputCls} />
            </div>
            <div>
              <label htmlFor="signin-password" className="text-sm font-semibold text-[var(--text)]">Password</label>
              <input id="signin-password" type="password" required autoComplete="current-password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} placeholder="Your password" className={inputCls} />
            </div>
            <button type="submit" disabled={signInExisting.isPending} className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white disabled:opacity-50">Sign in</button>
            {msg && <p role="status" className="text-sm font-semibold text-[var(--text)]">{msg}</p>}
            <p className="text-xs text-[var(--dim)]">No account yet? Switch to <button type="button" onClick={() => { setMode("signup"); setMsg(""); }} className="font-bold text-[var(--accent)] underline">Sign up</button> — it takes a few seconds.</p>
            <p className="text-xs text-[var(--dim)]">Signed up before passwords were added? Use Sign up once with the same username and mobile number to set your password — your wishlist and enquiries stay as they are.</p>
          </form>
        )}
      </div>
    );
  }

  const savedBikes = bikes.filter((b) => myData.data?.wishlistBikeIds.includes(b.id));
  const enquiries = myData.data?.enquiries ?? [];
  const unreadTotalProfile = enquiries.reduce((s, e) => s + e.unread, 0);
  const initials = (account.fullName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "K").slice(0, 2);
  const contactValue = account.contact || account.email || account.phone || "";
  const contactIsEmail = contactValue.includes("@");
  const firstName = account.fullName.split(" ")[0] ?? account.fullName;
  const selectSection = (s: ProfileSection) => { setActiveSection(s); if (s !== "profile") { setShowChangePw(false); } };
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-10">
      {/* Profile header — a proper profile card, not just a greeting line */}
      <section aria-label="Your profile" className="overflow-hidden rounded-3xl bg-[var(--ink)] text-[var(--ink-text)]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div aria-hidden="true" className="font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-extrabold text-white shadow-lg sm:h-[72px] sm:w-[72px] sm:text-[28px]">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#ffb066]">My KGN · Your profile</p>
              <h2 className="font-display mt-0.5 truncate text-2xl font-extrabold leading-tight sm:text-3xl">Hi, {firstName}</h2>
              <p className="mt-0.5 truncate text-sm text-[#c9cdd4]">{account.fullName} · @{account.username}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">{contactIsEmail ? "✉️" : "📱"} {contactValue || "No contact saved"}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">{contactIsEmail ? "Signed in with Gmail" : "Signed in with mobile number"}</span>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2.5" aria-label="Your activity at a glance">
            <button type="button" onClick={() => selectSection("wishlist")} className="rounded-2xl bg-white/10 px-3 py-3 text-left transition hover:bg-white/15" aria-label={`My wishlist, ${savedBikes.length} saved bikes`}>
              <span className="font-display block text-xl font-extrabold leading-none text-white">{savedBikes.length}</span>
              <span className="mt-1 block text-xs font-semibold text-[#c9cdd4]">♥ Saved bikes</span>
            </button>
            <button type="button" onClick={() => selectSection("chats")} className="relative rounded-2xl bg-white/10 px-3 py-3 text-left transition hover:bg-white/15" aria-label={`My chats, ${enquiries.length} conversations`}>
              <span className="font-display block text-xl font-extrabold leading-none text-white">{enquiries.length}</span>
              <span className="mt-1 block text-xs font-semibold text-[#c9cdd4]">💬 My chats</span>
              {unreadTotalProfile > 0 && <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold text-white">{unreadTotalProfile} new</span>}
            </button>
            <button type="button" onClick={() => selectSection("profile")} className="rounded-2xl bg-white/10 px-3 py-3 text-left transition hover:bg-white/15" aria-label="Profile and security settings">
              <span className="font-display block text-xl font-extrabold leading-none text-white">⚙️</span>
              <span className="mt-1 block text-xs font-semibold text-[#c9cdd4]">Profile &amp; security</span>
            </button>
          </div>
        </div>
      </section>

      {/* Profile section tabs — Wishlist / My Chats / Profile */}
      <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2" role="tablist" aria-label="My KGN sections">
        <button type="button" role="tab" aria-selected={activeSection === "wishlist"} aria-controls="profile-panel-wishlist" id="profile-tab-wishlist" onClick={() => selectSection("wishlist")} className={`rounded-full px-3 py-2.5 text-sm font-bold ${activeSection === "wishlist" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>♥ Wishlist{savedBikes.length ? ` (${savedBikes.length})` : ""}</button>
        <button type="button" role="tab" aria-selected={activeSection === "chats"} aria-controls="profile-panel-chats" id="profile-tab-chats" onClick={() => selectSection("chats")} className={`relative rounded-full px-3 py-2.5 text-sm font-bold ${activeSection === "chats" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>💬 My chats{enquiries.length ? ` (${enquiries.length})` : ""}{unreadTotalProfile > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadTotalProfile}</span>}</button>
        <button type="button" role="tab" aria-selected={activeSection === "profile"} aria-controls="profile-panel-profile" id="profile-tab-profile" onClick={() => selectSection("profile")} className={`rounded-full px-3 py-2.5 text-sm font-bold ${activeSection === "profile" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>👤 Profile</button>
      </div>

      {activeSection === "wishlist" && (
        <section id="profile-panel-wishlist" role="tabpanel" aria-labelledby="profile-tab-wishlist" className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--text)]">My wishlist</h3>
              <p className="mt-0.5 text-sm text-[var(--dim)]">Bikes you saved with the heart — tap any bike to see photos, specs and its reel.</p>
            </div>
            {onBrowseBikes && <button type="button" onClick={onBrowseBikes} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Browse bikes →</button>}
          </div>
          {savedBikes.length === 0 && (
            <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center">
              <p className="text-2xl" aria-hidden="true">♥</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">No saved bikes yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--dim)]">Tap the heart on any bike in the catalog to keep it here for quick access.</p>
              {onBrowseBikes && <button type="button" onClick={onBrowseBikes} className="mt-3 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">Browse bikes</button>}
            </div>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {savedBikes.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <button type="button" onClick={() => onOpenBike(b.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <BikePhoto bike={b} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--text)]">{b.year} {b.brand} {b.modelName}</span>
                    <span className="mt-0.5 block text-xs text-[var(--dim)]">{b.displacementCc} cc · {b.condition === "NEW" ? "New" : "Pre-owned"}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-[var(--accent)]">{inr(b.price)}</span>{hasReel(b) && <ReelBadge size="sm" />}</span>
                  </span>
                </button>
                <button type="button" aria-label={`Remove ${b.modelName} from wishlist`} onClick={() => wish.mutate(b.id)} className="shrink-0 rounded-full bg-[var(--bg)] px-3 py-2 text-sm font-bold text-[var(--text)]">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === "chats" && (
        <section id="profile-panel-chats" role="tabpanel" aria-labelledby="profile-tab-chats" className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--text)]">My chats</h3>
              <p className="mt-0.5 text-sm text-[var(--dim)]">All your conversations with the KGN showroom in one place. Tap a chat to continue it.</p>
            </div>
            {onBrowseBikes && <button type="button" onClick={onBrowseBikes} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Start a new chat →</button>}
          </div>
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-sm leading-relaxed text-[var(--dim)]"><span className="font-bold text-[var(--text)]">How to start a chat:</span> open any bike and tap <span className="font-bold text-[var(--text)]">💬 Chat on Site</span>. Your conversation for that bike will appear here under My chats, and replies from the showroom show with a “new” badge.</p>
          </div>
          {enquiries.length === 0 && (
            <div className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center">
              <p className="text-2xl" aria-hidden="true">💬</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">No chats yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--dim)]">You haven&apos;t chatted about a bike yet. Open any bike and tap Chat on Site, WhatsApp or Call — it will be saved here.</p>
              {onBrowseBikes && <button type="button" onClick={onBrowseBikes} className="mt-3 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">Browse bikes to chat</button>}
            </div>
          )}
          <div className="mt-3 space-y-2.5">
            {enquiries.map((e) => (
              <div key={e.id} className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-lg">💬</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--text)]">{e.bikeLabel}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--dim)]">via {e.channel} · {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · Status: {e.status.replace("_", " ")}</span>
                  {e.unread > 0 && <span className="mt-1 inline-block rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[11px] font-bold text-white">{e.unread} new {e.unread === 1 ? "reply" : "replies"} from showroom</span>}
                </span>
                <button type="button" onClick={() => setChatId(e.id)} aria-label={`Open chat about ${e.bikeLabel}`} className="shrink-0 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-bold text-[var(--ink-text)]">Open chat →</button>
              </div>
            ))}
          </div>
          {enquiries.length > 0 && <p className="mt-3 text-xs text-[var(--dim)]">Chats stay linked to your account, so you can pick them up from any phone or computer when you sign in.</p>}
        </section>
      )}

      {activeSection === "profile" && (
        <section id="profile-panel-profile" role="tabpanel" aria-labelledby="profile-tab-profile" className="mt-6 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-4 py-3.5">
              <h3 className="font-display text-base font-bold text-[var(--text)]">Profile details</h3>
              <p className="mt-0.5 text-sm text-[var(--dim)]">The details you signed up with at KGN Premium Bikes.</p>
            </div>
            <dl className="divide-y divide-[var(--border)]">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5"><dt className="text-sm text-[var(--dim)]">Full name</dt><dd className="text-right text-sm font-bold text-[var(--text)]">{account.fullName}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5"><dt className="text-sm text-[var(--dim)]">Username</dt><dd className="text-right text-sm font-bold text-[var(--text)]">@{account.username}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5"><dt className="text-sm text-[var(--dim)]">{contactIsEmail ? "Gmail" : "Mobile number"}</dt><dd className="text-right text-sm font-bold text-[var(--text)]">{contactValue || "—"}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5"><dt className="text-sm text-[var(--dim)]">Sign-in</dt><dd className="text-right text-sm font-semibold text-[var(--text)]">Username / {contactIsEmail ? "Gmail" : "mobile"} + password, from anywhere</dd></div>
            </dl>
            <div className="border-t border-[var(--border)] px-4 py-3.5">
              {!showEditProfile ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--dim)]">Name or contact changed? Update them here — your username stays the same.</p>
                  <button type="button" onClick={() => { setEditName(account.fullName); setEditContact(contactValue); setProfileMsg(""); setShowEditProfile(true); }} aria-expanded={false} aria-controls="edit-profile-form" className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-[var(--ink-text)]">Edit profile</button>
                </div>
              ) : (
                <form id="edit-profile-form" className="max-w-md space-y-3" onSubmit={(e) => { e.preventDefault(); editProfile.mutate(); }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[var(--text)]">Edit your profile</p>
                    <button type="button" onClick={() => setShowEditProfile(false)} aria-expanded={true} aria-controls="edit-profile-form" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Cancel</button>
                  </div>
                  <div>
                    <label htmlFor="edit-fullname" className="text-sm font-semibold text-[var(--text)]">Full name</label>
                    <input id="edit-fullname" required minLength={2} autoComplete="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
                  </div>
                  <div>
                    <label htmlFor="edit-contact" className="text-sm font-semibold text-[var(--text)]">Mobile number or Gmail</label>
                    <input id="edit-contact" required minLength={5} value={editContact} onChange={(e) => setEditContact(e.target.value)} placeholder="10-digit mobile number or your@gmail.com" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
                    <p className="mt-1 text-xs text-[var(--dim)]">Your username (@{account.username}) never changes, so your sign-in stays the same. A mobile number / Gmail already used by another account can't be taken.</p>
                  </div>
                  <button type="submit" disabled={editProfile.isPending} className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">{editProfile.isPending ? "Saving…" : "Save profile changes"}</button>
                </form>
              )}
              {profileMsg && <p role="status" className="mt-3 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text)]">{profileMsg}</p>}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-[var(--text)]">Password &amp; security</h3>
                <p className="mt-0.5 text-sm text-[var(--dim)]">Your password is stored securely and never shown. Change it only if you need to.</p>
              </div>
              <span aria-hidden="true" className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-sm font-bold tracking-widest text-[var(--dim)]">••••••••</span>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3.5">
              {!showChangePw ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--dim)]">Tap Change password to update your password.</p>
                  <button type="button" onClick={() => { setPwMsg(""); setShowChangePw(true); }} aria-expanded={false} aria-controls="change-password-form" className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-[var(--ink-text)]">Change password</button>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[var(--text)]">Change your password</p>
                    <button type="button" onClick={() => { setShowChangePw(false); setCurPw(""); setNewPw(""); setConfirmNewPw(""); }} aria-expanded={true} aria-controls="change-password-form" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Cancel</button>
                  </div>
                  <form id="change-password-form" className="mt-3 max-w-md space-y-3" onSubmit={(e) => { e.preventDefault(); if (newPw !== confirmNewPw) { setPwMsg("The new passwords don't match — please re-enter them."); return; } changePw.mutate(); }}>
                    <div>
                      <label htmlFor="cust-pw-current" className="text-sm font-semibold text-[var(--text)]">Current password</label>
                      <input id="cust-pw-current" type="password" autoComplete="current-password" required value={curPw} onChange={(e) => setCurPw(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
                    </div>
                    <div>
                      <label htmlFor="cust-pw-new" className="text-sm font-semibold text-[var(--text)]">New password (at least 8 characters)</label>
                      <input id="cust-pw-new" type="password" autoComplete="new-password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
                    </div>
                    <div>
                      <label htmlFor="cust-pw-confirm" className="text-sm font-semibold text-[var(--text)]">Confirm new password</label>
                      <input id="cust-pw-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmNewPw} onChange={(e) => setConfirmNewPw(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="submit" disabled={changePw.isPending} className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">{changePw.isPending ? "Saving…" : "Save new password"}</button>
                      <button type="button" onClick={() => { setShowChangePw(false); setCurPw(""); setNewPw(""); setConfirmNewPw(""); }} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]">Cancel</button>
                    </div>
                  </form>
                </div>
              )}
              {pwMsg && <p role="status" className="mt-3 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text)]">{pwMsg}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onBrowseBikes && <button type="button" onClick={onBrowseBikes} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]">Browse bikes</button>}
            <button type="button" onClick={() => selectSection("chats")} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]">💬 Go to My chats</button>
            {onSignOut && <button type="button" onClick={onSignOut} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]">Sign out</button>}
          </div>
        </section>
      )}
      {chatId !== null && <ChatThread enquiryId={chatId} as="CUSTOMER" onClose={() => setChatId(null)} />}
    </div>
  );
}

/* ---------------- Owner login (hidden route only) ----------------
   This screen is never linked or shown anywhere on the customer side.
   It renders only when the address carries the hidden owner hash, the
   way large sites keep a separate staff/owner sign-in off the public
   pages. Owners sign in with their Gmail + password. */
function OwnerLogin({ onLogin, onBack }: { onLogin: (token: string, email: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const login = useMutation({
    mutationFn: async () => api.ownerLogin({ email, password }),
    onSuccess: (r) => {
      if (r.ok && r.token) onLogin(r.token, r.email);
      else setErr(r.message || "That Gmail or password isn't right for an owner account. Please try again.");
    },
    onError: () => setErr("Could not sign in just now — please try again."),
  });
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <p className="text-4xl" aria-hidden="true">🔒</p>
      <h2 className="font-display mt-3 text-2xl font-extrabold text-[var(--text)]">Owner sign in</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--dim)]">
        This is the separate owner dashboard for KGN Premium Bikes — inventory, leads, metrics,
        showroom settings and owner accounts. Sign in with your owner Gmail and password.
        Customers use the Bikes and My KGN pages, which owners can use too, just like any customer.
      </p>
      <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); setErr(""); login.mutate(); }}>
        <div>
          <label htmlFor="owner-email" className="text-sm font-semibold text-[var(--text)]">Owner Gmail</label>
          <input id="owner-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@gmail.com" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-base text-[var(--text)]" />
        </div>
        <div>
          <label htmlFor="owner-password" className="text-sm font-semibold text-[var(--text)]">Password</label>
          <input id="owner-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your owner password" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-base text-[var(--text)]" />
        </div>
        {err && <p role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#b3261e] dark:bg-[#3a1a18] dark:text-[#ff9d97]">{err}</p>}
        <button type="submit" disabled={login.isPending || !email || !password} className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white disabled:opacity-50">{login.isPending ? "Signing in…" : "Sign in to owner dashboard"}</button>
      </form>
      <p className="mt-3 text-xs leading-relaxed text-[var(--dim)]">Too many wrong passwords locks that Gmail's owner login for 15 minutes. More owners can be added from inside the dashboard — each owner is one Gmail + password pair.</p>
      <p className="mt-2 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-xs leading-relaxed text-[var(--dim)]">Staying signed in: once you sign in on this device, you stay signed in for 30 days — leaving the app idle, closing it, or restarting your phone does not sign you out. Opening the dashboard again extends it by another 30 days. It only ends when you tap <span className="font-bold text-[var(--text)]">Sign out</span> in the dashboard, or after 30 days without opening it.</p>
      <button type="button" onClick={onBack} className="mt-4 text-sm font-bold text-[var(--accent)]">← Back to bikes</button>
    </div>
  );
}

/* ---------------- Admin / Owner portal ---------------- */
type GalleryPhoto = { blobKey: string; url: string };
const EMPTY_BIKE = {
  brand: "", modelName: "", year: 2025, price: 0, displacementCc: 0, odometerKm: 0,
  condition: "NEW" as "NEW" | "PRE_OWNED", status: "AVAILABLE" as "AVAILABLE" | "RESERVED" | "SOLD",
  isFeatured: false, color: "", fuelCapacityL: 0, transmission: "", mileageKmpl: 0,
  engineType: "", registration: "", description: "", imageKey: "", imageBlobKey: "", imageUrl: "", videoUrl: "", reelUrl: "",
  photos: [] as GalleryPhoto[],
};

function AdminView({ bikes, settings, ownerToken, ownerEmail, onLock }: { bikes: Bike[]; settings: Settings | undefined; ownerToken: string; ownerEmail: string; onLock: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"metrics" | "inventory" | "leads" | "family" | "settings" | "owners">("metrics");
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [editing, setEditing] = useState<(typeof EMPTY_BIKE & { id: number | null }) | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [leadEdits, setLeadEdits] = useState<Record<number, { status: string; temperature: string; note: string; followUpAt: string }>>({});
  const [wa, setWa] = useState<string | null>(null);
  const [wa2, setWa2] = useState<string | null>(null);
  const [call, setCall] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [addr, setAddr] = useState<string | null>(null);
  const [hours, setHours] = useState<string | null>(null);
  const [ig, setIg] = useState<string | null>(null);
  const [igF, setIgF] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerPw, setNewOwnerPw] = useState("");
  const [ownerMsg, setOwnerMsg] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const admin = useQuery({ queryKey: ["adminEnquiries"], queryFn: () => api.adminListEnquiries({ ownerToken }) });
  const ownersQ = useQuery({ queryKey: ["ownersList"], queryFn: () => api.ownerListOwners({ ownerToken }) });
  const familyQ = useQuery({ queryKey: ["familyList"], queryFn: () => api.ownerListFamily({ ownerToken }) });
  const [familyOpenId, setFamilyOpenId] = useState<number | null>(null);
  const [familySearch, setFamilySearch] = useState("");
  const m = admin.data?.metrics;

  const upsert = useMutation({
    mutationFn: async () => {
      const e = editing!;
      const keys = e.photos.map((p) => p.blobKey).filter(Boolean);
      return api.adminUpsertBike({
        id: e.id, brand: e.brand, modelName: e.modelName, year: e.year, price: e.price,
        displacementCc: e.displacementCc, odometerKm: e.odometerKm, condition: e.condition, status: e.status,
        isFeatured: e.isFeatured, color: e.color, fuelCapacityL: e.fuelCapacityL, transmission: e.transmission,
        mileageKmpl: e.mileageKmpl, engineType: e.engineType, registration: e.registration, description: e.description,
        imageKey: e.imageKey, imageBlobKey: keys[0] ?? "", photoBlobKeys: keys, videoUrl: e.videoUrl, reelUrl: e.reelUrl, ownerToken,
      });
    },
    onSuccess: () => { setEditing(null); setPhotoMsg(""); setDragIdx(null); void qc.invalidateQueries({ queryKey: ["bikes"] }); void qc.invalidateQueries({ queryKey: ["adminEnquiries"] }); },
  });
  const isUploading = uploadingCount > 0;
  // Upload many photos: owner can pick multiple from gallery/disk at once.
  // Each file uploads via the existing owner-only upload action and is
  // appended in the order picked, so the gallery order starts as 1,2,3…
  const uploadOne = async (file: File): Promise<GalleryPhoto | null> => {
    const { dataBase64, mimeType } = await fileToBase64(file);
    const r = await api.uploadBikePhoto({ ownerToken, dataBase64, mimeType });
    if (!r.ok) return null;
    return { blobKey: r.blobKey, url: r.url };
  };
  const onPickPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0 || !editing) return;
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) { setPhotoMsg("Those files aren't photos — please pick images from your gallery or files."); return; }
    if (images.length < files.length) setPhotoMsg("Some files were skipped because they weren't photos.");
    setUploadingCount(images.length);
    setPhotoMsg(`Uploading ${images.length} photo${images.length > 1 ? "s" : ""}… please wait, don't save yet.`);
    const added: GalleryPhoto[] = [];
    for (const f of images) {
      try {
        const p = await uploadOne(f);
        if (p) added.push(p);
      } catch { /* skip failed file, keep going */ }
      setUploadingCount((c) => Math.max(0, c - 1));
    }
    if (added.length > 0) {
      setEditing((cur) => {
        if (!cur) return cur;
        const nextPhotos = [...cur.photos, ...added];
        return { ...cur, photos: nextPhotos, imageBlobKey: nextPhotos[0]?.blobKey ?? "", imageUrl: nextPhotos[0]?.url ?? "" };
      });
      setPhotoMsg(`${added.length} photo${added.length > 1 ? "s" : ""} uploaded — now in order ${editing.photos.length + 1} onwards. Drag or use ← → to change order 1, 2, 3, 4…, then Save / Publish.`);
    } else {
      setPhotoMsg("Upload failed — please pick the photos again. JPG or PNG under 10 MB each works best.");
    }
    setUploadingCount(0);
  };
  const movePhoto = (from: number, to: number) => {
    if (!editing) return;
    if (to < 0 || to >= editing.photos.length || from === to) return;
    const next = [...editing.photos];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setEditing({ ...editing, photos: next, imageBlobKey: next[0]?.blobKey ?? "", imageUrl: next[0]?.url ?? "" });
  };
  const swapPhoto = (a: number, b: number) => {
    if (!editing) return;
    if (a === b || a < 0 || b < 0 || a >= editing.photos.length || b >= editing.photos.length) return;
    const next = [...editing.photos];
    const tmp = next[a]; const other = next[b];
    if (!tmp || !other) return;
    next[a] = other; next[b] = tmp;
    setEditing({ ...editing, photos: next, imageBlobKey: next[0]?.blobKey ?? "", imageUrl: next[0]?.url ?? "" });
  };
  const removePhoto = (idx: number) => {
    if (!editing) return;
    const next = editing.photos.filter((_, i) => i !== idx);
    setEditing({ ...editing, photos: next, imageBlobKey: next[0]?.blobKey ?? "", imageUrl: next[0]?.url ?? "" });
    setPhotoMsg(next.length === 0 ? "All uploaded photos removed — the catalog photo (if any) will show again when you save." : "Photo removed. Remaining photos renumbered 1, 2, 3…");
  };
  const del = useMutation({
    mutationFn: async (id: number) => api.adminDeleteBike({ id, ownerToken }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["bikes"] }); },
  });
  const updLead = useMutation({
    mutationFn: async (id: number) => {
      const e = leadEdits[id];
      if (!e) return { ok: true as const };
      return api.adminUpdateEnquiry({ id, status: e.status as "NEW" | "IN_PROGRESS" | "CLOSED", temperature: e.temperature as "HOT" | "WARM" | "COLD", note: e.note, followUpAt: e.followUpAt, ownerToken });
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["adminEnquiries"] }); setSavedMsg("Lead updated."); },
  });
  const saveSettings = useMutation({
    mutationFn: async () => api.saveSettings({
      whatsappNumber: wa ?? settings?.whatsappNumber ?? "", whatsappNumber2: wa2 ?? settings?.whatsappNumber2 ?? "", callNumber: call ?? settings?.callNumber ?? "",
      showroomCity: city ?? settings?.showroomCity ?? "", address: addr ?? settings?.address ?? "", hours: hours ?? settings?.hours ?? "",
      instagramHandle: ig ?? settings?.instagramHandle ?? "", instagramFollowers: igF ?? settings?.instagramFollowers ?? "", ownerToken,
    }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["settings"] }); setSavedMsg("Showroom settings saved — WhatsApp & Call buttons now use these numbers."); },
  });
  const changePw = useMutation({
    mutationFn: async () => api.ownerChangePassword({ ownerToken, currentPassword: curPw, newPassword: newPw }),
    onSuccess: (r) => {
      setPwMsg(r.message);
      if (r.ok) { setCurPw(""); setNewPw(""); }
    },
    onError: () => setPwMsg("Could not change the password — the new password needs at least 8 characters."),
  });
  const addOwner = useMutation({
    mutationFn: async () => api.ownerAddOwner({ ownerToken, email: newOwnerEmail, password: newOwnerPw }),
    onSuccess: (r) => {
      setOwnerMsg(r.message);
      if (r.ok) { setNewOwnerEmail(""); setNewOwnerPw(""); void qc.invalidateQueries({ queryKey: ["ownersList"] }); }
    },
    onError: () => setOwnerMsg("Could not add that owner — check the Gmail and use a password of at least 8 characters."),
  });
  const removeOwner = useMutation({
    mutationFn: async (email: string) => api.ownerRemoveOwner({ ownerToken, email }),
    onSuccess: (r) => { setOwnerMsg(r.message); setConfirmRemove(null); void qc.invalidateQueries({ queryKey: ["ownersList"] }); },
    onError: () => setOwnerMsg("Could not remove that owner — please try again."),
  });

  const exportCsv = () => {
    const rows = admin.data?.enquiries ?? [];
    const csv = ["Name,Phone,Bike,Channel,Status,Lead,Date", ...rows.map((e) => [e.customerName, e.customerPhone, e.bikeLabel, e.channel, e.status, e.temperature, new Date(e.createdAt).toLocaleDateString("en-IN")].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "kgn-leads.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const templates = ["Hi! Yes, this bike is available. Would you like to book a test ride today?", "We can offer finance with low down-payment. Shall I share the EMI options?", "The final on-road price includes registration & insurance. Visiting the showroom this week?", "Thanks for your interest — this unit is now reserved for you for 24 hours."];

  const numField = (label: string, key: "year" | "price" | "displacementCc" | "odometerKm" | "fuelCapacityL" | "mileageKmpl") => (
    <div>
      <label htmlFor={`bike-${key}`} className="text-xs font-semibold text-[var(--dim)]">{label}</label>
      <input id={`bike-${key}`} type="number" value={editing![key]} onChange={(e) => setEditing({ ...editing!, [key]: Number(e.target.value) })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm text-[var(--text)]" />
    </div>
  );
  const txtField = (label: string, key: "brand" | "modelName" | "color" | "transmission" | "engineType" | "registration" | "imageKey" | "videoUrl" | "reelUrl") => (
    <div>
      <label htmlFor={`bike-${key}`} className="text-xs font-semibold text-[var(--dim)]">{label}</label>
      <input id={`bike-${key}`} value={editing![key]} onChange={(e) => setEditing({ ...editing!, [key]: e.target.value })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm text-[var(--text)]" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">Owner Dashboard</h2>
          <p className="text-sm text-[var(--dim)]">Signed in as owner {ownerEmail}. Inventory, lead pipeline, showroom settings and owner accounts for KGN Premium Bikes — separate from the customer pages, which you can also use like any customer.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--dim)]">You stay signed in on this device for 30 days — idle time, closing the app or restarting your phone won't sign you out, and each visit extends it. Sign out only when you want to leave this device.</p>
        </div>
        <button type="button" onClick={onLock} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Sign out</button>
      </div>
      {admin.isError && (
        <p role="alert" className="mt-3 rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#b3261e] dark:bg-[#3a1a18] dark:text-[#ff9d97]">
          Owner session could not be verified (it may have expired). <button type="button" onClick={onLock} className="font-bold underline">Sign out and sign in again</button> with your owner Gmail and password.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
        {(["metrics", "inventory", "leads", "family", "settings", "owners"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? "bg-[var(--ink)] text-[var(--ink-text)]" : "border border-[var(--border)] text-[var(--text)]"}`}>{t === "leads" ? `Leads${m && m.newLeads ? ` (${m.newLeads} new)` : ""}` : t === "family" ? "👨‍👩‍👧 Our Family" : t}</button>
        ))}
      </div>
      {savedMsg && <p role="status" className="mt-3 rounded-xl bg-[#e7f6ee] px-4 py-2.5 text-sm font-semibold text-[#146c3c] dark:bg-[#14301f] dark:text-[#7fe0a8]">{savedMsg}</p>}

      {tab === "metrics" && (
        <div className="mt-5">
          {admin.isPending && <p className="text-sm text-[var(--dim)]">Loading metrics…</p>}
          {m && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Total listings", m.totalListings], ["Available now", m.available], ["Bikes sold", m.sold],
                  ["Total bike views", m.totalViews], ["Active leads", m.activeLeads], ["New leads", m.newLeads],
                  ["Closed leads", m.closedLeads], ["Lead close rate", `${m.conversionPct}%`],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="font-display text-3xl font-extrabold text-[var(--text)]">{v}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--dim)]">{k}</p>
                  </div>
                ))}
              </div>
              <h3 className="font-display mt-6 text-lg font-bold text-[var(--text)]">Most viewed bikes</h3>
              <div className="mt-2 space-y-1.5">
                {[...bikes].sort((a, b) => b.views - a.views).slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm">
                    <span className="font-semibold text-[var(--text)]">{b.brand} {b.modelName}</span>
                    <span className="text-[var(--dim)]">{b.views} views · {inr(b.price)}</span>
                  </div>
                ))}
                {bikes.length === 0 && <p className="text-sm text-[var(--dim)]">No listings yet.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="mt-5">
          <button type="button" onClick={() => { setEditing({ ...EMPTY_BIKE, id: null, photos: [] }); setPhotoMsg(""); setDragIdx(null); }} className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">+ Add a bike</button>
          {editing && (
            <form className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4" onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }}>
              <p className="font-display text-base font-bold text-[var(--text)]">{editing.id ? "Edit listing" : "New listing"}</p>

              {/* ── Instagram Reel Link — PROMINENT, separate section ──
                  Owner reported this was not visible before: it was buried
                  as one small field in the specs grid. Now it is its own
                  clearly-labelled panel at the top of the form, with the
                  Instagram logo, a large input, and step-by-step help. */}
              <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#dc2743]/50 bg-[var(--bg)]">
                <div className="flex items-center gap-2.5 px-4 py-3 text-white" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20"><InstagramLogo className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-extrabold leading-tight">Instagram Reel Link — for this bike</p>
                    <p className="text-[11px] leading-tight text-white/85">This reel will appear on this bike's page for customers</p>
                  </div>
                  {editing.reelUrl.trim() && <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#bc1888]">✓ Reel added</span>}
                </div>
                <div className="p-4">
                  <label htmlFor="bike-reelUrl-main" className="text-sm font-bold text-[var(--text)]">Paste Instagram reel link here</label>
                  <input id="bike-reelUrl-main" value={editing.reelUrl} onChange={(e) => setEditing({ ...editing, reelUrl: e.target.value })} placeholder="https://www.instagram.com/reel/…………/" className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]" />
                  <p className="mt-2 text-xs leading-relaxed text-[var(--dim)]">How to get it: open Instagram → open your reel for this bike → tap <b>Share (➤)</b> → <b>Copy link</b> → paste it above. For 2 reels of the same bike, paste both links separated by a comma. Leave empty if this bike has no reel. Then tap Save / Publish at the bottom — customers will see “See it in our Instagram reel” on the bike page.</p>
                  {editing.reelUrl.trim() && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editing.reelUrl.split(/[\s,]+/).filter(Boolean).slice(0, 4).map((u) => (
                        <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--accent)] border border-[var(--border)]">Open reel link ↗</a>
                      ))}
                      <button type="button" onClick={() => setEditing({ ...editing, reelUrl: "" })} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text)]">Clear reel link</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bike photos — MULTIPLE upload + order 1,2,3,4… ──
                  accept="image/*" + multiple lets the owner pick many
                  photos at once from the phone gallery / local disk.
                  Order is changed by dragging a photo onto another
                  (swap/move) or with the ← → buttons on each photo —
                  numbers renumber automatically to 1,2,3,4… */}
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[var(--text)]">Bike photos — upload multiple</p>
                  <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-xs font-bold text-[var(--text)]">{editing.photos.length} photo{editing.photos.length === 1 ? "" : "s"}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--dim)]">Upload the actual photos of this bike from your phone gallery or computer. You can select <b>many photos at once</b>. Photo <b>1</b> is the cover photo everywhere (cards, bike page, hero). Change the order by <b>dragging</b> a photo onto another photo, or use the <b>← →</b> buttons under each photo — the order becomes 1, 2, 3, 4… exactly as you arrange it.</p>
                <input ref={photoInputRef} id="bike-photo-file" type="file" accept="image/*" multiple onChange={onPickPhotos} className="sr-only" aria-label="Upload multiple bike photos from gallery or local disk" />
                <label htmlFor="bike-photo-file" className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">
                  📷 {isUploading ? `Uploading ${uploadingCount}…` : editing.photos.length > 0 ? "Add more photos — pick from gallery / disk" : "Upload photos from gallery / disk — pick many"}
                </label>
                <p className="mt-2 text-xs text-[var(--dim)]">On your phone this opens your photo gallery — tap to select multiple photos. On a computer, Ctrl/Cmd-click to select many files. JPG / PNG / WebP, up to 10 MB each. Wait for “uploaded”, arrange the order, then Save / Publish below.</p>
                {photoMsg && <p role="status" className="mt-2 text-sm font-semibold text-[var(--text)]">{photoMsg}</p>}

                {editing.photos.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="list" aria-label="Uploaded photos in order">
                    {editing.photos.map((p, idx) => (
                      <div
                        key={`${p.blobKey}-${idx}`}
                        role="listitem"
                        draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragEnd={() => setDragIdx(null)}
                        onDragOver={(ev) => ev.preventDefault()}
                        onDrop={(ev) => { ev.preventDefault(); if (dragIdx !== null) { movePhoto(dragIdx, idx); } setDragIdx(null); }}
                        className={`overflow-hidden rounded-2xl border-2 bg-[var(--surface)] ${dragIdx === idx ? "border-[var(--accent)] opacity-60" : "border-[var(--border)]"}`}
                        aria-label={`Photo ${idx + 1}`}
                      >
                        <div className="relative cursor-grab active:cursor-grabbing" title="Drag to reorder">
                          <img src={p.url} alt={`Bike photo ${idx + 1}`} className="aspect-[4/3] w-full object-cover" draggable={false} />
                          <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-sm font-extrabold text-white">{idx + 1}</span>
                          {idx === 0 && <span className="absolute right-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white">COVER</span>}
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">⠿ Drag to reorder</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 px-2 py-2">
                          <div className="flex gap-1">
                            <button type="button" aria-label={`Move photo ${idx + 1} earlier`} disabled={idx === 0} onClick={() => movePhoto(idx, idx - 1)} className="rounded-full border border-[var(--border)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)] disabled:opacity-35">← Earlier</button>
                            <button type="button" aria-label={`Move photo ${idx + 1} later`} disabled={idx === editing.photos.length - 1} onClick={() => movePhoto(idx, idx + 1)} className="rounded-full border border-[var(--border)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)] disabled:opacity-35">Later →</button>
                          </div>
                          <button type="button" aria-label={`Remove photo ${idx + 1}`} onClick={() => removePhoto(idx)} className="rounded-full bg-[#fdecec] px-2.5 py-1.5 text-xs font-bold text-[#b3261e] dark:bg-[#3a1a18] dark:text-[#ff9d97]">Remove</button>
                        </div>
                        {editing.photos.length > 1 && (
                          <div className="flex items-center gap-1.5 border-t border-[var(--border)] px-2 py-2">
                            <label htmlFor={`swap-${idx}`} className="text-[11px] font-semibold text-[var(--dim)]">Swap with #</label>
                            <select id={`swap-${idx}`} aria-label={`Swap photo ${idx + 1} with another number`} defaultValue="" onChange={(ev) => { const t = Number(ev.target.value); if (!Number.isNaN(t)) swapPhoto(idx, t); ev.target.value = ""; }} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-1.5 py-1 text-xs text-[var(--text)]">
                              <option value="">Choose…</option>
                              {editing.photos.map((_, j) => j !== idx ? <option key={j} value={j}>{j + 1}</option> : null)}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    {(IMAGES[editing.imageKey]) ? (
                      <div className="flex items-center gap-3"><img src={IMAGES[editing.imageKey]} alt="Catalog photo for this model" className="h-20 w-28 rounded-xl object-cover opacity-80" /><p className="text-xs text-[var(--dim)]">No uploaded photos yet — the built-in catalog photo above is showing for now. Upload your own photos and they will replace it, in your order.</p></div>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl bg-[#2a2c2e] px-3 text-center text-xs font-bold text-[#f6f3ee]">No photos yet — upload photos above</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {txtField("Brand *", "brand")}{txtField("Model *", "modelName")}{numField("Year", "year")}
                {numField("Price (₹)", "price")}{numField("Engine (cc)", "displacementCc")}{numField("Odometer (km)", "odometerKm")}
                {txtField("Colour", "color")}{numField("Fuel tank (L)", "fuelCapacityL")}{numField("Mileage (km/l)", "mileageKmpl")}
                {txtField("Transmission", "transmission")}{txtField("Engine type", "engineType")}{txtField("Registration", "registration")}
                {txtField("YouTube walkaround URL", "videoUrl")}
                <div>
                  <label htmlFor="bike-condition" className="text-xs font-semibold text-[var(--dim)]">Condition</label>
                  <select id="bike-condition" value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value as "NEW" | "PRE_OWNED" })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm text-[var(--text)]"><option value="NEW">New</option><option value="PRE_OWNED">Pre-owned</option></select>
                </div>
                <div>
                  <label htmlFor="bike-status" className="text-xs font-semibold text-[var(--dim)]">Status</label>
                  <select id="bike-status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as "AVAILABLE" | "RESERVED" | "SOLD" })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm text-[var(--text)]"><option value="AVAILABLE">Available</option><option value="RESERVED">Booked / Under Inspection</option><option value="SOLD">Sold</option></select>
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-[var(--text)]"><input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} className="h-5 w-5" /> Featured</label>
              </div>
              <div className="mt-3">
                <label htmlFor="bike-description" className="text-xs font-semibold text-[var(--dim)]">Description</label>
                <textarea id="bike-description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm text-[var(--text)]" />
              </div>
              <p className="mt-2 text-xs text-[var(--dim)]">Reminder: set the Instagram Reel Link at the top of this form and arrange photos in order 1, 2, 3, 4… — both are saved together when you tap Save / Publish.</p>
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={upsert.isPending || isUploading} className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isUploading ? "Wait — photos uploading…" : editing.id ? "Save changes" : "Publish listing"}</button>
                <button type="button" onClick={() => { setEditing(null); setPhotoMsg(""); setDragIdx(null); }} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]">Cancel</button>
              </div>
            </form>
          )}
          <div className="mt-4 space-y-2">
            {bikes.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <BikePhoto bike={b} className="h-14 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text)]">{b.year} {b.brand} {b.modelName}</p>
                  <p className="text-xs text-[var(--dim)]">{inr(b.price)} · {b.views} views · {((b as unknown as { photos?: unknown[] }).photos?.length ?? (b.imageBlobKey ? 1 : 0))} photo{(((b as unknown as { photos?: unknown[] }).photos?.length ?? 0) === 1) ? "" : "s"}{b.reelUrl ? " · 🎬 Reel added" : " · No reel link"}</p>
                </div>
                <StatusBadge status={b.status} />
                <button type="button" onClick={() => { const gallery = ((b as unknown as { photos?: Array<{ blobKey: string; url: string }> }).photos ?? []).map((p) => ({ blobKey: p.blobKey, url: p.url })); const photos: GalleryPhoto[] = gallery.length > 0 ? gallery : (b.imageBlobKey ? [{ blobKey: b.imageBlobKey, url: b.imageUrl }] : []); setEditing({ id: b.id, brand: b.brand, modelName: b.modelName, year: b.year, price: b.price, displacementCc: b.displacementCc, odometerKm: b.odometerKm, condition: b.condition as "NEW" | "PRE_OWNED", status: b.status as "AVAILABLE" | "RESERVED" | "SOLD", isFeatured: b.isFeatured, color: b.color, fuelCapacityL: b.fuelCapacityL, transmission: b.transmission, mileageKmpl: b.mileageKmpl, engineType: b.engineType, registration: b.registration, description: b.description, imageKey: b.imageKey, imageBlobKey: b.imageBlobKey, imageUrl: b.imageUrl, videoUrl: b.videoUrl, reelUrl: b.reelUrl, photos }); setPhotoMsg(photos.length > 0 ? `${photos.length} uploaded photo${photos.length > 1 ? "s" : ""} in order 1–${photos.length}. Drag or use ← → to reorder, add more above, then Save.` : ""); setDragIdx(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Edit — photos & reel</button>
                <button type="button" aria-label={`Archive ${b.modelName}`} onClick={() => { if (confirmDel === b.id) { del.mutate(b.id); setConfirmDel(null); } else setConfirmDel(b.id); }} className="rounded-full bg-[#fdecec] px-4 py-2 text-sm font-bold text-[#b3261e] dark:bg-[#3a1a18] dark:text-[#ff9d97]">{confirmDel === b.id ? "Tap again to archive" : "Archive"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportCsv} className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--ink-text)]">⬇ Export contacts (CSV)</button>
            <span className="text-xs text-[var(--dim)]">Quick replies are available inside each chat.</span>
          </div>
          <div className="mt-3 space-y-3">
            {(admin.data?.enquiries ?? []).map((e) => {
              const cur = leadEdits[e.id] ?? { status: e.status, temperature: e.temperature, note: e.note, followUpAt: e.followUpAt };
              const set = (patch: Partial<typeof cur>) => setLeadEdits({ ...leadEdits, [e.id]: { ...cur, ...patch } });
              return (
                <div key={e.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[var(--text)]">{e.customerName} <span className="font-semibold text-[var(--dim)]">· {e.customerPhone || "no phone given"}</span></p>
                      <p className="text-sm text-[var(--text)]">{e.bikeLabel}</p>
                      <p className="text-xs text-[var(--dim)]">via {e.channel} · {new Date(e.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}{e.lastMessage ? ` · “${e.lastMessage.slice(0, 60)}”` : ""}</p>
                    </div>
                    {e.unread > 0 && <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-white">{e.unread} unread</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label htmlFor={`lead-status-${e.id}`} className="text-xs font-semibold text-[var(--dim)]">Pipeline</label>
                      <select id={`lead-status-${e.id}`} value={cur.status} onChange={(ev) => set({ status: ev.target.value })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"><option value="NEW">New</option><option value="IN_PROGRESS">In progress</option><option value="CLOSED">Closed</option></select>
                    </div>
                    <div>
                      <label htmlFor={`lead-temp-${e.id}`} className="text-xs font-semibold text-[var(--dim)]">Lead</label>
                      <select id={`lead-temp-${e.id}`} value={cur.temperature} onChange={(ev) => set({ temperature: ev.target.value })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"><option value="HOT">🔥 Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option></select>
                    </div>
                    <div>
                      <label htmlFor={`lead-follow-${e.id}`} className="text-xs font-semibold text-[var(--dim)]">Follow-up date</label>
                      <input id={`lead-follow-${e.id}`} type="date" value={cur.followUpAt} onChange={(ev) => set({ followUpAt: ev.target.value })} className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]" />
                    </div>
                    <div>
                      <label htmlFor={`lead-note-${e.id}`} className="text-xs font-semibold text-[var(--dim)]">Note</label>
                      <input id={`lead-note-${e.id}`} value={cur.note} onChange={(ev) => set({ note: ev.target.value })} placeholder="e.g. Wants EMI quote" className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]" />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => updLead.mutate(e.id)} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">Save lead</button>
                    <button type="button" onClick={() => setChatId(e.id)} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">Open chat</button>
                    {templates.slice(0, 2).map((t) => (
                      <button key={t} type="button" onClick={async () => { await api.sendMessage({ enquiryId: e.id, sender: "DEALER", text: t, ownerToken }); void qc.invalidateQueries({ queryKey: ["adminEnquiries"] }); setSavedMsg("Quick reply sent."); }} className="rounded-full bg-[var(--bg)] px-3 py-2 text-left text-xs font-semibold text-[var(--text)]">⚡ {t.slice(0, 42)}…</button>
                    ))}
                  </div>
                </div>
              );
            })}
            {(admin.data?.enquiries.length ?? 0) === 0 && <p className="text-sm text-[var(--dim)]">No enquiries yet — they will appear here the moment a customer chats, taps WhatsApp/Call or sends the enquiry form.</p>}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <form className="mt-5 max-w-lg space-y-3" onSubmit={(e) => { e.preventDefault(); saveSettings.mutate(); }}>
          <div>
            <label htmlFor="set-wa" className="text-sm font-semibold text-[var(--text)]">WhatsApp number (with country code)</label>
            <input id="set-wa" inputMode="tel" value={wa ?? settings?.whatsappNumber ?? ""} onChange={(e) => setWa(e.target.value)} placeholder="e.g. 919876543210" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            <p className="mt-1 text-xs text-[var(--dim)]">Powers every “WhatsApp” button with a pre-filled bike enquiry.</p>
          </div>
          <div>
            <label htmlFor="set-wa2" className="text-sm font-semibold text-[var(--text)]">Second WhatsApp number (optional)</label>
            <input id="set-wa2" inputMode="tel" value={wa2 ?? settings?.whatsappNumber2 ?? ""} onChange={(e) => setWa2(e.target.value)} placeholder="e.g. 918106900126" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            <p className="mt-1 text-xs text-[var(--dim)]">Shown as an extra WhatsApp button in the “Visit the showroom” section.</p>
          </div>
          <div>
            <label htmlFor="set-call" className="text-sm font-semibold text-[var(--text)]">Click-to-call number</label>
            <input id="set-call" inputMode="tel" value={call ?? settings?.callNumber ?? ""} onChange={(e) => setCall(e.target.value)} placeholder="e.g. 919876543210" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
          </div>
          <div>
            <label htmlFor="set-city" className="text-sm font-semibold text-[var(--text)]">Showroom city / address line</label>
            <input id="set-city" value={city ?? settings?.showroomCity ?? ""} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Kochi, Kerala" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
          </div>
          <div>
            <label htmlFor="set-address" className="text-sm font-semibold text-[var(--text)]">Showroom address</label>
            <input id="set-address" value={addr ?? settings?.address ?? ""} onChange={(e) => setAddr(e.target.value)} placeholder="Full address shown in Visit the showroom & footer" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
          </div>
          <div>
            <label htmlFor="set-hours" className="text-sm font-semibold text-[var(--text)]">Opening hours</label>
            <input id="set-hours" value={hours ?? settings?.hours ?? ""} onChange={(e) => setHours(e.target.value)} placeholder="e.g. Mon–Sat 9:30 AM – 7:30 PM" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
          </div>
          <div>
            <label htmlFor="set-ig" className="text-sm font-semibold text-[var(--text)]">Instagram handle</label>
            <input id="set-ig" value={ig ?? settings?.instagramHandle ?? ""} onChange={(e) => setIg(e.target.value)} placeholder="e.g. kgn_premium_bikes" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            <p className="mt-1 text-xs text-[var(--dim)]">Links the “Visit the showroom” section and bike reels to your Instagram page.</p>
          </div>
          <div>
            <label htmlFor="set-igf" className="text-sm font-semibold text-[var(--text)]">Instagram followers (as shown on the site)</label>
            <input id="set-igf" value={igF ?? settings?.instagramFollowers ?? ""} onChange={(e) => setIgF(e.target.value)} placeholder="e.g. 69K" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
          </div>
          <button type="submit" disabled={saveSettings.isPending} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Save settings</button>
        </form>
      )}

      {tab === "owners" && (
        <div className="mt-5 max-w-lg">
          <h3 className="font-display text-lg font-bold text-[var(--text)]">Owners</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">Each owner signs in to this dashboard with their own Gmail and password — the number of owners is simply the number of Gmail + password pairs below. Passwords are stored hashed on the server and are never shown.</p>
          <div className="mt-3 space-y-2">
            {ownersQ.isPending && <p className="text-sm text-[var(--dim)]">Loading owners…</p>}
            {(ownersQ.data?.owners ?? []).map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[var(--text)]">{o.email}{o.email === ownerEmail ? " (you)" : ""}</span>
                  <span className="block text-xs text-[var(--dim)]">Owner since {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </span>
                {o.email !== ownerEmail && (
                  <button type="button" onClick={() => { if (confirmRemove === o.email) { removeOwner.mutate(o.email); } else setConfirmRemove(o.email); }} className="rounded-full bg-[#fdecec] px-4 py-2 text-sm font-bold text-[#b3261e] dark:bg-[#3a1a18] dark:text-[#ff9d97]">{confirmRemove === o.email ? "Tap again to remove" : "Remove"}</button>
                )}
              </div>
            ))}
          </div>
          <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); setOwnerMsg(""); addOwner.mutate(); }}>
            <h4 className="font-display text-base font-bold text-[var(--text)]">Add another owner</h4>
            <div>
              <label htmlFor="new-owner-email" className="text-sm font-semibold text-[var(--text)]">New owner Gmail</label>
              <input id="new-owner-email" type="email" autoComplete="off" required value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="another-owner@gmail.com" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            </div>
            <div>
              <label htmlFor="new-owner-password" className="text-sm font-semibold text-[var(--text)]">New owner password (at least 8 characters)</label>
              <input id="new-owner-password" type="password" autoComplete="new-password" required minLength={8} value={newOwnerPw} onChange={(e) => setNewOwnerPw(e.target.value)} placeholder="Set their dashboard password" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            </div>
            <button type="submit" disabled={addOwner.isPending} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Add owner</button>
          </form>
          {ownerMsg && <p role="status" className="mt-3 text-sm font-semibold text-[var(--text)]">{ownerMsg}</p>}
          <form className="mt-8 space-y-3 border-t border-[var(--border)] pt-6" onSubmit={(e) => { e.preventDefault(); changePw.mutate(); }}>
            <h4 className="font-display text-base font-bold text-[var(--text)]">Change my password</h4>
            <p className="text-sm text-[var(--dim)]">Signed in as {ownerEmail}. This changes only your own owner password.</p>
            <div>
              <label htmlFor="pw-current" className="text-sm font-semibold text-[var(--text)]">Current password</label>
              <input id="pw-current" type="password" autoComplete="current-password" required value={curPw} onChange={(e) => setCurPw(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            </div>
            <div>
              <label htmlFor="pw-new" className="text-sm font-semibold text-[var(--text)]">New password (at least 8 characters)</label>
              <input id="pw-new" type="password" autoComplete="new-password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]" />
            </div>
            <button type="submit" disabled={changePw.isPending} className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-[var(--ink-text)] disabled:opacity-50">Change password</button>
            {pwMsg && <p role="status" className="text-sm font-semibold text-[var(--text)]">{pwMsg}</p>}
          </form>
        </div>
      )}
      {tab === "family" && (
        <div className="mt-5">
          <h3 className="font-display text-lg font-bold text-[var(--text)]">👨‍👩‍👧 Our Family — all signed-up users</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--dim)]">Every customer who has signed up at KGN Premium Bikes is family. Below is the full member list, and a note of every profile change — joining, setting or changing a password, and editing profile details — is kept here for owners. Passwords themselves are never shown, only the fact that one was set or changed.</p>
          {familyQ.isPending && <p className="mt-3 text-sm text-[var(--dim)]">Loading Our Family…</p>}
          {familyQ.isError && <p className="mt-3 text-sm font-semibold text-[#b3261e]">Could not load the family list. <button type="button" className="underline" onClick={() => void familyQ.refetch()}>Retry</button></p>}
          {familyQ.data && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--ink)] px-3.5 py-1.5 text-sm font-bold text-[var(--ink-text)]">{familyQ.data.users.length} family member{familyQ.data.users.length === 1 ? "" : "s"}</span>
                <span className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-sm font-semibold text-[var(--text)]">{familyQ.data.changes.length} profile change note{familyQ.data.changes.length === 1 ? "" : "s"} kept</span>
              </div>
              <div className="mt-3 max-w-md">
                <label htmlFor="family-search" className="sr-only">Search family members</label>
                <input id="family-search" value={familySearch} onChange={(e) => setFamilySearch(e.target.value)} placeholder="Search by name, username, mobile or Gmail…" className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]" />
              </div>
              {(() => {
                const q = familySearch.trim().toLowerCase();
                const users = familyQ.data.users.filter((u) => !q || `${u.fullName} ${u.username} ${u.contact}`.toLowerCase().includes(q));
                if (familyQ.data.users.length === 0) return <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--dim)]">No customers have signed up yet — when the first customer creates an account, they will appear here as family.</p>;
                if (users.length === 0) return <p className="mt-4 text-sm text-[var(--dim)]">No family member matches “{familySearch}”.</p>;
                return (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((u) => {
                      const userChanges = familyQ.data.changes.filter((c) => c.accountId === u.id);
                      const open = familyOpenId === u.id;
                      const ini = (u.fullName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "K").slice(0, 2);
                      return (
                        <div key={u.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                          <div className="flex items-start gap-3">
                            <span aria-hidden="true" className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-base font-extrabold text-white">{ini}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-[var(--text)]">{u.fullName}</p>
                              <p className="truncate text-xs text-[var(--dim)]">@{u.username} · {u.contact || "no contact saved"}</p>
                              <p className="mt-0.5 text-xs text-[var(--dim)]">Family since {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ♥ {u.wishlistCount} saved · 💬 {u.enquiryCount} enquiries</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => setFamilyOpenId(open ? null : u.id)} aria-expanded={open} aria-controls={`family-history-${u.id}`} className="mt-3 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">{open ? "Hide change history" : `Profile change history (${userChanges.length})`}</button>
                          {open && (
                            <div id={`family-history-${u.id}`} className="mt-3 border-t border-[var(--border)] pt-3">
                              {userChanges.length === 0 ? (
                                <p className="text-sm leading-relaxed text-[var(--dim)]">No changes recorded yet for {u.fullName.split(" ")[0]}. Their sign-up date is shown above; from now on, joining, password and profile-detail changes are noted here automatically.</p>
                              ) : (
                                <ul className="space-y-2.5">
                                  {userChanges.map((c) => (
                                    <li key={c.id} className="flex gap-2.5">
                                      <span aria-hidden="true" className="text-base leading-none">{changeLabel(c.changeType).icon}</span>
                                      <span className="min-w-0">
                                        <span className="block text-sm font-bold text-[var(--text)]">{changeLabel(c.changeType).label} <span className="font-semibold text-[var(--dim)]">· {new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span></span>
                                        <span className="block text-sm leading-relaxed text-[var(--dim)]">{c.detail}</span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <h4 className="font-display mt-7 text-base font-bold text-[var(--text)]">Recent profile changes — whole family</h4>
              <p className="mt-0.5 text-sm text-[var(--dim)]">The latest notes across all members, newest first.</p>
              {familyQ.data.changes.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-center text-sm text-[var(--dim)]">No profile changes recorded yet. Notes start appearing here as customers sign up, set or change passwords, and edit their profile details.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {familyQ.data.changes.slice(0, 30).map((c) => (
                    <li key={c.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                      <span aria-hidden="true" className="text-lg leading-none">{changeLabel(c.changeType).icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[var(--text)]">{c.fullName || `@${c.username}`} <span className="font-semibold text-[var(--dim)]">(@{c.username}) · {changeLabel(c.changeType).label}</span></span>
                        <span className="block text-sm leading-relaxed text-[var(--dim)]">{c.detail}</span>
                        <span className="mt-0.5 block text-xs text-[var(--dim)]">{new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
      {chatId !== null && <ChatThread enquiryId={chatId} as="DEALER" ownerToken={ownerToken} onClose={() => setChatId(null)} />}
    </div>
  );
}

/* ---------------- Customer reviews ----------------
   Public section on the home page: every visitor sees the reviews.
   Only a signed-in customer can write one — the "Give review" button
   opens the form only when signed in (otherwise it asks for sign-in
   and routes to the account page), and createReview re-verifies the
   account server-side before saving. A submitted review appears in
   this same list immediately. No reviews are seeded or invented:
   with none submitted yet, the section shows an honest empty state. */
function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= rating ? "text-[#f5a623]" : "text-[var(--border)]"}>★</span>
      ))}
    </span>
  );
}

function ReviewsSection({ account, bikes, onNeedAccount }: { account: Account | null; bikes: Bike[]; onNeedAccount: () => void }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [bikeId, setBikeId] = useState("");
  const [msg, setMsg] = useState("");
  const [signInNote, setSignInNote] = useState(false);
  const reviewsQ = useQuery({ queryKey: ["reviews"], queryFn: () => api.listReviews({}) });
  const reviews = reviewsQ.data?.reviews ?? [];
  const avg = reviewsQ.data?.averageRating ?? 0;
  const count = reviewsQ.data?.count ?? 0;

  const submit = useMutation({
    mutationFn: async () => api.createReview({
      accountId: account!.id,
      rating,
      title,
      reviewText: text,
      bikeId: bikeId ? Number(bikeId) : null,
    }),
    onSuccess: (r) => {
      setMsg(r.message);
      if (r.ok) {
        setShowForm(false);
        setTitle(""); setText(""); setBikeId(""); setRating(5);
        void qc.invalidateQueries({ queryKey: ["reviews"] });
      }
    },
    onError: () => setMsg("Could not save your review — please write a few words and try again."),
  });

  const openGiveReview = () => {
    if (!account) { setSignInNote(true); return; }
    setSignInNote(false);
    setMsg("");
    setShowForm((v) => !v);
  };

  const inputCls = "mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)]";
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10" aria-label="Customer reviews">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">What our customers say</p>
          <h2 className="font-display mt-1 text-2xl font-extrabold text-[var(--text)] sm:text-3xl">Customer reviews</h2>
          {count > 0 ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--dim)]">
              <Stars rating={Math.round(avg)} className="text-lg" />
              <span className="font-bold text-[var(--text)]">{avg.toFixed(1)} / 5</span>
              <span>· {count} {count === 1 ? "review" : "reviews"} from KGN customers</span>
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[var(--dim)]">Real reviews from KGN customers — written by riders who bought from us.</p>
          )}
        </div>
        <button type="button" onClick={openGiveReview} aria-expanded={account ? showForm : undefined} aria-controls="give-review-form" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">✍️ Give review</button>
      </div>

      {signInNote && !account && (
        <div role="status" className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
          <p className="text-sm font-semibold text-[var(--text)]">Only signed-in customers can give a review.</p>
          <p className="mt-0.5 text-sm text-[var(--dim)]">Sign in (or create your free account) and your review will be shown here on the website for everyone to see.</p>
          <button type="button" onClick={onNeedAccount} className="mt-2.5 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-[var(--ink-text)]">Sign in to give a review →</button>
        </div>
      )}
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#e7f6ee] px-4 py-3 text-sm font-semibold text-[#146c3c] dark:bg-[#14301f] dark:text-[#7fe0a8]">{msg}</p>}

      {account && showForm && (
        <form id="give-review-form" className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5" onSubmit={(e) => { e.preventDefault(); setMsg(""); submit.mutate(); }}>
          <p className="font-display text-base font-extrabold text-[var(--text)]">Write your review</p>
          <p className="mt-0.5 text-sm text-[var(--dim)]">Reviewing as <span className="font-bold text-[var(--text)]">{account.fullName}</span> (@{account.username}) — it will be shown publicly with your name.</p>
          <div className="mt-4">
            <span id="review-rating-label" className="text-sm font-semibold text-[var(--text)]">Your rating</span>
            <div className="mt-1.5 flex gap-1" role="radiogroup" aria-labelledby="review-rating-label">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={`rounded-full px-2.5 py-1.5 text-2xl leading-none ${n <= rating ? "text-[#f5a623]" : "text-[var(--border)]"}`}>★</button>
              ))}
              <span className="ml-2 self-center text-sm font-bold text-[var(--text)]">{rating} / 5</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="review-title" className="text-sm font-semibold text-[var(--text)]">Headline (optional)</label>
              <input id="review-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best place to buy a bike in Proddatur" className={inputCls} />
            </div>
            <div>
              <label htmlFor="review-bike" className="text-sm font-semibold text-[var(--text)]">Bike you bought / enquired about (optional)</label>
              <select id="review-bike" value={bikeId} onChange={(e) => setBikeId(e.target.value)} className={inputCls}>
                <option value="">General — about KGN overall</option>
                {bikes.map((b) => <option key={b.id} value={b.id}>{b.year} {b.brand} {b.modelName}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="review-text" className="text-sm font-semibold text-[var(--text)]">Your review</label>
            <textarea id="review-text" required minLength={3} maxLength={1000} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="How was your experience — the bike, the price, the service, the test ride…" className={inputCls} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={submit.isPending} className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">Submit review — show it on the website</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]">Cancel</button>
          </div>
        </form>
      )}

      {reviewsQ.isPending && <p className="mt-5 text-sm text-[var(--dim)]">Loading reviews…</p>}
      {reviewsQ.isError && <p className="mt-5 text-sm text-[#b3261e]">Could not load reviews. <button type="button" className="font-bold underline" onClick={() => void reviewsQ.refetch()}>Retry</button></p>}
      {!reviewsQ.isPending && !reviewsQ.isError && reviews.length === 0 && (
        <div className="mt-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-7 text-center">
          <p className="text-2xl" aria-hidden="true">⭐</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text)]">No reviews yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--dim)]">Be the first KGN customer to share your experience — tap “Give review” above. Reviews from signed-in customers appear here right away.</p>
        </div>
      )}
      {reviews.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const initials = (r.reviewerName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "K").slice(0, 2);
            return (
              <article key={r.id} className="flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-extrabold text-white">{initials}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--text)]">{r.reviewerName}</span>
                    <span className="block truncate text-xs text-[var(--dim)]">@{r.username} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </span>
                  <span className="ml-auto shrink-0"><Stars rating={r.rating} className="text-base" /></span>
                </div>
                {r.title && <p className="font-display mt-3 text-sm font-extrabold leading-snug text-[var(--text)]">{r.title}</p>}
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--text)]">{r.reviewText}</p>
                {r.bikeLabel && <p className="mt-3"><span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-bold text-[var(--dim)]">🏍️ {r.bikeLabel}</span></p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- Main app ---------------- */
type View = { kind: "shop" } | { kind: "bike"; id: number } | { kind: "account" } | { kind: "admin" };

export function App() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ kind: "shop" });
  const [accountSection, setAccountSection] = useState<ProfileSection>("wishlist");
  const [account, setAccount] = useState<Account | null>(() => {
    try { const raw = localStorage.getItem("kgn-account"); return raw ? (JSON.parse(raw) as Account) : null; } catch { return null; }
  });
  // Owner dashboard session: hidden from the customer side. It is reached
  // only via the hidden owner hash in the address (#owner) or the hidden
  // logo-tap gesture — no owner button, link or mention exists anywhere
  // in the customer UI.
  // WHY IT USED TO "DISAPPEAR": the token lived in sessionStorage, which
  // the browser/app frame discards when the tab is closed, the app is
  // backgrounded for a while, or the phone restarts — so after idle time
  // the owner came back to a sign-in screen even though the server
  // session was still valid. It now lives in localStorage (persists
  // across idle/close/restart on this device), the server session lasts
  // 30 days and slides forward on every verify, and a "was in the
  // dashboard" flag restores the dashboard view itself after an idle
  // reload. Sign out is the only immediate way out.
  const readOwnerStore = (key: string): string | null => {
    try {
      const v = localStorage.getItem(key);
      if (v) return v;
      // Migrate a token saved by the older sessionStorage build.
      const legacy = sessionStorage.getItem(key);
      if (legacy) { localStorage.setItem(key, legacy); sessionStorage.removeItem(key); return legacy; }
      return null;
    } catch { return null; }
  };
  const writeOwnerStore = (key: string, value: string | null) => {
    try {
      if (value === null) { localStorage.removeItem(key); sessionStorage.removeItem(key); }
      else localStorage.setItem(key, value);
    } catch { /* private mode */ }
  };
  const isOwnerHash = () => {
    try { const h = window.location.hash.replace(/^#\/?/, "").toLowerCase(); return h === "owner" || h === "owner-login" || h === "admin"; } catch { return false; }
  };
  const [ownerRoute, setOwnerRoute] = useState<boolean>(() => isOwnerHash() || readOwnerStore("kgn-owner-active") === "1");
  useEffect(() => {
    const onHash = () => { if (isOwnerHash()) setOwnerRoute(true); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => { if (ownerRoute) setView({ kind: "admin" }); }, [ownerRoute]);
  useEffect(() => { if (!ownerRoute && view.kind === "admin") setView({ kind: "shop" }); }, [ownerRoute, view.kind]);
  // Remember "owner left the dashboard open" so an idle reload returns
  // there instead of dropping back to the customer catalog.
  useEffect(() => { writeOwnerStore("kgn-owner-active", ownerRoute ? "1" : null); }, [ownerRoute]);
  const [ownerToken, setOwnerToken] = useState<string | null>(() => readOwnerStore("kgn-owner-token"));
  const [ownerEmail, setOwnerEmail] = useState<string>(() => readOwnerStore("kgn-owner-email") ?? "");
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [ownerChecking, setOwnerChecking] = useState<boolean>(() => !!readOwnerStore("kgn-owner-token"));
  const [ownerRetry, setOwnerRetry] = useState(0);
  useEffect(() => {
    if (!ownerToken) { setOwnerVerified(false); setOwnerChecking(false); return; }
    let live = true;
    setOwnerChecking(true);
    void api.ownerVerifySession({ token: ownerToken }).then((r) => {
      if (!live) return;
      setOwnerChecking(false);
      if (r.ok) { setOwnerVerified(true); if (r.email) { setOwnerEmail(r.email); writeOwnerStore("kgn-owner-email", r.email); } }
      else { setOwnerVerified(false); setOwnerToken(null); setOwnerEmail(""); writeOwnerStore("kgn-owner-token", null); writeOwnerStore("kgn-owner-email", null); }
    }).catch(() => {
      // A network hiccup after idle must NOT sign the owner out: keep the
      // stored token and show a restore screen with Retry instead of the
      // sign-in form, so the dashboard comes back when the network does.
      if (live) { setOwnerVerified(false); setOwnerChecking(false); }
    });
    return () => { live = false; };
  }, [ownerToken, ownerRetry]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("ALL");
  const [cond, setCond] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(350000);
  const [ccBand, setCcBand] = useState("ALL");
  const [yearMin, setYearMin] = useState(0);
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formBike, setFormBike] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [formDone, setFormDone] = useState("");
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroScrollRef = useRef<HTMLDivElement | null>(null);
  const heroResumeRef = useRef<number | null>(null);

  const bikesQ = useQuery({ queryKey: ["bikes"], queryFn: () => api.listBikes({}) });
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: () => api.getSettings({}) });
  const myData = useQuery({
    queryKey: ["myData", account?.id],
    queryFn: () => api.getMyData({ accountId: account!.id }),
    enabled: !!account,
  });
  const bikes = bikesQ.data?.bikes ?? [];
  const brands = bikesQ.data?.brands ?? [];
  // Hero is a swipeable carousel of ALL featured bikes (not a single
  // Classic 350). Featured-first ordering already comes from listBikes;
  // if nothing is flagged featured yet, fall back to the first 3 bikes
  // so the hero still swipes instead of showing one static bike.
  const featuredBikes = bikes.filter((b) => b.isFeatured);
  const heroBikes = featuredBikes.length >= 2 ? featuredBikes : [...featuredBikes, ...bikes.filter((b) => !featuredBikes.some((f) => f.id === b.id))].slice(0, Math.min(3, bikes.length));
  const safeHeroIdx = Math.min(heroIdx, Math.max(0, heroBikes.length - 1));
  const pauseHeroAuto = (ms = 8000) => {
    setHeroPaused(true);
    if (heroResumeRef.current) window.clearTimeout(heroResumeRef.current);
    heroResumeRef.current = window.setTimeout(() => { heroResumeRef.current = null; setHeroPaused(false); }, ms);
  };
  const scrollHeroTo = (idx: number, opts?: { fromAuto?: boolean }) => {
    const el = heroScrollRef.current;
    if (!el || heroBikes.length === 0) return;
    // Wrap around so auto-swipe (and the arrows) loop endlessly:
    // last slide → first slide, first slide → last slide.
    const next = ((idx % heroBikes.length) + heroBikes.length) % heroBikes.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setHeroIdx(next);
    if (!opts?.fromAuto) pauseHeroAuto();
  };
  // Auto-swipe by default: advance the hero every 2 seconds (owner's
  // requested speed, 2026-11-15), looping back to the first featured
  // bike after the last one. Pauses while the user is touching /
  // hovering / focusing the hero, and for a few seconds after any
  // manual swipe or arrow tap, then resumes.
  // Respects prefers-reduced-motion — no auto movement for those users.
  useEffect(() => {
    if (heroBikes.length <= 1 || heroPaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => {
      scrollHeroTo(safeHeroIdx + 1, { fromAuto: true });
    }, 2000);
    return () => window.clearTimeout(t);
    // scrollHeroTo is re-created each render; safeHeroIdx + length + paused are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeHeroIdx, heroBikes.length, heroPaused]);
  useEffect(() => () => {
    if (heroResumeRef.current) window.clearTimeout(heroResumeRef.current);
  }, []);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return bikes.filter((b) => `${b.brand} ${b.modelName}`.toLowerCase().includes(q)).slice(0, 5);
  }, [query, bikes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = bikes.filter((b) => {
      if (q && !`${b.brand} ${b.modelName} ${b.year}`.toLowerCase().includes(q)) return false;
      if (brand !== "ALL" && b.brand !== brand) return false;
      if (cond !== "ALL" && b.condition !== cond) return false;
      if (b.price > maxPrice) return false;
      if (yearMin && b.year < yearMin) return false;
      if (ccBand === "UNDER200" && b.displacementCc >= 200) return false;
      if (ccBand === "200-400" && (b.displacementCc < 200 || b.displacementCc > 400)) return false;
      if (ccBand === "400PLUS" && b.displacementCc <= 400) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "cc-desc") list = [...list].sort((a, b) => b.displacementCc - a.displacementCc);
    if (sort === "newest") list = [...list].sort((a, b) => b.year - a.year);
    return list;
  }, [bikes, query, brand, cond, maxPrice, ccBand, yearMin, sort]);

  const formEnquiry = useMutation({
    mutationFn: async () => api.createEnquiry({
      bikeId: formBike ? Number(formBike) : null, accountId: account?.id ?? null,
      customerName: formName, customerPhone: formPhone, channel: "FORM", message: formMsg,
    }),
    onSuccess: () => { setFormDone("Enquiry sent — the KGN team will reach out shortly. You can also track it under My KGN once you add this phone to an account."); setFormMsg(""); void qc.invalidateQueries({ queryKey: ["adminEnquiries"] }); },
    onError: () => setFormDone("Could not send — please check your name and phone and try again."),
  });

  const signIn = (a: Account) => { setAccount(a); try { localStorage.setItem("kgn-account", JSON.stringify(a)); } catch { /* private mode */ } };
  const signOut = () => { setAccount(null); try { localStorage.removeItem("kgn-account"); } catch { /* ignore */ } };
  const loginOwner = (token: string, email: string) => { setOwnerToken(token); setOwnerEmail(email); setOwnerVerified(true); writeOwnerStore("kgn-owner-token", token); writeOwnerStore("kgn-owner-email", email); writeOwnerStore("kgn-owner-active", "1"); };
  const exitOwnerRoute = () => { try { history.pushState(null, "", window.location.pathname + window.location.search); } catch { /* ignore */ } setOwnerRoute(false); setView({ kind: "shop" }); };
  // Opens the owner sign-in from INSIDE the site, with no visible owner
  // affordance anywhere (the owner asked for owner login to stay hidden
  // from users). This matters: the site runs inside the Muse app frame,
  // so editing the outer address bar to add #owner never reaches this
  // page's own hash — the owner was left stranded on the customer sign-in
  // (mobile + username) instead. The hidden in-site entry is tapping the
  // KGN logo 5 times within 3 seconds (see handleLogoTap); the #owner
  // hash still works wherever the page's own address can be edited.
  const openOwner = () => {
    setOwnerRoute(true);
    setView({ kind: "admin" });
    try { if (window.location.hash !== "#owner") window.location.hash = "owner"; } catch { /* ignore */ }
    window.scrollTo({ top: 0 });
  };
  const logoTaps = useRef<number[]>([]);
  const handleLogoTap = () => {
    const now = Date.now();
    logoTaps.current = [...logoTaps.current.filter((t) => now - t < 3000), now];
    if (logoTaps.current.length >= 5) { logoTaps.current = []; openOwner(); return; }
    goCustomer({ kind: "shop" });
  };
  const lockOwner = () => { const tok = ownerToken; setOwnerToken(null); setOwnerEmail(""); setOwnerVerified(false); writeOwnerStore("kgn-owner-token", null); writeOwnerStore("kgn-owner-email", null); writeOwnerStore("kgn-owner-active", null); try { sessionStorage.removeItem("kgn-owner-pin"); } catch { /* ignore */ } if (tok) void api.ownerLogout({ token: tok }).catch(() => undefined); exitOwnerRoute(); };
  const goCustomer = (v: View) => { if (ownerRoute) exitOwnerRoute(); setView(v); };
  const openBike = (id: number) => { setView({ kind: "bike", id }); window.scrollTo({ top: 0 }); };
  const unreadTotal = myData.data?.enquiries.reduce((s, e) => s + e.unread, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 pt-safe backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-2 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <button type="button" onClick={handleLogoTap} className="text-left" aria-label="KGN Premium Bikes — home">
            <span className="font-display block text-lg font-extrabold leading-none tracking-tight text-[var(--text)]">KGN <span className="text-[var(--accent)]">PREMIUM BIKES</span></span>
            <span className="hidden text-[11px] font-semibold text-[var(--dim)] min-[420px]:block">Since 1997 · Multi-brand premium motorcycle showroom{settingsQ.data?.showroomCity ? ` · ${settingsQ.data.showroomCity}` : ""}</span>
          </button>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5" aria-label="Main">
            <button type="button" onClick={() => goCustomer({ kind: "shop" })} className={`rounded-full px-2.5 py-2 text-[13px] font-bold sm:px-3 sm:text-sm ${view.kind === "shop" || view.kind === "bike" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "text-[var(--text)]"}`}>Bikes</button>
            {account && (
              <button type="button" onClick={() => { setAccountSection("chats"); goCustomer({ kind: "account" }); }} aria-label={`My chats${unreadTotal > 0 ? `, ${unreadTotal} unread` : ""}`} className={`relative rounded-full px-2.5 py-2 text-[13px] font-bold sm:px-3 sm:text-sm ${view.kind === "account" && accountSection === "chats" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "text-[var(--text)]"}`}>
                💬 My chats
                {unreadTotal > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadTotal}</span>}
              </button>
            )}
            <button type="button" onClick={() => goCustomer({ kind: "account" })} className={`relative rounded-full px-2.5 py-2 text-[13px] font-bold sm:px-3 sm:text-sm ${view.kind === "account" && accountSection !== "chats" ? "bg-[var(--ink)] text-[var(--ink-text)]" : view.kind === "account" ? "bg-[var(--ink)] text-[var(--ink-text)]" : "text-[var(--text)]"}`}>
              {account ? "My KGN" : "Sign in"}
              {account && unreadTotal > 0 && accountSection === "chats" && <span className="sr-only">{unreadTotal} unread chats</span>}
            </button>
          </nav>
        </div>
      </header>

      {view.kind === "bike" && (
        <BikeDetail bikeId={view.id} account={account} settings={settingsQ.data} onBack={() => setView({ kind: "shop" })} onNeedAccount={() => setView({ kind: "account" })} />
      )}

      {view.kind === "account" && (
        <div>
          <AccountView account={account} bikes={bikes} onSignIn={signIn} onOpenBike={openBike} section={accountSection} onSectionChange={setAccountSection} onBrowseBikes={() => goCustomer({ kind: "shop" })} onSignOut={signOut} />
          {account && accountSection !== "profile" && <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 -mt-4"><button type="button" onClick={() => setAccountSection("profile")} className="text-sm font-bold text-[var(--accent)]">Profile &amp; security →</button><span className="mx-2 text-[var(--dim)]">·</span><button type="button" onClick={signOut} className="text-sm font-bold text-[var(--text)] underline underline-offset-2">Sign out</button></div>}
        </div>
      )}

      {view.kind === "admin" && ownerRoute && (ownerVerified && ownerToken ? (
        <AdminView bikes={bikes} settings={settingsQ.data} ownerToken={ownerToken} ownerEmail={ownerEmail} onLock={lockOwner} />
      ) : ownerToken && !ownerVerified ? (
        <div className="mx-auto w-full max-w-md px-4 py-10">
          <p className="text-4xl" aria-hidden="true">🔒</p>
          <h2 className="font-display mt-3 text-2xl font-extrabold text-[var(--text)]">{ownerChecking ? "Restoring your owner session…" : "Still signed in on this device"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--dim)]">
            {ownerChecking
              ? "Checking your saved owner sign-in — this takes a second after the app has been idle or closed. You stay signed in for 30 days on this device, so no password is needed."
              : "Your owner sign-in is saved on this device (30 days), but the connection check didn't complete — usually a brief network gap after idle time. Tap Retry to reopen the dashboard without typing your password again."}
          </p>
          {!ownerChecking && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setOwnerRetry((n) => n + 1)} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white">Retry — reopen dashboard</button>
              <button type="button" onClick={lockOwner} className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--text)]">Sign out &amp; use password</button>
            </div>
          )}
          <button type="button" onClick={exitOwnerRoute} className="mt-4 text-sm font-bold text-[var(--accent)]">← Back to bikes</button>
        </div>
      ) : (
        <OwnerLogin onLogin={loginOwner} onBack={exitOwnerRoute} />
      ))}

      {view.kind === "shop" && (
        <main>
          {/* Hero */}
          <section className="bg-[var(--ink)] text-[var(--ink-text)]">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 pt-6">
              <p className="inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">🚀 Grand launch — Tuesday, 17 November 2026</p>
              <h1 className="font-display mt-4 text-[2rem] font-extrabold leading-[1.05] min-[420px]:text-4xl sm:text-5xl lg:text-6xl">Premium bikes.<br />Every brand. One showroom.</h1>
              <p className="mt-3 max-w-xl text-base text-[#c9cdd4] lg:max-w-2xl lg:text-lg">Serving riders since 1997 — Royal Enfield, KTM, Honda, Bajaj, Hero, Yamaha & TVS, new and inspected pre-owned machines with transparent pricing, finance help and test rides.</p>
              <div className="relative mt-5 max-w-xl lg:max-w-2xl">
                <label htmlFor="hero-search" className="sr-only">Search bikes</label>
                <input id="hero-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search — try “Classic 350” or “Duke”…" className="w-full rounded-full bg-white px-5 py-3.5 text-base text-[#17181a] shadow-lg" />
                {suggestions.length > 0 && (
                  <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-white text-left shadow-xl" aria-label="Search suggestions">
                    {suggestions.map((b) => (
                      <li key={b.id}><button type="button" onClick={() => openBike(b.id)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-[#17181a] hover:bg-[#f6f3ee]"><span>{b.year} {b.brand} {b.modelName}{hasReel(b) ? " 🎬" : ""}</span><span className="text-[#e8760a]">{inr(b.price)}</span></button></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#c9cdd4]">
                <span className="rounded-full border border-[#3a3d42] px-3 py-1.5">🏆 Since 1997</span>
                <span className="rounded-full border border-[#3a3d42] px-3 py-1.5">{bikes.length} bikes in stock</span>
                <span className="rounded-full border border-[#3a3d42] px-3 py-1.5">{brands.length} brands</span>
                {settingsQ.data?.hours && <span className="rounded-full border border-[#3a3d42] px-3 py-1.5">Open: {settingsQ.data.hours}</span>}
              </div>
            </div>
            {heroBikes.length > 0 && (
              <div
                className="relative"
                aria-label="Featured bikes — auto-swiping, swipe to browse"
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => { if (!heroResumeRef.current) setHeroPaused(false); }}
                onFocus={() => setHeroPaused(true)}
                onBlur={() => { if (!heroResumeRef.current) setHeroPaused(false); }}
                onTouchStart={() => pauseHeroAuto()}
              >
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 pb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#ffb066]">⭐ Featured bikes — auto-swiping · all {heroBikes.length}</p>
                  <p className="text-xs font-bold text-white/80" aria-live="polite">{safeHeroIdx + 1} / {heroBikes.length}</p>
                </div>
                <div
                  ref={heroScrollRef}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    if (el.clientWidth > 0) setHeroIdx(Math.round(el.scrollLeft / el.clientWidth));
                  }}
                  className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label="Featured bikes carousel"
                >
                  {heroBikes.map((hb, i) => (
                    <button key={hb.id} type="button" onClick={() => openBike(hb.id)} className="relative block w-full shrink-0 snap-center text-left" aria-label={`View featured ${hb.brand} ${hb.modelName}${hasReel(hb) ? " — reel available" : ""}`}>
                      <span className="relative block">
                        <BikePhoto bike={hb} className="h-60 w-full object-cover min-[480px]:h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[30rem]" />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-12 pb-5 pt-16 min-[480px]:px-14 md:px-16 lg:px-[max(3.5rem,calc((100vw-80rem)/2+3.5rem))]">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#ffb066]">Featured {i + 1} of {heroBikes.length} · {hb.brand}</span>
                            {hasReel(hb) && <ReelBadge size="sm" />}
                          </span>
                          <span className="font-display mt-1 block text-[1.35rem] font-extrabold leading-tight text-white min-[480px]:text-2xl sm:text-3xl lg:text-4xl">{hb.year} {hb.modelName} — {inr(hb.price)}</span>
                          <span className="mt-0.5 block text-sm font-semibold text-white/85">{hb.displacementCc} cc · {hb.condition === "NEW" ? "New" : `Pre-owned · ${hb.odometerKm.toLocaleString("en-IN")} km`} · {hb.color}{hasReel(hb) ? " · 🎬 Reel available" : ""}</span>
                          <span className="mt-2 inline-block rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">View this bike →</span>
                        </span>
                        <span className="absolute right-3 top-3"><StatusBadge status={hb.status} /></span>
                      </span>
                    </button>
                  ))}
                </div>
                {heroBikes.length > 1 && (
                  <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 right-0 mx-auto flex w-full max-w-7xl items-center justify-between px-2">
                      <button type="button" aria-label="Previous featured bike" onClick={() => scrollHeroTo(safeHeroIdx - 1)} className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-lg font-bold text-white backdrop-blur sm:h-10 sm:w-10 sm:text-xl">‹</button>
                      <button type="button" aria-label="Next featured bike" onClick={() => scrollHeroTo(safeHeroIdx + 1)} className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-lg font-bold text-white backdrop-blur sm:h-10 sm:w-10 sm:text-xl">›</button>
                    </div>
                    <span className="sr-only">Featured bikes auto-swipe every 2 seconds. Swipe or use the arrows to browse all featured bikes.</span>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Catalog */}
          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6" aria-label="Bike catalog">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">Browse bikes <span className="text-base font-bold text-[var(--dim)]">({filtered.length})</span></h2>
              <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text)]">⚙ Filters</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 pb-1" role="group" aria-label="Filter by brand">
              {["ALL", ...brands].map((b) => (
                <button key={b} type="button" onClick={() => setBrand(b)} aria-pressed={brand === b} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${brand === b ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>{b === "ALL" ? "All brands" : b}</button>
              ))}
            </div>
            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="f-cond" className="text-xs font-semibold text-[var(--dim)]">Condition</label>
                  <select id="f-cond" value={cond} onChange={(e) => setCond(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"><option value="ALL">New & Pre-owned</option><option value="NEW">New only</option><option value="PRE_OWNED">Pre-owned only</option></select>
                </div>
                <div>
                  <label htmlFor="f-cc" className="text-xs font-semibold text-[var(--dim)]">Engine size</label>
                  <select id="f-cc" value={ccBand} onChange={(e) => setCcBand(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"><option value="ALL">Any cc</option><option value="UNDER200">Under 200 cc</option><option value="200-400">200–400 cc</option><option value="400PLUS">Above 400 cc</option></select>
                </div>
                <div>
                  <label htmlFor="f-year" className="text-xs font-semibold text-[var(--dim)]">Year from</label>
                  <select id="f-year" value={yearMin} onChange={(e) => setYearMin(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"><option value={0}>Any year</option><option value={2025}>2025</option><option value={2024}>2024</option><option value={2023}>2023</option><option value={2022}>2022</option></select>
                </div>
                <div>
                  <label htmlFor="f-sort" className="text-xs font-semibold text-[var(--dim)]">Sort by</label>
                  <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"><option value="featured">Featured</option><option value="price-asc">Price: low → high</option><option value="price-desc">Price: high → low</option><option value="cc-desc">Engine: biggest first</option><option value="newest">Newest year</option></select>
                </div>
                <div className="col-span-1 min-[480px]:col-span-2 lg:col-span-4">
                  <label htmlFor="f-price" className="text-xs font-semibold text-[var(--dim)]">Max price: <span className="font-bold text-[var(--text)]">{inr(maxPrice)}</span></label>
                  <input id="f-price" type="range" min={100000} max={350000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-1 w-full" />
                </div>
              </div>
            )}

            {bikesQ.isPending && <p className="py-10 text-center text-sm text-[var(--dim)]">Loading the showroom…</p>}
            {bikesQ.isError && <p className="py-10 text-center text-sm text-[#b3261e]">Could not load bikes. <button type="button" className="font-bold underline" onClick={() => void bikesQ.refetch()}>Retry</button></p>}
            {!bikesQ.isPending && !bikesQ.isError && filtered.length === 0 && <p className="py-10 text-center text-sm text-[var(--dim)]">No bikes match those filters — try widening the price or brand.</p>}
            <div className="mt-4 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {filtered.map((b) => {
                const saved = myData.data?.wishlistBikeIds.includes(b.id) ?? false;
                return (
                  <article key={b.id} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
                    <button type="button" onClick={() => openBike(b.id)} className="relative block w-full text-left" aria-label={`View ${b.year} ${b.brand} ${b.modelName}${hasReel(b) ? " — reel available" : ""}`}>
                      <BikePhoto bike={b} className="aspect-[16/10] w-full object-cover" />
                      <span className="absolute left-3 top-3"><StatusBadge status={b.status} /></span>
                      {b.isFeatured && <span className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-white">Featured</span>}
                      {hasReel(b) && <span className="absolute bottom-3 left-3"><ReelBadge size="sm" /></span>}
                      {hasReel(b) && <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-base shadow" aria-hidden="true">▶</span>}
                    </button>
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{b.brand} · {b.year} · {b.condition === "NEW" ? "New" : "Pre-owned"}</p>
                      <h3 className="font-display mt-0.5 flex flex-wrap items-center gap-2 text-xl font-extrabold text-[var(--text)]">{b.modelName}{hasReel(b) && <ReelBadge size="sm" />}</h3>
                      <p className="mt-1 text-sm text-[var(--dim)]">{b.displacementCc} cc · {b.mileageKmpl ? `${b.mileageKmpl} km/l` : ""}{b.condition === "PRE_OWNED" ? ` · ${b.odometerKm.toLocaleString("en-IN")} km` : ""} · {b.color}</p>
                      {hasReel(b) && <p className="mt-1.5 text-xs font-bold text-[#c13584]">🎬 Reel available — tap to watch this bike&apos;s reel</p>}
                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-display text-xl font-extrabold text-[var(--text)]">{inr(b.price)}</p>
                        <div className="flex gap-1.5">
                          <button type="button" aria-label={saved ? `Remove ${b.modelName} from wishlist` : `Save ${b.modelName} to wishlist`} onClick={() => { if (!account) { setView({ kind: "account" }); return; } void api.toggleWishlist({ accountId: account.id, bikeId: b.id }).then(() => qc.invalidateQueries({ queryKey: ["myData"] })); }} className="rounded-full border border-[var(--border)] px-3.5 py-2 text-base">{saved ? "♥" : "♡"}</button>
                          <button type="button" onClick={() => openBike(b.id)} className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--ink-text)]">View →</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Enquiry form */}
          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-8" aria-label="Send an enquiry">
            <div className="rounded-3xl bg-[var(--ink)] p-5 text-[var(--ink-text)] sm:p-7">
              <h2 className="font-display text-2xl font-extrabold">Ask about any bike</h2>
              <p className="mt-1 text-sm text-[#c9cdd4]">Price, finance, exchange or a test ride — send an enquiry and the team replies on chat or call.</p>
              <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); formEnquiry.mutate(); }}>
                <div>
                  <label htmlFor="enq-name" className="text-xs font-semibold text-[#c9cdd4]">Your name</label>
                  <input id="enq-name" required value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-[#17181a]" placeholder="Full name" />
                </div>
                <div>
                  <label htmlFor="enq-phone" className="text-xs font-semibold text-[#c9cdd4]">Phone number</label>
                  <input id="enq-phone" required minLength={7} inputMode="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-[#17181a]" placeholder="Mobile number" />
                </div>
                <div>
                  <label htmlFor="enq-bike" className="text-xs font-semibold text-[#c9cdd4]">Bike (optional)</label>
                  <select id="enq-bike" value={formBike} onChange={(e) => setFormBike(e.target.value)} className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-[#17181a]">
                    <option value="">General enquiry</option>
                    {bikes.map((b) => <option key={b.id} value={b.id}>{b.year} {b.brand} {b.modelName} — {inr(b.price)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="enq-msg" className="text-xs font-semibold text-[#c9cdd4]">Message</label>
                  <input id="enq-msg" value={formMsg} onChange={(e) => setFormMsg(e.target.value)} className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-[#17181a]" placeholder="e.g. Best on-road price? EMI options?" />
                </div>
                <button type="submit" disabled={formEnquiry.isPending} className="rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4">Send enquiry</button>
                {formDone && <p role="status" className="text-sm font-semibold text-[#ffb066] sm:col-span-2 xl:col-span-4">{formDone}</p>}
              </form>
            </div>
          </section>

          {/* Visit the showroom */}
          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-8" aria-label="Visit the showroom">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Since 1997 · Proddatur</p>
              <h2 className="font-display mt-1 text-2xl font-extrabold text-[var(--text)]">Visit the showroom</h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--text)]">{settingsQ.data?.address || "Opposite Panduranga Temple, Mydukur Road, Proddatur - 516360, Andhra Pradesh"}</p>
              {settingsQ.data?.hours && <p className="mt-1 text-sm text-[var(--dim)]">Open: {settingsQ.data.hours}</p>}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {telLink(settingsQ.data) && (
                  <a href={telLink(settingsQ.data)!} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3.5" aria-label="Call KGN Premium Bikes on 81069 00126">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white"><PhoneLogo className="h-6 w-6" /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wide text-[var(--dim)]">Call</span>
                      <span className="block truncate text-base font-extrabold text-[var(--text)]">81069 00126</span>
                    </span>
                    <span className="ml-auto shrink-0 text-sm font-bold text-[var(--accent)]">Call now →</span>
                  </a>
                )}
                {waLink(settingsQ.data) && (
                  <a href={waLink(settingsQ.data)!} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3.5" aria-label="WhatsApp KGN Premium Bikes on 91330 91389">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25d366] text-white"><WhatsAppLogo className="h-7 w-7" /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wide text-[var(--dim)]">WhatsApp</span>
                      <span className="block truncate text-base font-extrabold text-[var(--text)]">91330 91389</span>
                    </span>
                    <span className="ml-auto shrink-0 text-sm font-bold text-[#128c4a]">Chat →</span>
                  </a>
                )}
                {settingsQ.data?.whatsappNumber2 && digits(settingsQ.data.whatsappNumber2) !== digits(settingsQ.data.whatsappNumber) && (
                  <a href={`https://wa.me/91${digits(settingsQ.data.whatsappNumber2).slice(-10)}?text=${encodeURIComponent("Hi KGN Premium Bikes, I'd like to know more about your bikes.")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3.5" aria-label="WhatsApp KGN Premium Bikes on 81069 00126">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25d366] text-white"><WhatsAppLogo className="h-7 w-7" /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wide text-[var(--dim)]">WhatsApp</span>
                      <span className="block truncate text-base font-extrabold text-[var(--text)]">81069 00126</span>
                    </span>
                    <span className="ml-auto shrink-0 text-sm font-bold text-[#128c4a]">Chat →</span>
                  </a>
                )}
                {settingsQ.data?.instagramHandle && (
                  <a href={`https://www.instagram.com/${settingsQ.data.instagramHandle}/`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3.5" aria-label={`Instagram @${settingsQ.data.instagramHandle}${settingsQ.data.instagramFollowers ? `, ${settingsQ.data.instagramFollowers} followers` : ""}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}><InstagramLogo className="h-7 w-7" /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wide text-[var(--dim)]">Instagram</span>
                      <span className="block truncate text-base font-extrabold text-[var(--text)]">@{settingsQ.data.instagramHandle}</span>
                      {settingsQ.data.instagramFollowers && <span className="block text-sm font-semibold text-[var(--dim)]">{settingsQ.data.instagramFollowers} followers</span>}
                    </span>
                    <span className="ml-auto hidden shrink-0 text-sm font-bold text-[#c13584] min-[480px]:block">Follow →</span>
                  </a>
                )}
              </div>
              <div className="mt-3">
                <a href="https://www.google.com/maps/search/?api=1&query=KGN+Premium+Bikes+Opposite+Panduranga+Temple+Mydukur+Road+Proddatur+516360" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--text)]"><MapPinLogo className="h-4 w-4 text-[var(--accent)]" />Get directions</a>
              </div>
              <p className="mt-3 text-xs text-[var(--dim)]">Trusted by riders across Kadapa district since 1997 — walk in for a test ride, finance help and exchange valuations.</p>
            </div>
          </section>

          {/* Customer reviews — public list; only signed-in customers can add one */}
          <ReviewsSection account={account} bikes={bikes} onNeedAccount={() => setView({ kind: "account" })} />

          {/* About KGN + Team */}
          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10" aria-label="About KGN Premium Bikes and our team">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Since 1997 · Proddatur · Trusted by riders</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold leading-snug text-[var(--text)] sm:text-3xl">Your dream bike is already here —<br className="hidden sm:block" /> you just have to come and ride it home</h2>

            {/* Impressive, customer-facing lines about KGN — the dream-bike
                line above is the section heading (it appears ONLY there);
                this panel carries the supporting story, not a repeat. */}
            <div className="mt-4 overflow-hidden rounded-3xl bg-[var(--ink)] p-5 text-[var(--ink-text)] sm:p-7">
              <p className="max-w-3xl text-base leading-relaxed text-[#d7dade]">For nearly three decades, <span className="font-bold text-white">KGN Premium Bikes</span> has been where Proddatur comes to find its next ride. Royal Enfield, KTM, Honda, Bajaj, Hero, Yamaha and more — every major brand, new and handpicked pre-owned, under one roof. No running from showroom to showroom. No guesswork. Just the right bike, at the right price, from people who treat you like family.</p>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#d7dade]">Every pre-owned bike here is checked, priced honestly and shown exactly as it is — real photos, real reels, real kilometres. See it online, watch its reel, chat with us, book a test ride, sort finance and exchange in one visit — and ride home the same day.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white">🏍️ Every brand · One showroom</span>
                <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white">✓ Inspected pre-owned bikes</span>
                <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white">💬 Finance &amp; exchange help</span>
                <span className="rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-white">Since 1997 — 28+ years of trust</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Handpicked & checked", "Every bike — new or pre-owned — is inspected at the showroom before it is listed, so what you see online is exactly what you ride."],
                ["Honest price, full help", "Clear pricing, finance options explained in simple words, and a fair valuation for your old bike in exchange. No hidden surprises."],
                ["Family, not just customers", "From your first enquiry to your first service, the KGN family stays with you. That's why riders across Kadapa district keep coming back."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="font-display text-sm font-extrabold text-[var(--text)]">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--dim)]">{d}</p>
                </div>
              ))}
            </div>

            {/* Team — 3 members for now, sample photos as placeholders */}
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">The people behind KGN</p>
              <h3 className="font-display mt-1 text-xl font-extrabold text-[var(--text)] sm:text-2xl">Meet the family that runs your showroom</h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--dim)]">Three people, one promise — the right bike for every rider, and a relationship that lasts long after you ride home.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    img: imgTeamFounder,
                    alt: "Sample portrait for the Founder of KGN Premium Bikes",
                    role: "Founder",
                    title: "The Founder",
                    about: "Started KGN Premium Bikes in 1997 with a simple belief — sell every bike like you're selling it to your own family. That honesty is still the foundation of the showroom today.",
                  },
                  {
                    img: imgTeamCeo,
                    alt: "Sample portrait for the CEO of KGN Premium Bikes",
                    role: "CEO",
                    title: "The CEO",
                    about: "Leads the showroom day to day — handpicking every bike, keeping prices fair, and making sure every customer gets time, a test ride and a straight answer.",
                  },
                  {
                    img: imgTeamTreasurer,
                    alt: "Sample portrait for the Treasurer of KGN Premium Bikes",
                    role: "Treasurer",
                    title: "The Treasurer",
                    about: "Looks after finance and accounts — arranging easy EMI options, fair exchange values and clear paperwork, so buying your dream bike never feels complicated.",
                  },
                ].map((m) => (
                  <article key={m.role} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="relative">
                      <img src={m.img} alt={m.alt} className="aspect-[4/3] w-full object-cover object-top" loading="lazy" />
                      <span className="absolute left-3 top-3 rounded-full bg-[var(--ink)]/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">{m.role}</span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display text-base font-extrabold text-[var(--text)]">{m.title}</h4>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{m.role} · KGN Premium Bikes</p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--dim)]">{m.about}</p>
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--dim)]">Sample photos shown for now — real team photos and names will replace them here.</p>
            </div>

            {/* About ZENTRO Technologies — narrow rectangle banner about the
                developer of this website, placed directly after the team
                section so viewers and other business owners can see who
                built this site. Only confirmed ZENTRO facts are used (name,
                tagline, founder, service pillars from its brief); no ZENTRO
                email / phone / socials are shown because none are confirmed. */}
            <aside className="relative mt-8 overflow-hidden rounded-2xl bg-[#090B0F] px-5 py-5 text-[#F5F6F8] sm:px-6" aria-label="About ZENTRO Technologies, the developer of this website">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-[#397BFF]" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-4 sm:shrink-0">
                  <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center border-2 border-[#397BFF] font-display text-2xl font-black leading-none text-white">Z</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#397BFF]">About the developer</p>
                    <p className="font-display mt-0.5 text-lg font-extrabold leading-tight text-[#F5F6F8] sm:text-xl">ZENTRO Technologies</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#C6CBD2]">Building the foundation of tomorrow.</p>
                  </div>
                </div>
                <div className="min-w-0 sm:flex-1">
                  <p className="text-sm leading-relaxed text-[#C6CBD2]">This website was designed and developed by <span className="font-bold text-white">ZENTRO Technologies</span>, founded by Abdul Hadi, Founder &amp; CEO — a reliable technology partner for businesses looking to scale. <span className="text-[#F5F6F8]">Build with purpose. Deliver with precision. Grow with vision.</span></p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["Websites for businesses", "Brand & digital experience", "Business technology & automation", "Growth & support"].map((s) => (
                      <span key={s} className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-[#C6CBD2]">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 border-t border-white/10 pt-3 sm:max-w-[220px] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <p className="font-display text-sm font-extrabold leading-snug text-white">Need a website like this for your business?</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#C6CBD2]">Contact <span className="font-bold text-white">ZENTRO Technologies</span> — the team that developed this site.</p>
                </div>
              </div>
            </aside>
            <p className="mt-6 border-t border-[var(--border)] pt-4 text-center text-xs font-semibold text-[var(--dim)]">© {new Date().getFullYear()} KGN Premium Bikes. All rights reserved.</p>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--dim)]">Website developed by <span className="font-semibold text-[var(--text)]">ZENTRO Technologies</span> — Building the foundation of tomorrow. Need a website like this for your business? Contact ZENTRO Technologies.</p>
          </section>
        </main>
      )}
    </div>
  );
}
