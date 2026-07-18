import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AddToCalendarButton from "../components/AddToCalendarButton.jsx";
import RevealImage from "../components/RevealImage.jsx";
import { useInvite } from "../hooks/useInvite.js";

export default function MoreInfoPage() {
  const { id } = useParams();
  const { invite, error } = useInvite(id);

  if (error) {
    return <InfoShell title="More Information is missing." description={error} />;
  }

  if (!invite) {
    return <InfoShell title="Loading More Information..." description="One moment." />;
  }

  const title =
    invite.moreInfoEnabled && invite.moreInfoTitle ? invite.moreInfoTitle : "More Information";
  const description =
    invite.moreInfoEnabled && invite.moreInfoDescription
      ? invite.moreInfoDescription
      : "No extra information was added for this Plot Twist.";

  return (
    <main className="mobile-page bg-orange-50">
      <article className="overflow-hidden rounded-card bg-white shadow-2xl shadow-orange-950/10">
        <RevealImage
          className="aspect-[4/3] w-full"
          src={invite.imageUrl}
          alt={invite.imageAlt || title}
        />
        <div className="grid gap-4 p-5">
          <p className="text-sm font-bold uppercase text-orange-700">More Information</p>
          <h1 className="text-4xl font-black leading-none tracking-normal text-slate-950">
            {title}
          </h1>
          <p className="whitespace-pre-line text-base leading-7 text-slate-700">{description}</p>
          <div className="grid grid-cols-2 gap-3">
            <Link className="button-secondary min-w-0 px-2 text-xs" to={`/t/${id}`}>
              <ArrowLeft size={18} />
              <span className="min-w-0 text-center leading-tight">Back to Plot Twist</span>
            </Link>
            <AddToCalendarButton className="button-primary min-w-0 px-2 text-xs" invite={invite} />
          </div>
        </div>
      </article>
    </main>
  );
}

function InfoShell({ description, title }) {
  return (
    <main className="mobile-page grid place-items-center bg-orange-50">
      <section className="surface p-6 text-center">
        <h1 className="text-3xl font-black leading-none tracking-normal text-slate-950">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
      </section>
    </main>
  );
}
