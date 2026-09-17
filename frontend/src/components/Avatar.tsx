import { initials } from "../theme";

// Renders a member's photo when they have uploaded one (a URL stored on their
// server-side profile); otherwise falls back to the initials bubble.
// `size` overrides the box with inline pixel styles; otherwise className wins.
export function Avatar({
  avatar, name, className = "h-8 w-8 text-[11px]", ring = false, size,
}: { avatar?: string; name?: string; className?: string; ring?: boolean; size?: number }) {
  const isUrl = !!avatar && /^https?:\/\//i.test(avatar);
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.38) } as const : undefined;
  const cls = `inline-flex items-center justify-center overflow-hidden rounded-full select-none ${ring ? "ring-2 ring-white" : ""} ${className} ${isUrl ? "" : "bg-slate-700 font-bold text-white"}`;
  if (isUrl) {
    return <img src={avatar} alt={name || "avatar"} title={name} loading="lazy" style={style} className={`${cls} object-cover`} />;
  }
  return <span className={cls} style={style} title={name} aria-hidden>{name ? initials(name) : "?"}</span>;
}