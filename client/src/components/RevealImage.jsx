import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// Shows the invite's chosen image, or a branded gradient fallback when none
// was selected or the image fails to load. `className` controls sizing/aspect
// and applies to both branches.
export default function RevealImage({ src, alt, className = "", sparklesSize = 54 }) {
  const [failed, setFailed] = useState(false);

  // Reset the failure flag if the source changes to a new image.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        className={`object-cover ${className}`}
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`grid place-items-center bg-gradient-to-br from-orange-400 to-violet-700 text-white ${className}`}
    >
      <Sparkles size={sparklesSize} />
    </div>
  );
}
