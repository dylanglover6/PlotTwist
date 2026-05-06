export async function createInvite(payload) {
  const response = await fetch("/api/invites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to create invite");
  }

  return response.json();
}

export async function getInvite(id) {
  const response = await fetch(`/api/invites/${id}`);

  if (!response.ok) {
    throw new Error("Invite not found");
  }

  return response.json();
}
