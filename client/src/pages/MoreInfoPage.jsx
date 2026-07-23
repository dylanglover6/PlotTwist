import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PartyPopper } from "lucide-react";
import AddToCalendarButton from "../components/AddToCalendarButton.jsx";
import Footer from "../components/Footer.jsx";
import RevealImage from "../components/RevealImage.jsx";
import { useInvite } from "../hooks/useInvite.js";
import { formatEventDate } from "../utils/time.js";

export default function MoreInfoPage() {
  const { id } = useParams();
  const { invite, error } = useInvite(id);

  if (error) {
    return <InfoShell title="More Information is missing." description={error} />;
  }

  if (!invite) {
    return <InfoShell title="Loading More Information..." description="One moment." />;
  }

  const title = invite.revealTitle || "More Information";
  const eventLabel = formatEventDate(invite.eventStartDate, invite.eventEndDate, invite.eventIsRange);
  const description =
    invite.description || "No extra details were added for this Plot Twist.";

  return (
    <main className="mobile-page flex flex-col bg-app text-white">
      <article className="surface overflow-hidden">
        <RevealImage
          className="aspect-[4/3] w-full"
          src={invite.imageUrl}
          alt={invite.imageAlt || title}
        />
        <div className="grid gap-4 p-5">
          <p className="eyebrow">More Information</p>
          <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-white">
            {title}
          </h1>
          {eventLabel ? (
            <p className="-mt-2 text-base font-semibold text-gold">{eventLabel}</p>
          ) : null}
          <p className="whitespace-pre-line text-base leading-7 text-white/70">{description}</p>
          {invite.partifulUrl ? (
            <a
              className="button-gold w-full"
              href={invite.partifulUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PartyPopper size={18} />
              RSVP on Partiful
            </a>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Link className="button-secondary min-w-0 px-2 text-xs" to={`/t/${id}`}>
              <ArrowLeft size={18} />
              <span className="min-w-0 text-center leading-tight">Back to Plot Twist</span>
            </Link>
            <AddToCalendarButton className="button-primary min-w-0 px-2 text-xs" invite={invite} />
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}

function InfoShell({ description, title }) {
  return (
    <main className="mobile-page flex flex-col bg-app text-white">
      <div className="flex flex-1 items-center">
        <section className="surface w-full p-6 text-center">
          <h1 className="font-display text-3xl font-bold leading-[1.06] tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-3 text-white/65">{description}</p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
