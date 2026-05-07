import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, ImageIcon, WandSparkles } from "lucide-react";
import { searchImages } from "../api/images.js";
import { createInvite } from "../api/invites.js";

// This object gives the form its starting values.
// Keeping it outside the component avoids recreating it on every render.
const defaultForm = {
  hostName: "",
  teaserMessage: "",
  revealTitle: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  unlockMode: "now",
  unlockAt: "",
  expirationHours: 24,
  permanentLink: "",
  moreInfoEnabled: false,
  moreInfoTitle: "",
  moreInfoDescription: ""
};

export default function CreatePage() {
  // useState stores values that can change while the user interacts with the page.
  // When a setter like setForm runs, React re-renders the component with the new value.
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState([]);
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
        description: form.description,
        imageUrl: form.imageUrl,
        imageAlt: form.imageAlt,
        unlockAt: unlockAt.toISOString(),
        expirationHours: Number(form.expirationHours) || 24,
        permanentLink: form.permanentLink,
        moreInfoEnabled: form.moreInfoEnabled,
        moreInfoTitle: form.moreInfoTitle,
        moreInfoDescription: form.moreInfoDescription
      });

      // MongoDB creates _id. We use it to build the confirmation page URL.
      navigate(`/created/${invite._id}`, { replace: true });
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
      setImageResults(data.results || []);
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

  return (
    <main className="mobile-page bg-orange-50">
      {/* JSX className is React's version of HTML class. These are Tailwind classes. */}
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-orange-700">Create</p>
        <h1 className="mt-2 text-4xl font-black leading-none tracking-normal">Set up the twist.</h1>
      </div>

      {/* Controlled inputs read from React state and update React state on change. */}
      <form className="surface grid gap-5 p-5" onSubmit={handleSubmit}>
        <label className="field">
          <span>Host name</span>
          <input className="input" name="hostName" required value={form.hostName} onChange={updateField} />
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
          <input className="input" name="revealTitle" required value={form.revealTitle} onChange={updateField} />
        </label>

        <label className="field">
          <span>Description/details</span>
          <textarea className="input min-h-32" name="description" value={form.description} onChange={updateField} />
        </label>

        <section className="grid gap-4 rounded-3xl border border-violet-100 bg-violet-50 p-4">
          <label className="flex items-center gap-3 font-bold text-slate-900">
            <input
              checked={form.moreInfoEnabled}
              className="size-5 accent-violet-700"
              name="moreInfoEnabled"
              type="checkbox"
              onChange={updateField}
            />
            Add a More Information page
          </label>

          {form.moreInfoEnabled ? (
            <>
              <label className="field">
                <span>More Information title</span>
                <input
                  className="input"
                  name="moreInfoTitle"
                  placeholder="Everything you need to know"
                  value={form.moreInfoTitle}
                  onChange={updateField}
                />
              </label>
              <label className="field">
                <span>More Information description</span>
                <textarea
                  className="input min-h-32"
                  name="moreInfoDescription"
                  placeholder="Add itinerary notes, packing details, address info, or anything else."
                  value={form.moreInfoDescription}
                  onChange={updateField}
                />
              </label>
            </>
          ) : null}
        </section>

        <section className="rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-slate-800">
            <ImageIcon size={18} />
            Destination image
          </div>
          {form.imageUrl ? (
            <div ref={imagePreviewRef} className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-orange-950/10">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img className="h-full w-full object-cover" src={form.imageUrl} alt={form.imageAlt || form.revealTitle} />
                <div className="absolute inset-0 grid place-items-center bg-slate-950/45 p-6 text-center text-white">
                  <div>
                    <p className="text-sm font-bold uppercase text-orange-200">Preview</p>
                    <h2 className="mt-2 text-4xl font-black leading-none tracking-normal">
                      {form.revealTitle || "Your reveal title"}
                    </h2>
                    {form.description ? (
                      <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-orange-50">
                        {form.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <button className="button-secondary w-full rounded-none border-0" type="button" onClick={clearSelectedImage}>
                <ArrowLeft size={18} />
                Choose a different image
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  className="input"
                  placeholder="Search Unsplash, e.g. Memphis"
                  value={imageQuery}
                  onChange={(event) => setImageQuery(event.target.value)}
                />
                <button className="button-secondary px-4" disabled={isSearching} type="button" onClick={handleImageSearch}>
                  {isSearching ? "..." : "Search"}
                </button>
              </div>
              {imageResults.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {/* map turns an array of image results into a list of JSX buttons. */}
                  {imageResults.map((image) => (
                    <button
                      className="overflow-hidden rounded-2xl border-2 border-white transition hover:border-orange-500"
                      key={image.id}
                      type="button"
                      onClick={() => selectImage(image)}
                    >
                      <img className="aspect-[3/4] w-full object-cover" src={image.thumb} alt={image.alt} />
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-sm text-slate-600">
                Select a result to preview it as the reveal image.
              </p>
            </>
          )}
        </section>

        <section className="grid min-w-0 gap-4 overflow-hidden rounded-3xl bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2 font-bold">
            <CalendarClock size={18} />
            Unlock timing
          </div>
          <select className="input min-w-0 max-w-full text-slate-950" name="unlockMode" value={form.unlockMode} onChange={updateField}>
            <option value="now">Unlock now</option>
            <option value="scheduled">Schedule unlock</option>
          </select>
          {/* Conditional rendering: show this input only when scheduled mode is selected. */}
          {form.unlockMode === "scheduled" ? (
            <input
              className="input min-w-0 max-w-full text-slate-950"
              name="unlockAt"
              required
              type="datetime-local"
              value={form.unlockAt}
              onChange={updateField}
            />
          ) : null}
        </section>

        {/* Show the error message only when error has text. */}
        {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <button className="button-primary" disabled={isSubmitting} type="submit">
          <WandSparkles size={18} />
          {isSubmitting ? "Creating..." : "Create share link"}
        </button>
      </form>
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
