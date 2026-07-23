import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

// Cap searches per IP so this public Unsplash proxy can't be used to burn the
// upstream API quota. Generous enough for a host trying a few searches while
// filling out the form.
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { results: [], message: "Too many image searches. Try again in a few minutes." }
});

router.get("/search", searchLimiter, async (req, res, next) => {
  try {
    const query = String(req.query.query || "").trim();

    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return res.json({
        results: [],
        message: "Add UNSPLASH_ACCESS_KEY to server/.env to enable image search."
      });
    }

    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "12");
    url.searchParams.set("orientation", "portrait");

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: "Unsplash search failed" });
    }

    const data = await response.json();

    // Defensively read the response: Unsplash may change shape or omit nested
    // fields, and a missing `results` array or `urls` object should not 500.
    const rawResults = Array.isArray(data?.results) ? data.results : [];
    const results = rawResults
      .filter((image) => image?.urls?.regular)
      .map((image) => ({
        id: image.id,
        alt: image.alt_description || image.description || query,
        thumb: image.urls.small || image.urls.regular,
        url: image.urls.regular,
        creditName: image.user?.name || "Unsplash",
        creditUrl: image.user?.links?.html || "https://unsplash.com"
      }));

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;
