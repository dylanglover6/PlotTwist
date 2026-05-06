export async function searchImages(query) {
  const response = await fetch(`/api/images/search?query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error("Unable to search images");
  }

  return response.json();
}
