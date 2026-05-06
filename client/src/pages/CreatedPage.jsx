import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, Send } from "lucide-react";

export default function CreatedPage() {
  // useParams reads dynamic pieces of the URL. Here it reads /created/:id.
  const { id } = useParams();

  // This is the path the recipient will open.
  const sharePath = `/t/${id}`;

  // useMemo recalculates shareUrl only when sharePath changes.
  const shareUrl = useMemo(() => `${window.location.origin}${sharePath}`, [sharePath]);

  return (
    <main className="mobile-page grid place-items-center bg-[linear-gradient(150deg,#111827,#312e81)] text-white">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur">
        <div className="mb-5 grid size-14 place-items-center rounded-3xl bg-orange-400 text-slate-950">
          <Send size={24} />
        </div>
        <p className="text-sm font-bold uppercase text-orange-200">Ready to share</p>
        <h1 className="mt-2 text-4xl font-black leading-none tracking-normal">Your Plot Twist is live.</h1>
        <div className="mt-6 rounded-3xl bg-white p-4 text-slate-950">
          <p className="break-all text-sm font-semibold">{shareUrl}</p>
        </div>
        <div className="mt-6 grid gap-3">
          {/* Open the reveal route for this exact invite id. */}
          <Link className="button-primary bg-orange-500 text-slate-950 hover:bg-orange-400" to={sharePath}>
            Open reveal page
            <ExternalLink size={18} />
          </Link>
          {/* Let the host start over with a fresh invite form. */}
          <Link className="button-secondary border-white/20 bg-white/10 text-white hover:bg-white/20" to="/create">
            Create another
          </Link>
        </div>
      </section>
    </main>
  );
}
