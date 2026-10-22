import type { CSSProperties, ImgHTMLAttributes } from "react";

/** Substitui next/image: usa as imagens embutidas no arquivo (window.__IMG__) ou o caminho original. */
export default function Image({
  src,
  alt,
  fill,
  width,
  height,
  priority,
  sizes: _sizes,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  ...rest
}: { src: string | { src: string }; alt: string; fill?: boolean; width?: number; height?: number; priority?: boolean; sizes?: string; quality?: number; unoptimized?: boolean } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">) {
  const path = typeof src === "string" ? src : src.src;
  const map = (window as unknown as { __IMG__?: Record<string, string> }).__IMG__;
  const real = map?.[path] ?? path;
  const st: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : { ...style };
  return <img src={real} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} style={st} loading={priority ? "eager" : "lazy"} decoding="async" {...rest} />;
}
