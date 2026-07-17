import { Sparkles } from "lucide-react";

// Shows the invite's chosen image, or a branded gradient fallback when none
// was selected. `className` controls sizing/aspect and applies to both branches.
export default function RevealImage({ src, alt, className = "", sparklesSize = 54 }) {
  if (src) {
    return <img className={`object-cover ${className}`} src={src} alt={alt} />;
  }

  return (
    <div
      className={`grid place-items-center bg-gradient-to-br from-orange-400 to-violet-700 text-white ${className}`}
    >
      <Sparkles size={sparklesSize} />
    </div>
  );
}
