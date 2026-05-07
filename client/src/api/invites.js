export async function createInvite(payload) {
  const response = await fetch("/api/invites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Unable to create invite");
  }

  if (!data?._id) {
    throw new Error("Invite was created, but the share link id was missing");
  }

  return data;
}

export async function getInvite(id) {
  const response = await fetch(`/api/invites/${id}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Invite not found");
  }

  return data;
}
