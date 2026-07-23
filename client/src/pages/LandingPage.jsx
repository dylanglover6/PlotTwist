import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import Footer from "../components/Footer.jsx";
import ParticleBurst from "../components/ParticleBurst.jsx";
import ScratchReveal from "../components/ScratchReveal.jsx";

// This is a React component. Components return JSX, which looks like HTML
// but can include JavaScript values and other React components.
export default function LandingPage() {
  const [hasRevealedCta, setHasRevealedCta] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);

  function handleScratchComplete() {
    setHasRevealedCta(true);
    setShowParticleBurst(true);
  }

  return (
    <main className="mobile-page flex flex-col bg-app text-white">
      <section className="flex flex-1 flex-col justify-between gap-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-lg font-bold">
            {/* [APP ICON] Squircle brand placeholder — drop a real icon by
                rendering <img> inside .app-icon; the sparkle is the fallback. */}
            <span className="app-icon">
              <Sparkles size={18} />
            </span>
            <span className="font-display">Plot Twist</span>
          </div>
          {/* Link changes pages without doing a full browser refresh. */}
          <Link className="button-secondary min-h-10 px-5 py-2 text-sm" to="/create">
            Create
          </Link>
        </nav>

        <div className="py-14">
          <span className="eyebrow">✨ Surprise reveal invites</span>
          <h1 className="mt-4 max-w-sm font-display text-6xl font-bold leading-[0.92] tracking-tight">
            Make your next invitation a{" "}
            <span className="display-gradient">surprise.</span> For the plot.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-white/70">
            Build a temporary reveal page for trips, parties, concerts, birthdays, and plans that
            deserve a little drama.
          </p>
          <Link className="button-gold mt-7 text-base sm:w-auto" to="/create">
            Get Started
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-card border border-white/10 bg-void shadow-glow">
          <ScratchReveal
            className="aspect-[4/5]"
            brushSize={54}
            coverSubtitle="Swipe to Reveal"
            coverTitle="Ready to build some suspense? Swipe here"
            onComplete={handleScratchComplete}
            revealThreshold={42}
          >
            <div className="grid h-full place-items-center bg-reveal p-6 text-center text-white">
              <div>
                <div className="app-icon mx-auto mb-5 size-14 text-ink">
                  <Sparkles size={26} />
                </div>
                <p className="eyebrow">Plot Twist</p>
                <h2 className="mt-2 font-display text-3xl font-bold leading-none tracking-tight">
                  Your surprise starts here.
                </h2>
                {hasRevealedCta ? (
                  <Link className="button-gold mt-6 w-full" to="/create">
                    Send your own Plot Twist
                    <ArrowRight size={18} />
                  </Link>
                ) : null}
              </div>
            </div>
          </ScratchReveal>
          <ParticleBurst active={showParticleBurst} onDone={() => setShowParticleBurst(false)} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
