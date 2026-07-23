import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ExternalLink, Mail, Send, Share2 } from "lucide-react";
import Footer from "../components/Footer.jsx";

export default function CreatedPage() {
  // useParams reads dynamic pieces of the URL. Here it reads /created/:id.
  const { id } = useParams();

  // Set by CreatePage when the creator asked for email updates.
  const location = useLocation();
  const emailPending = Boolean(location.state?.emailPending);

  // This is the path the recipient will open.
  const sharePath = `/t/${id}`;

  // useMemo recalculates shareUrl only when sharePath changes.
  const shareUrl = useMemo(() => `${window.location.origin}${sharePath}`, [sharePath]);
  const [shareStatus, setShareStatus] = useState("");

  async function handleShare() {
    setShareStatus("");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Plot Twist",
          text: "You have a Plot Twist waiting.",
          url: shareUrl
        });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("Copied");
    } catch {
      setShareStatus("Copy failed");
    }
  }

  return (
    <main className="mobile-page flex flex-col bg-created text-white">
      <div className="flex flex-1 items-center">
        <section className="w-full rounded-card border border-white/10 bg-white/[0.06] p-6 shadow-glow backdrop-blur-xl">
        <div className="app-icon mb-5 size-14 text-ink">
          <Send size={24} />
        </div>
        <p className="eyebrow">Ready to share</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-[1.04] tracking-tight">
          Your Plot Twist is <span className="display-gradient">live.</span>
        </h1>
        <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="break-all text-sm font-semibold text-white/80">{shareUrl}</p>
          <button className="button-gold w-full" type="button" onClick={handleShare}>
            <Share2 size={18} />
            {shareStatus || "Share link"}
          </button>
        </div>
        {emailPending ? (
          <div className="mt-4 flex items-start gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm">
            <Mail size={18} className="mt-0.5 shrink-0 text-gold" />
            <p className="text-white/75">
              Check your inbox — confirm your email to get updates when this Plot Twist goes live
              and when it expires.
            </p>
          </div>
        ) : null}
        <div className="mt-6 grid gap-3">
          {/* Open the reveal route for this exact invite id. */}
          <Link className="button-primary" to={sharePath}>
            Open reveal page
            <ExternalLink size={18} />
          </Link>
          {/* Let the host start over with a fresh invite form. */}
          <Link className="button-secondary" to="/create">
            Create another
          </Link>
        </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
