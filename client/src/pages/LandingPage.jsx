import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
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
    <main className="mobile-page bg-[radial-gradient(circle_at_top_left,#fed7aa,transparent_32%),linear-gradient(160deg,#fff7ed,#eef2ff)] text-ink">
      <section className="flex min-h-[calc(100vh-3rem)] flex-col justify-between">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black">
            <span className="grid size-9 place-items-center rounded-2xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </span>
            Plot Twist
          </div>
          {/* Link changes pages without doing a full browser refresh. */}
          <Link className="button-secondary min-h-10 px-4 py-2 text-sm" to="/create">
            Create
          </Link>
        </nav>

        <div className="py-16">
          <h1 className="max-w-sm text-5xl font-black leading-[0.94] tracking-normal">
            Make your next invitation a surprise. <br></br>For the plot.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-700">
            Build a temporary reveal page for trips, parties, concerts, birthdays, and plans that
            deserve a little drama.
          </p>
          <Link className="button-primary mt-6 min-h-10 px-4 py-2 text-sm sm:w-auto" to="/create">
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 shadow-glow">
          <ScratchReveal
            className="aspect-[5/4]"
            brushSize={54}
            coverSubtitle="Swipe to Reveal"
            coverTitle="Ready to build some suspense? Swipe here"
            onComplete={handleScratchComplete}
            revealThreshold={42}
          >
            <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top,#f97316,transparent_35%),linear-gradient(160deg,#111827,#3b0764)] p-6 text-center text-white">
              <div>
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-3xl bg-orange-400 text-slate-950">
                  <Sparkles size={26} />
                </div>
                <p className="text-sm font-bold uppercase text-orange-200">Plot Twist</p>
                <h2 className="mt-2 text-3xl font-black leading-none tracking-normal">
                  Your surprise starts here.
                </h2>
                {hasRevealedCta ? (
                  <Link
                    className="button-primary mt-6 w-full bg-orange-500 text-slate-950 hover:bg-orange-400"
                    to="/create"
                  >
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
    </main>
  );
}
