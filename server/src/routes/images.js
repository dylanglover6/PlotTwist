import { Router } from "express";

const router = Router();

router.get("/search", async (req, res, next) => {
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
    const results = data.results.map((image) => ({
      id: image.id,
      alt: image.alt_description || image.description || query,
      thumb: image.urls.small,
      url: image.urls.regular,
      creditName: image.user.name,
      creditUrl: image.user.links.html
    }));

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;
