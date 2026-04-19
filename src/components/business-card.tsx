"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BusinessCardProps {
  className?: string;
}

export function BusinessCard({ className }: BusinessCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[320px] sm:max-w-[360px] [perspective:1400px]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={flipped ? "Show front of card" : "Show back of card"}
        className={cn(
          "relative block w-full cursor-pointer",
          "aspect-[5/7.2]",
          "transition-transform duration-500 ease-out [transform-style:preserve-3d]",
          flipped
            ? "[transform:rotateY(180deg)] hover:[transform:rotateY(188deg)]"
            : "hover:[transform:rotateY(-8deg)]",
        )}
      >
        <CardFront />
        <CardBack />
      </button>
    </div>
  );
}

function CardFront() {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden rounded-[22px] border border-border/70",
        "[backface-visibility:hidden] [-webkit-backface-visibility:hidden]",
        "bg-card text-card-foreground",
        "shadow-[0_22px_55px_-25px_rgba(0,0,0,0.28),0_6px_16px_-8px_rgba(0,0,0,0.12)]",
        "dark:shadow-[0_32px_70px_-22px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)]",
      )}
    >
      <RabbitMark />

      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <AvatarFrame />
      </div>

      <div className="flex flex-1 gap-4 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-sans text-[22px] font-extrabold leading-none tracking-tight text-foreground sm:text-[24px]">
            AI KIMHOJIN
          </h1>
          <div className="mt-2 h-px w-full bg-foreground/80" />

          <dl className="mt-3.5 space-y-3">
            <Field label="Born On Pika" value="APR 19, 2026" />
            <Field label="Status" value="ALIVE" />
            <Field
              label="Find Me On"
              value="PIKA.ME/U/HOJIN.CODES.PRO"
            />
          </dl>
        </div>

        <Barcode />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-[11.5px] tracking-tight text-muted-foreground">
        {value}
      </dd>
    </div>
  );
}

function RabbitMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="absolute right-4 top-4 h-5 w-5 text-foreground"
    >
      <path
        fill="currentColor"
        d="M10 32 C 8 24, 10 18, 14 16 L 12 8 Q 12 6, 14 6 Q 16 6, 17 10 L 18 14 Q 20 13, 22 14 L 23 10 Q 24 6, 26 6 Q 28 6, 28 8 L 26 16 C 30 18, 34 22, 34 28 C 34 32, 30 34, 24 34 L 16 34 C 12 34, 10 33, 10 32 Z M 28 24 Q 30 24, 30 26 Q 30 28, 28 28 Q 26 28, 26 26 Q 26 24, 28 24 Z"
      />
    </svg>
  );
}

function AvatarFrame() {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        "aspect-[4/4.2]",
        "bg-[linear-gradient(170deg,#f6f6f4_0%,#eceeec_100%)]",
        "dark:bg-[linear-gradient(170deg,#2a2f36_0%,#1a1d22_100%)]",
        "border border-border/50",
      )}
    >
      <Image
        src="/images/avatar/hojin.png"
        alt="Kim Hojin"
        fill
        priority
        sizes="(max-width: 640px) 280px, 320px"
        className="object-cover object-top"
      />
    </div>
  );
}

function Barcode() {
  const bars = useMemo(() => {
    return [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 3, 1, 2];
  }, []);

  return (
    <div className="flex flex-col items-center justify-end gap-1 self-end pb-1">
      <div
        className="flex h-[160px] items-stretch gap-[1.5px]"
        aria-hidden="true"
      >
        {bars.map((w, i) => (
          <div
            key={i}
            className="h-full bg-foreground"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    </div>
  );
}

const EXPERIENCE = [
  { company: "Polaris Office", role: "Frontend Engineer", period: "2024 — now" },
  { company: "Previous Co.", role: "Software Engineer", period: "2022 — 2024" },
  { company: "First Gig", role: "Intern", period: "2021" },
];

const STACK = ["react", "next.js", "typescript", "tailwind", "node"];

function CardBack() {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[22px] border border-border/70",
        "[backface-visibility:hidden] [-webkit-backface-visibility:hidden]",
        "[transform:rotateY(180deg)]",
        "bg-card text-foreground",
        "shadow-[0_28px_70px_-22px_rgba(0,0,0,0.3)]",
        "dark:shadow-[0_32px_70px_-22px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)]",
      )}
    >
      <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Curriculum Vitae
          </p>
          <h2 className="mt-1 font-sans text-[20px] font-semibold tracking-tight text-foreground">
            harvey.h.kim
          </h2>
          <div className="mt-3 h-px w-full bg-border/70" />
        </header>

        <section className="flex-1 pt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            experience
          </p>
          <ul className="space-y-1.5">
            {EXPERIENCE.map((item) => (
              <li
                key={item.company}
                className="font-mono text-[12px] leading-relaxed"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-foreground">
                    {item.company}
                  </span>
                  <span className="shrink-0 text-muted-foreground/80 text-[11px]">
                    {item.period}
                  </span>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  {item.role}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            stack
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {STACK.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between pt-4 font-mono text-[10px] text-muted-foreground">
          <span>harvey.h.kim@polarisoffice.com</span>
          <span className="text-muted-foreground/70">← flip</span>
        </footer>
      </div>
    </div>
  );
}
