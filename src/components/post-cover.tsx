import Image from "next/image";
import { cn } from "@/lib/utils";

interface PostCoverProps {
  src?: string;
  alt?: string;
  seed: string;
  label?: string;
  className?: string;
  sizes?: string;
}

const GRADIENTS: readonly string[] = [
  "linear-gradient(135deg, oklch(0.35 0.12 155) 0%, oklch(0.18 0.08 200) 100%)",
  "linear-gradient(160deg, oklch(0.32 0.14 50) 0%, oklch(0.2 0.1 290) 100%)",
  "linear-gradient(120deg, oklch(0.28 0.1 260) 0%, oklch(0.38 0.13 155) 100%)",
  "linear-gradient(145deg, oklch(0.4 0.13 85) 0%, oklch(0.22 0.09 340) 100%)",
  "linear-gradient(135deg, oklch(0.3 0.11 180) 0%, oklch(0.38 0.14 20) 100%)",
  "linear-gradient(155deg, oklch(0.35 0.15 310) 0%, oklch(0.24 0.08 130) 100%)",
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function PostCover({
  src,
  alt,
  seed,
  label,
  className,
  sizes,
}: PostCoverProps) {
  const idx = hashSeed(seed) % GRADIENTS.length;
  const bg = GRADIENTS[idx];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/40",
        className,
      )}
      style={src ? undefined : { background: bg }}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes ?? "(max-width: 640px) 100vw, 50vw"}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-end p-4">
          <span className="font-mono text-xs text-white/70">
            {label ? `# ${label}` : "// no cover"}
          </span>
        </div>
      )}
    </div>
  );
}
