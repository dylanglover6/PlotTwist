// Shared helper for deciding whether an invite is locked, expired, or revealable.
export function getRevealState(invite, now = new Date()) {
  const unlockAt = new Date(invite.unlockAt);
  const expiresAt = new Date(invite.expiresAt);

  if (!isValidDate(unlockAt) || !isValidDate(expiresAt)) {
    return { status: "invalid" };
  }

  if (now < unlockAt) {
    return {
      status: "locked",
      unlockAt,
      expiresAt
    };
  }

  if (now > expiresAt) {
    return {
      status: "expired",
      unlockAt,
      expiresAt
    };
  }

  return {
    status: "revealed",
    unlockAt,
    expiresAt
  };
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}
