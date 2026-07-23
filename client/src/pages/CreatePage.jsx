import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  ImageIcon,
  Mail,
  PartyPopper,
  WandSparkles
} from "lucide-react";
import { searchImages } from "../api/images.js";
import { createInvite } from "../api/invites.js";
import Footer from "../components/Footer.jsx";
import { formatEventDate } from "../utils/time.js";

// This object gives the form its starting values.
// Keeping it outside the component avoids recreating it on every render.
const defaultForm = {
  hostName: "",
  teaserMessage: "",
  revealTitle: "",
  eventStartDate: "",
  eventEndDate: "",
  eventIsRange: false,
  imageUrl: "",
  imageAlt: "",
  description: "",
  partifulUrl: "",
  unlockMode: "now",
  unlockAt: "",
  expirationHours: 24,
  email: ""
};

export default function CreatePage() {
  // useState stores values that can change while the user interacts with the page.
  // When a setter like setForm runs, React re-renders the component with the new value.
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState([]);
  const [imageNotice, setImageNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const imagePreviewRef = useRef(null);

  // useNavigate lets code move the user to another route after something happens.
  const navigate = useNavigate();

  useEffect(() => {
    if (form.imageUrl) {
      imagePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [form.imageUrl]);

  // All form inputs use their "name" attribute to update the matching form field.
  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  // This runs when the user submits the form.
  async function handleSubmit(event) {
    // Prevent the browser's default form submit, which would reload the page.
    event.preventDefault();
    event.stopPropagation();

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    const unlockAt = getUnlockDate(form);

    if (!unlockAt) {
      setError("Choose a valid unlock date and time.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Send the form data to the Express API. The API saves it in MongoDB.
      const invite = await createInvite({
        hostName: form.hostName,
        teaserMessage: form.teaserMessage,
        revealTitle: form.revealTitle,
        eventStartDate: form.eventStartDate,
        eventEndDate: form.eventIsRange ? form.eventEndDate : "",
        eventIsRange: form.eventIsRange,
        imageUrl: form.imageUrl,
        imageAlt: form.imageAlt,
        description: form.description,
        partifulUrl: form.partifulUrl.trim(),
        unlockAt: unlockAt.toISOString(),
        expirationHours: Number(form.expirationHours) || 24,
        email: form.email.trim()
      });

      // shareId is the unguessable public token used in all share/reveal URLs.
      // emailPending tells the next page to show a "confirm your email" note.
      navigate(`/created/${invite.shareId}`, {
        replace: true,
        state: { emailPending: invite.emailPending }
      });
    } catch (requestError) {
      setError(requestError.message);
      setIsSubmitting(false);
    }
  }

  // This searches Unsplash through our backend, so the API key stays off the frontend.
  async function handleImageSearch() {
    if (!imageQuery.trim()) return;

    setError("");
    setIsSearching(true);

    try {
      const data = await searchImages(imageQuery);
      const results = data.results || [];
      setImageResults(results);
      // Surface a server note (e.g. missing API key), or a no-results message.
      setImageNotice(
        data.message || (results.length === 0 ? "No images found. Try another search." : "")
      );
      setHasSearched(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSearching(false);
    }
  }

  // When an image thumbnail is clicked, copy its real image URL into the invite form.
  function selectImage(image) {
    setForm((current) => ({
      ...current,
      imageUrl: image.url,
      imageAlt: image.alt
    }));
  }

  function clearSelectedImage() {
    setForm((current) => ({
      ...current,
      imageUrl: "",
      imageAlt: ""
    }));
  }

  const eventLabel = formatEventDate(form.eventStartDate, form.eventEndDate, form.eventIsRange);

  return (
    <main className="mobile-page flex flex-col bg-app text-white">
      {/* JSX className is React's version of HTML class. These are Tailwind classes. */}
      <div className="mb-6">
        <p className="eyebrow">Create</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight">
          Set up the <span className="display-gradient">twist.</span>
        </h1>
      </div>

      {/* Controlled inputs read from React state and update React state on change. */}
      <form className="surface grid gap-5 p-5" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your name</span>
          <input
            className="input"
            name="hostName"
            required
            value={form.hostName}
            onChange={updateField}
          />
        </label>

        <label className="field">
          <span>Teaser message</span>
          <input
            className="input"
            name="teaserMessage"
            placeholder="Dylan has a Plot Twist for you"
            required
            value={form.teaserMessage}
            onChange={updateField}
          />
        </label>

        <label className="field">
          <span>Reveal title</span>
          <input
            className="input"
            name="revealTitle"
            required
            value={form.revealTitle}
            onChange={updateField}
          />
        </label>

        <section className="panel grid gap-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <CalendarDays size={18} className="text-gold" />
            Date
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Optional
            </span>
          </div>
          <div className={form.eventIsRange ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
            <label className="field">
              <span className="sr-only">{form.eventIsRange ? "Start date" : "Event date"}</span>
              <input
                className="input min-w-0 max-w-full"
                name="eventStartDate"
                type="date"
                aria-label={form.eventIsRange ? "Start date" : "Event date"}
                value={form.eventStartDate}
                onChange={updateField}
              />
            </label>
            {form.eventIsRange ? (
              <label className="field">
                <span className="sr-only">End date</span>
                <input
                  className="input min-w-0 max-w-full"
                  name="eventEndDate"
                  type="date"
                  aria-label="End date"
                  min={form.eventStartDate || undefined}
                  value={form.eventEndDate}
                  onChange={updateField}
                />
              </label>
            ) : null}
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-white/80">
            <input
              checked={form.eventIsRange}
              className="size-5 accent-fuchsia-500"
              name="eventIsRange"
              type="checkbox"
              onChange={updateField}
            />
            Spans multiple days
          </label>
        </section>

        <section className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-white">
            <ImageIcon size={18} className="text-gold" />
            Destination image
          </div>
          {form.imageUrl ? (
            <div ref={imagePreviewRef} className="overflow-hidden rounded-card bg-void shadow-glow">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={form.imageUrl}
                  alt={form.imageAlt || form.revealTitle}
                />
                <div className="absolute inset-0 grid place-items-center p-5 text-center text-white">
                  <div className="max-w-full rounded-3xl bg-[#3a1180]/40 px-6 py-5 shadow-xl shadow-black/40 ring-1 ring-white/15 backdrop-blur-lg">
                    <p className="eyebrow">Preview</p>
                    <h2 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
                      {form.revealTitle || "Your reveal title"}
                    </h2>
                    {eventLabel ? (
                      <p className="mt-3 text-sm font-semibold text-gold [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
                        {eventLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                className="button-secondary w-full rounded-none border-0"
                type="button"
                onClick={clearSelectedImage}
              >
                <ArrowLeft size={18} />
                Choose a different image
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  className="input"
                  aria-label="Search for a reveal image"
                  placeholder="Search Unsplash, e.g. Memphis"
                  value={imageQuery}
                  onChange={(event) => setImageQuery(event.target.value)}
                />
                <button
                  className="button-secondary px-5"
                  aria-label="Search images"
                  disabled={isSearching}
                  type="button"
                  onClick={handleImageSearch}
                >
                  {isSearching ? "..." : "Search"}
                </button>
              </div>
              {imageResults.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {/* map turns an array of image results into a list of JSX buttons. */}
                  {imageResults.map((image) => (
                    <button
                      className="overflow-hidden rounded-2xl border-2 border-white/10 transition hover:border-fuchsia-400"
                      key={image.id}
                      type="button"
                      onClick={() => selectImage(image)}
                    >
                      <img
                        className="aspect-[3/4] w-full object-cover"
                        src={image.thumb}
                        alt={image.alt}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
              {imageNotice ? (
                <p className="mt-3 text-sm font-semibold text-gold">{imageNotice}</p>
              ) : null}
              <p className="mt-3 text-sm text-white/55">
                {hasSearched && imageResults.length > 0
                  ? "Select a result to preview it as the reveal image."
                  : "Search for a photo to use as the reveal image, or skip it for a bold gradient."}
              </p>
            </>
          )}
        </section>

        <div className="grid gap-2">
          <label className="field">
            <span>More information</span>
            <textarea
              className="input min-h-32"
              name="description"
              placeholder="Itinerary, address, packing notes — anything extra."
              value={form.description}
              onChange={updateField}
            />
          </label>
          <p className="text-sm text-white/55">
            Optional. Shown on a separate More Information page, along with your Partiful link.
          </p>
        </div>

        <section className="panel grid gap-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <PartyPopper size={18} className="text-gold" />
            Partiful invite
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Optional
            </span>
          </div>
          <label className="field">
            <span className="sr-only">Partiful invite link</span>
            <input
              className="input"
              name="partifulUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://partiful.com/e/..."
              value={form.partifulUrl}
              onChange={updateField}
            />
          </label>
          <p className="text-sm text-white/55">
            Paste your Partiful event link and we&apos;ll add an RSVP button for your guests.
          </p>
          <a
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-gold underline-offset-2 hover:underline"
            href="https://partiful.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create one on Partiful
            <ExternalLink size={14} />
          </a>
        </section>

        <section className="panel grid gap-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <Mail size={18} className="text-gold" />
            Email me updates
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Optional
            </span>
          </div>
          <label className="field">
            <span className="sr-only">Your email address</span>
            <input
              className="input"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField}
            />
          </label>
          <p className="text-sm text-white/55">
            We&apos;ll send a confirmation link. Confirm it to get your share link and a heads-up
            when your Plot Twist goes live and when it expires. You can unsubscribe anytime.
          </p>
        </section>

        <section className="panel grid min-w-0 gap-4 overflow-hidden text-white">
          <div className="flex items-center gap-2 font-bold">
            <CalendarClock size={18} className="text-gold" />
            Unlock timing
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Optional
            </span>
          </div>
          <select
            className="input min-w-0 max-w-full"
            aria-label="Unlock timing"
            name="unlockMode"
            value={form.unlockMode}
            onChange={updateField}
          >
            <option value="now">Unlock now</option>
            <option value="scheduled">Schedule unlock</option>
          </select>
          {/* Conditional rendering: show this input only when scheduled mode is selected. */}
          {form.unlockMode === "scheduled" ? (
            <input
              className="input min-w-0 max-w-full"
              aria-label="Unlock date and time"
              name="unlockAt"
              required
              type="datetime-local"
              value={form.unlockAt}
              onChange={updateField}
            />
          ) : null}
        </section>

        {/* Show the error message only when error has text. */}
        {error ? (
          <p className="rounded-2xl border border-red-400/25 bg-red-500/15 p-3 text-sm font-semibold text-red-200">
            {error}
          </p>
        ) : null}

        <button className="button-primary text-base" disabled={isSubmitting} type="submit">
          <WandSparkles size={18} />
          {isSubmitting ? "Creating..." : "Create share link"}
        </button>
      </form>
      <Footer />
    </main>
  );
}

function getUnlockDate(form) {
  // If the host chooses "now", use the current time. Otherwise use the scheduled time.
  const unlockAt =
    form.unlockMode === "now" || !form.unlockAt ? new Date() : new Date(form.unlockAt);

  if (Number.isNaN(unlockAt.getTime())) {
    return null;
  }

  return unlockAt;
}
