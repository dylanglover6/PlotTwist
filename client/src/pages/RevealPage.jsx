import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LockKeyhole, Sparkles } from "lucide-react";
import AddToCalendarButton from "../components/AddToCalendarButton.jsx";
import CountdownLabel from "../components/CountdownLabel.jsx";
import Footer from "../components/Footer.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import ParticleBurst from "../components/ParticleBurst.jsx";
import RevealImage from "../components/RevealImage.jsx";
import ScratchReveal from "../components/ScratchReveal.jsx";
import { useInvite } from "../hooks/useInvite.js";
import { getRevealState } from "../utils/revealState.js";
import { formatEventDate } from "../utils/time.js";

export default function RevealPage() {
  // This reads the invite id from /t/:id.
  const { id } = useParams();

  // Load the invite (and any load error) for this id.
  const { invite, error } = useInvite(id);

  // now is updated every second so the page can move from locked to revealed.
  const [now, setNow] = useState(new Date());
  const [hasScratchedReveal, setHasScratchedReveal] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  // useCallback gives CountdownTimer a stable function reference.
  const handleTimerComplete = useCallback(() => setNow(new Date()), []);

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

  // The reveal itself stays minimal — just the title and, if the host added
  // one, the event date. Everything else (details + Partiful) lives one tap
  // away on the More Information page.
  const eventLabel = formatEventDate(invite.eventStartDate, invite.eventEndDate, invite.eventIsRange);
  const hasMoreInfo = Boolean(invite.description || invite.partifulUrl);

  return (
    <main className="mobile-page flex flex-col bg-reveal text-white">
      <section className="flex flex-1 flex-col justify-between gap-6">
        <header className="pt-2 text-center">
          <p className="eyebrow">Plot Twist</p>
          <h1 className="mx-auto mt-2 max-w-sm font-display text-4xl font-bold leading-[1.02] tracking-tight">
            {invite.hostName} sent you a <span className="display-gradient">Plot Twist!</span>
          </h1>
        </header>

        <div>
          <div className="relative overflow-hidden rounded-card border border-white/10 bg-white/[0.06] shadow-glow backdrop-blur">
            <ScratchReveal
              className="aspect-[4/5] bg-void"
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
                  <RevealImage
                    className="h-full w-full"
                    src={invite.imageUrl}
                    alt={invite.imageAlt || invite.revealTitle}
                    sparklesSize={56}
                  />
                  <div className="absolute inset-0 grid place-items-center p-5 text-center">
                    {/* Translucent, blurred glass with a purple shade — the
                        image still shows through, and a soft text-shadow keeps
                        the title/date legible over any reveal image. */}
                    <div className="max-w-full rounded-3xl bg-[#3a1180]/40 px-6 py-5 shadow-xl shadow-black/40 ring-1 ring-white/15 backdrop-blur-lg">
                      <h1 className="font-display text-4xl font-bold leading-none tracking-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
                        {invite.revealTitle}
                      </h1>
                      {eventLabel ? (
                        <p className="mt-2 text-base font-semibold text-gold [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
                          {eventLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </ScratchReveal>
            <ParticleBurst active={showParticleBurst} onDone={() => setShowParticleBurst(false)} />
            <div className="grid gap-4 border-t border-white/10 bg-void/60 p-5 text-white backdrop-blur">
              {hasScratchedReveal ? (
                <div className={`grid gap-3 ${hasMoreInfo ? "grid-cols-2" : ""}`}>
                  {hasMoreInfo ? (
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
                <p className="text-center text-sm font-bold text-white/55">
                  Swipe the screen to reveal {getPossessiveName(invite.hostName)} Plot Twist!
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-semibold text-white/60">
            Expires in{" "}
            <span className="text-gold">
              <CountdownLabel mode="hoursMinutes" targetDate={revealState.expiresAt} />
            </span>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}

// A small shared component for loading, locked, expired, and error screens.
function StatusPage({ action, detail, icon, message, title }) {
  return (
    <main className="mobile-page flex flex-col bg-status text-white">
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full rounded-card border border-white/10 bg-white/[0.06] p-6 text-center shadow-glow backdrop-blur-xl">
          <div className="app-icon mx-auto mb-5 size-14 text-ink">
            {icon || <Sparkles size={26} />}
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight">{title}</h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-white/70">{message}</p>
          {detail ? <div className="mt-6">{detail}</div> : null}
          {action ? <div className="mt-6">{action}</div> : null}
        </section>
      </div>
      <Footer />
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
