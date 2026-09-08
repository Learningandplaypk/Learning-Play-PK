"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Flame,
  Gamepad2,
  GraduationCap,
  Heart,
  Info,
  Moon,
  Search,
  Settings,
  Star,
  Sun,
  Timer,
  TriangleAlert,
  Trophy,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  DifficultyDots,
  EmptyState,
  Input,
  Label,
  Modal,
  Progress,
  SectionHeading,
  Sheet,
  Skeleton,
  StatTile,
  Surface,
  Tabs,
  Textarea,
} from "@/components/ui";
import { Ustad, ZoneArt, LogoMark } from "@/components/brand/ustad";
import { useTheme, type ThemeChoice } from "@/lib/theme";

function Swatch({ label, cssVar, note }: { label: string; cssVar: string; note?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-10 w-10 shrink-0 rounded-[10px] border border-line"
        style={{ background: `var(${cssVar})` }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-fg">{label}</div>
        <div className="text-xs text-muted">
          {cssVar}
          {note ? ` · ${note}` : ""}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  sub,
  children,
  id,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="border-t border-line py-10 first:border-t-0">
      <SectionHeading title={title} sub={sub} />
      {children}
    </section>
  );
}

export function StyleGuide() {
  const { choice, theme, setChoice } = useTheme();
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<"weekly" | "all" | "friends">("weekly");

  return (
    <div className="container-page page-pad pb-24 pt-8">
      {/* header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-ink">Learn &amp; Play PK</p>
          <h1 className="mt-1 font-display text-4xl font-black text-fg">Playful Pro — style guide</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            One brand colour (Pakistan Green), one accent (Saffron), semantic colours used only for their meaning.
            Light by default, real dark mode. Currently: <b className="text-fg">{theme}</b>.
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs<ThemeChoice>
            tabs={[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
              { id: "system", label: "System" },
            ]}
            value={choice}
            onChange={setChoice}
          />
          <Link href="/" className="btn btn-secondary btn-sm">
            Back to app
          </Link>
        </div>
      </div>

      {/* colours */}
      <Section title="Colour" sub="Brand + accent first; semantic colours only carry meaning.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-fg">Brand &amp; accent</h3>
            <div className="grid gap-3">
              <Swatch label="Brand" cssVar="--brand" note="#178A55" />
              <Swatch label="Brand ink (text)" cssVar="--brand-ink" note="AA on bg" />
              <Swatch label="Brand solid (fills)" cssVar="--brand-solid" note="white text ≥4.5:1" />
              <Swatch label="Brand tint" cssVar="--brand-tint" note="#E6F4EC" />
              <Swatch label="Accent" cssVar="--accent" note="#F5A524" />
              <Swatch label="Accent ink (text)" cssVar="--accent-ink" />
              <Swatch label="Accent tint" cssVar="--accent-tint" note="#FEF3DC" />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-fg">Semantic</h3>
            <div className="grid gap-3">
              <Swatch label="Success" cssVar="--success" note="correct answers" />
              <Swatch label="Danger" cssVar="--danger" note="wrong answers, destructive" />
              <Swatch label="Warning" cssVar="--warning" note="expiring, needs attention" />
              <Swatch label="Info" cssVar="--info" note="neutral hints" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Chip tone="brand">
                <BadgeCheck size={13} strokeWidth={2.4} /> Correct
              </Chip>
              <Chip tone="danger">
                <TriangleAlert size={13} strokeWidth={2.4} /> Wrong
              </Chip>
              <Chip tone="accent">
                <Flame size={13} strokeWidth={2.4} /> 7 day streak
              </Chip>
              <Chip tone="info">
                <Info size={13} strokeWidth={2.4} /> Hint available
              </Chip>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-fg">Neutrals</h3>
            <div className="grid gap-3">
              <Swatch label="Background" cssVar="--bg" />
              <Swatch label="Surface" cssVar="--surface" />
              <Swatch label="Surface 2" cssVar="--surface-2" />
              <Swatch label="Border" cssVar="--border" />
              <Swatch label="Text" cssVar="--text" />
              <Swatch label="Muted" cssVar="--muted" />
            </div>
          </Card>
        </div>
      </Section>

      {/* type */}
      <Section title="Type" sub="Nunito 800/900 for headings and game numbers, Inter for body, Noto Nastaliq for Urdu.">
        <Card className="p-5">
          <div className="grid gap-4">
            {[
              { cls: "text-4xl", label: "48 / display 900", sample: "Khelo. Seekho. Jeeto." },
              { cls: "text-3xl", label: "36 / display 800", sample: "Learn Zone" },
              { cls: "text-2xl", label: "28 / display 800", sample: "Today's challenges" },
              { cls: "text-xl", label: "22 / display 800", sample: "Word Builder" },
              { cls: "text-lg", label: "18 / body 600", sample: "Urdu meaning dekh kar word banao" },
              { cls: "text-base", label: "16 / body 400", sample: "Sab kuch free — premium sirf tajurba behtar karta hai." },
              { cls: "text-sm", label: "14 / body 400", sample: "Aaj ke 3 lessons mukammal — shabash!" },
              { cls: "text-xs", label: "12 / body 500", sample: "STREAK · XP · COINS" },
            ].map((t) => (
              <div key={t.label} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-line pb-3 last:border-0 last:pb-0">
                <span className="w-44 shrink-0 text-xs text-muted">{t.label}</span>
                <span className={`${t.cls} ${t.cls.startsWith("text-2") || t.cls.startsWith("text-3") || t.cls.startsWith("text-4") ? "font-display font-extrabold" : ""} text-fg`}>
                  {t.sample}
                </span>
              </div>
            ))}
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="w-44 shrink-0 text-xs text-muted">Urdu / RTL</span>
              <span className="urdu text-lg text-fg">کھیلو۔ سیکھو۔ جیتو۔ — اردو میں خوش آمدید</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* buttons */}
      <Section title="Buttons" sub="Chunky 4px bottom edge, presses down 2px. Nothing floats, nothing glows.">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Zap size={18} strokeWidth={2.4} /> Shuru karo
            </Button>
            <Button variant="secondary">
              <Gamepad2 size={18} strokeWidth={2.2} /> Games dekho
            </Button>
            <Button variant="ghost">Baad mein</Button>
            <Button variant="danger">Reset progress</Button>
            <Button disabled>Locked</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="sm" variant="secondary">
              Small secondary
            </Button>
            <Button size="lg">Large — 56px</Button>
            <ButtonLink href="/fun" variant="secondary" size="sm">
              Link button <ArrowRight size={16} strokeWidth={2.4} />
            </ButtonLink>
          </div>
          <div className="mt-5 max-w-sm">
            <Button block>Block button</Button>
          </div>
          <p className="mt-4 text-xs text-muted">
            Every hit target is ≥44px. Press feedback is a 2px translate + shortened edge — 120ms ease-out, and
            disabled under <code>prefers-reduced-motion</code>.
          </p>
        </Card>
      </Section>

      {/* cards */}
      <Section title="Cards & stat tiles" sub="1px border, 16px radius, two shadows only (sm / md).">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={<Zap size={20} strokeWidth={2.4} />} value="12,480" label="Total XP" tone="brand" />
          <StatTile icon={<Flame size={20} strokeWidth={2.4} />} value="21" label="Day streak" tone="accent" />
          <StatTile icon={<Gamepad2 size={20} strokeWidth={2.4} />} value="184" label="Games played" />
          <StatTile icon={<Trophy size={20} strokeWidth={2.4} />} value="9" label="Badges" tone="info" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* game card */}
          <Card className="flex flex-col p-4">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-tint">
              <ZoneArt zone="learn" className="h-8 w-8" />
            </span>
            <h3 className="font-display text-base font-extrabold text-fg">Word Builder</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted">Letter tiles se word banao — Urdu meaning dekh kar.</p>
            <div className="mt-3 flex items-center gap-2">
              <DifficultyDots level={2} />
              <span className="text-[11px] text-muted">Medium</span>
            </div>
            <Button size="sm" className="mt-4 w-full">
              Play
            </Button>
          </Card>
          <Card className="flex flex-col p-4">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-tint">
              <ZoneArt zone="brain" className="h-8 w-8" />
            </span>
            <h3 className="font-display text-base font-extrabold text-fg">Sudoku</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted">Unique generated puzzles, 3 difficulty levels.</p>
            <div className="mt-3 flex items-center gap-2">
              <DifficultyDots level={3} />
              <span className="text-[11px] text-muted">Hard</span>
            </div>
            <Button size="sm" variant="secondary" className="mt-4 w-full">
              Play
            </Button>
          </Card>
          <Surface className="flex flex-col justify-between p-4">
            <div>
              <h3 className="text-sm font-bold text-fg">Surface 2 tile</h3>
              <p className="mt-1 text-xs text-muted">Rows, grouped stats and quiet blocks use surface-2 — no shadow.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Chip>
                <Timer size={12} strokeWidth={2.4} /> 60s
              </Chip>
              <Chip>
                <Heart size={12} strokeWidth={2.4} /> 3 hearts
              </Chip>
            </div>
          </Surface>
        </div>
      </Section>

      {/* inputs */}
      <Section title="Inputs & filters" sub="16px text so iOS never zooms. 3px brand focus ring.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="sg-name">Name</Label>
                <Input id="sg-name" placeholder="Apna naam likho" />
              </div>
              <div>
                <Label htmlFor="sg-email">Email</Label>
                <Input id="sg-email" type="email" placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="sg-msg">Message</Label>
                <Textarea id="sg-msg" placeholder="Kuch likho…" />
              </div>
              <div>
                <Label htmlFor="sg-bad">Invalid state</Label>
                <Input id="sg-bad" defaultValue="wrong" aria-invalid className="border-danger focus:shadow-[0_0_0_3px_var(--danger-tint)]" />
                <p className="mt-1 text-xs text-danger-ink">Yeh field theek nahi hai.</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="relative">
              <Search size={18} strokeWidth={2.2} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input placeholder="Games dhoondo…" className="ps-10" aria-label="Search games" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Sab", "Learn", "Brain", "Quiz", "Fun", "Naye", "Mashhoor"].map((f, i) => (
                <button key={f} type="button" className="filter-chip" aria-pressed={i === 0}>
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>Lesson 4 of 10</span>
                <span>40%</span>
              </div>
              <Progress value={40} />
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>Streak progress</span>
                <span>70%</span>
              </div>
              <Progress value={70} tone="accent" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Tabs<"weekly" | "all" | "friends">
                tabs={[
                  { id: "weekly", label: "Weekly" },
                  { id: "all", label: "All-time" },
                  { id: "friends", label: "Friends" },
                ]}
                value={tab}
                onChange={setTab}
              />
            </div>
          </Card>
        </div>
      </Section>

      {/* overlays */}
      <Section title="Overlays" sub="Modal on desktop, bottom sheet on mobile. Both close on Escape and backdrop tap.">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
        </div>

        <Modal open={modal} onClose={() => setModal(false)} title="Level up!">
          <div className="flex flex-col items-center text-center">
            <Ustad mood="celebrate" className="h-24 w-24" />
            <p className="mt-2 text-sm text-muted">
              Celebrations are the one place confetti is allowed — brand green + saffron only, and skipped entirely
              when the user prefers reduced motion.
            </p>
            <Button className="mt-5 w-full" onClick={() => setModal(false)}>
              Chalo, aur aage!
            </Button>
          </div>
        </Modal>

        <Sheet
          open={sheet}
          onClose={() => setSheet(false)}
          title="Lesson 4 — Daily routine"
          footer={
            <Button block onClick={() => setSheet(false)}>
              Lesson shuru karo
            </Button>
          }
        >
          <p className="text-sm leading-relaxed text-muted">
            Is lesson mein 8 words hain: subah, shaam, nahana, khana, sona… Har sahi jawab par +10 XP aur streak barhta
            hai.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-fg">
            {["8 new words", "Urdu meanings ke sath", "2 minutes"].map((i) => (
              <li key={i} className="flex items-center gap-2">
                <Check size={16} strokeWidth={2.6} className="text-brand-ink" /> {i}
              </li>
            ))}
          </ul>
        </Sheet>
      </Section>

      {/* empty / error / offline */}
      <Section title="Empty, error & offline states" sub="One mascot, one line, one action — identical everywhere.">
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            title="Koi progress nahi mili"
            body="Pehla game khelo — sab kuch yahin save hoga."
            icon={<Ustad mood="happy" className="h-20 w-20" />}
            action={<Button size="sm">Pehla game khelo</Button>}
          />
          <EmptyState
            title="Internet nahi mil raha"
            body="Offline mode chal raha hai — saved lessons abhi bhi khulenge."
            icon={<Ustad mood="think" className="h-20 w-20" />}
            action={
              <Button size="sm" variant="secondary">
                <WifiOff size={16} strokeWidth={2.2} /> Offline games
              </Button>
            }
          />
          <EmptyState
            title="Abhi kuch nahi mila"
            body="Filter hatao ya doosra zone try karo."
            icon={<Ustad mood="sad" className="h-20 w-20" />}
            action={
              <Button size="sm" variant="secondary">
                Filters clear karo
              </Button>
            }
          />
        </div>
      </Section>

      {/* icons + motion + loading */}
      <Section title="Icons, loading & motion" sub="lucide-react at 20/24px, stroke 2. Emoji only inside learning content and celebrations.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4 text-fg">
              {[
                { I: GraduationCap, l: "Learn" },
                { I: Gamepad2, l: "Play" },
                { I: Trophy, l: "Rank" },
                { I: Flame, l: "Streak" },
                { I: Zap, l: "XP" },
                { I: Star, l: "Badge" },
                { I: Settings, l: "Settings" },
                { I: Sun, l: "Light" },
                { I: Moon, l: "Dark" },
                { I: Heart, l: "Hearts" },
              ].map(({ I, l }) => (
                <span key={l} className="flex flex-col items-center gap-1 text-[11px] text-muted">
                  <I size={24} strokeWidth={2} />
                  {l}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-4">
              <LogoMark className="h-10 w-10" />
              <Ustad className="h-14 w-14" />
              <div className="flex gap-2">
                {(["learn", "brain", "quiz", "fun"] as const).map((z) => (
                  <span key={z} className="grid h-12 w-12 place-items-center rounded-xl bg-brand-tint">
                    <ZoneArt zone={z} className="h-8 w-8" />
                  </span>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Skeletons</p>
            <div className="grid gap-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Motion budget: 100ms page fade, ≤200ms everything else, ease-out. Nothing loops or floats. Everything
              non-essential is disabled under <code>prefers-reduced-motion</code>.
            </p>
          </Card>
        </div>
      </Section>

      {/* spacing / shape */}
      <Section title="Shape, depth & spacing" sub="4pt grid · radius 12 (cards 16, chips pill) · two shadows.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-end gap-3">
              {[
                { r: 8, l: "8" },
                { r: 12, l: "12" },
                { r: 16, l: "16" },
                { r: 999, l: "pill" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col items-center gap-2">
                  <span
                    className="grid h-16 w-16 place-items-center border border-line bg-surface-2 text-xs text-muted"
                    style={{ borderRadius: s.r }}
                  >
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex gap-6">
              <div className="shadow-sm grid h-20 w-20 place-items-center rounded-card border border-line bg-surface text-xs text-muted">
                shadow-sm
              </div>
              <div className="shadow-md grid h-20 w-20 place-items-center rounded-card border border-line bg-surface text-xs text-muted">
                shadow-md
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <span className="block w-4 bg-brand" style={{ height: n * 4 }} />
                  <span className="text-[10px] text-muted">{n * 4}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Page padding: 16px mobile · 24px tablet · max-width 1120px.</p>
          </Card>
        </div>
      </Section>
    </div>
  );
}
