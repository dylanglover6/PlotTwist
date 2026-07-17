import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LockKeyhole, Sparkles } from "lucide-react";
import AddToCalendarButton from "../components/AddToCalendarButton.jsx";
import CountdownLabel from "../components/CountdownLabel.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import ParticleBurst from "../components/ParticleBurst.jsx";
import ScratchReveal from "../components/ScratchReveal.jsx";
import { getInvite } from "../api/invites.js";
import { getRevealState } from "../utils/revealState.js";

export default function RevealPage() {
  // This reads the invite id from /t/:id.
  const { id } = useParams();

  // invite starts as null because the API request has not finished yet.
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");

  // now is updated every second so the page can move from locked to revealed.
  const [now, setNow] = useState(new Date());
  const [hasScratchedReveal, setHasScratchedReveal] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  // useCallback gives CountdownTimer a stable function reference.
  const handleTimerComplete = useCallback(() => setNow(new Date()), []);

  // useEffect runs after React renders. This one loads invite data whenever id changes.
  useEffect(() => {
    getInvite(id)
      .then(setInvite)
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  // Reset the scratch state when navigating to a different invite.
  useEffect(() => {
    setHasScratchedReveal(false);
    setShowParticleBurst(false);
    setScratchProgress(0);
  }, [id]);

  const handleScratchComplete = useCallback(() => {
    setHasScratchedReveal(true);
    setShowParticleBurst(true);
  }, []);

  // This interval keeps the current time fresh for countdown and expiration checks.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    // Cleanup prevents an old interval from running after the component unmounts.
    return () => window.clearInterval(timer);
  }, []);

  // useMemo avoids recalculating revealState unless invite or now changes.
  const revealState = useMemo(() => {
    if (!invite) return { status: "loading" };
    return getRevealState(invite, now);
  }, [invite, now]);
  const imageRevealStyle = getImageRevealStyle(scratchProgress);

  // Early returns keep each page state simple: error, loading, locked, expired, revealed.
  if (error) {
    return <StatusPage title="That twist is missing." message={error} />;
  }

  if (!invite) {
    return <StatusPage title="Loading the twist..." message="The reveal curtain is almost up." />;
  }

  if (revealState.status === "invalid") {
    return (
      <StatusPage
        title="This Plot Twist needs a fix."
        message="The unlock or expiration time is missing or invalid."
      />
    );
  }

  if (revealState.status === "locked") {
    return (
      <StatusPage
        icon={<LockKeyhole size={26} />}
        title={invite.teaserMessage || `${invite.hostName} has a Plot Twist for you`}
        message={`Unlocks ${revealState.unlockAt.toLocaleString()}`}
        // CountdownTimer receives the future unlock date and calls back when it reaches zero.
        detail={<CountdownTimer targetDate={invite.unlockAt} onComplete={handleTimerComplete} />}
        action={
          <AddToCalendarButton
            className="button-secondary bg-white/10 text-white hover:bg-white/20"
            invite={invite}
            label="Add Reveal to Calendar"
          />
        }
      />
    );
  }

  if (revealState.status === "expired") {
    return (
      <StatusPage
        title="This Plot Twist expired."
        message={`This temporary reveal link expired ${revealState.expiresAt.toLocaleString()}.`}
      />
    );
  }

  return (
    <main className="mobile-page bg-[radial-gradient(circle_at_top,#f97316,transparent_30%),linear-gradient(160deg,#111827,#3b0764)] text-white">
      <section className="flex min-h-[calc(100vh-3rem)] flex-col justify-between gap-6">
        <header className="pt-2 text-center">
          <p className="text-sm font-bold uppercase text-orange-200">Plot Twist</p>
          <h1 className="mx-auto mt-2 max-w-sm text-4xl font-black leading-none tracking-normal">
            {invite.hostName} sent you a Plot Twist!
          </h1>
        </header>

        <div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-glow backdrop-blur">
            <ScratchReveal
              className="aspect-[4/5] bg-slate-900"
              brushSize={62}
              coverSubtitle="Swipe to Reveal"
              coverTitle={invite.teaserMessage}
              onComplete={handleScratchComplete}
              onProgress={setScratchProgress}
              revealThreshold={45}
            >
              <div className="relative h-full overflow-hidden">
                <div
                  className="relative h-full transition-[filter,transform] duration-300 ease-out"
                  style={imageRevealStyle}
                >
                  {/* Show the selected image if one exists. Otherwise show a fallback visual. */}
                  {invite.imageUrl ? (
                    <img
                      className="h-full w-full object-cover"
                      src={invite.imageUrl}
                      alt={invite.imageAlt || invite.revealTitle}
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-orange-400 to-violet-700">
                      <Sparkles size={56} />
                    </div>
                  )}
                  <div className="absolute inset-0 grid place-items-center bg-slate-950/45 p-6 text-center">
                    <div>
                      <h1 className="text-4xl font-black leading-none tracking-normal">
                        {invite.revealTitle}
                      </h1>
                      {invite.description ? (
                        <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-orange-50">
                          {invite.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </ScratchReveal>
            <ParticleBurst active={showParticleBurst} onDone={() => setShowParticleBurst(false)} />
            <div className="grid gap-4 bg-white p-5 text-slate-950">
              {hasScratchedReveal ? (
                <div className={`grid gap-3 ${invite.moreInfoEnabled ? "grid-cols-2" : ""}`}>
                  {invite.moreInfoEnabled ? (
                    <Link className="button-primary min-w-0 px-2 text-xs" to={`/t/${id}/more`}>
                      <span className="min-w-0 text-center leading-tight">More Information</span>
                    </Link>
                  ) : null}
                  <AddToCalendarButton
                    className="button-secondary min-w-0 px-2 text-xs"
                    invite={invite}
                  />
                </div>
              ) : (
                <p className="text-center text-sm font-bold text-slate-500">
                  Swipe the screen to reveal {getPossessiveName(invite.hostName)} Plot Twist!
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-semibold text-orange-100/75">
            Expires in <CountdownLabel mode="hoursMinutes" targetDate={revealState.expiresAt} />
          </p>
        </div>
      </section>
    </main>
  );
}

// A small shared component for loading, locked, expired, and error screens.
function StatusPage({ action, detail, icon, message, title }) {
  return (
    <main className="mobile-page grid place-items-center bg-[linear-gradient(160deg,#111827,#581c87)] text-white">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-glow backdrop-blur">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-3xl bg-orange-400 text-slate-950">
          {icon || <Sparkles size={26} />}
        </div>
        <h1 className="text-4xl font-black leading-none tracking-normal">{title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-orange-50">{message}</p>
        {detail ? <div className="mt-6">{detail}</div> : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}

function getImageRevealStyle(scratchProgress) {
  // The cover disappears at 45%, so normalize that range to 0..1 for the image effect.
  const progress = Math.min(scratchProgress / 45, 1);
  const blurPixels = Math.round((1 - progress) * 16);
  const scale = 1 + (1 - progress) * 0.14;

  return {
    filter: `blur(${blurPixels}px)`,
    transform: `scale(${scale})`
  };
}

function getPossessiveName(name) {
  if (!name) return "your";
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}
