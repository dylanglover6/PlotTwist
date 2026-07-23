import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

// Shared page footer: a call-to-action to make your own, plus the credit line.
// `mt-auto` lets it sink to the bottom of any flex-column page layout.
export default function Footer({ className = "" }) {
  return (
    <footer
      className={`mt-auto flex flex-col items-center gap-1.5 pt-10 text-center text-sm ${className}`}
    >
      <Link
        to="/create"
        className="inline-flex items-center gap-1.5 font-semibold text-gold underline-offset-2 transition hover:underline"
      >
        <Sparkles size={14} />
        Create your own Plot Twist
      </Link>
      <p className="text-white/40">
        <a
          href="https://dylanglover.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-white/55 transition hover:text-white"
        >
          Dylan Glover
        </a>{" "}
        · 2026
      </p>
    </footer>
  );
}
