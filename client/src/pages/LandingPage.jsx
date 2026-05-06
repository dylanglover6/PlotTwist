import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

// This is a React component. Components return JSX, which looks like HTML
// but can include JavaScript values and other React components.
export default function LandingPage() {
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
          <p className="mb-4 text-sm font-bold uppercase text-orange-700">surprise reveal links</p>
          <h1 className="max-w-sm text-5xl font-black leading-[0.94] tracking-normal">
            Send the invite after the suspense.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-700">
            Build a temporary reveal page for trips, parties, concerts, birthdays, and
            plans that deserve a little drama.
          </p>
          {/* This sends the user into the invite creation flow. */}
          <Link className="button-primary mt-8 w-full sm:w-auto" to="/create">
            Make a Plot Twist
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="surface p-5">
          <p className="text-sm font-bold text-slate-500">MVP flow</p>
          <div className="mt-3 grid gap-3 text-sm font-semibold text-slate-800">
            <span>1. Create the reveal</span>
            <span>2. Share the temporary link</span>
            <span>3. Recipient unlocks the surprise</span>
          </div>
        </div>
      </section>
    </main>
  );
}
