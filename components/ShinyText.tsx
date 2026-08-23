import type { CSSProperties } from "react";

type ShinyTextProps = {
  text: string;
  speed?: number;
  delay?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
  direction?: "left" | "right";
  yoyo?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
};

export default function ShinyText({
  text,
  speed = 2,
  delay = 0,
  color = "#b5b5b5",
  shineColor = "#ffffff",
  spread = 120,
  direction = "left",
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
}: ShinyTextProps) {
  const style = {
    "--shiny-text-color": color,
    "--shiny-text-shine": shineColor,
    "--shiny-text-spread": `${spread}deg`,
    "--shiny-text-speed": `${speed}s`,
    "--shiny-text-delay": `${delay}s`,
  } as CSSProperties;

  return <span className={`shiny-text ${direction === "right" ? "direction-right" : ""} ${yoyo ? "yoyo" : ""} ${pauseOnHover ? "pause-on-hover" : ""} ${disabled ? "disabled" : ""}`} style={style}>{text}</span>;
}
