import { useEffect, useState } from "react";
import { getInvite } from "../api/invites.js";

// Loads an invite by id and tracks request state.
// The `ignore` flag prevents a stale/late response (or an unmounted
// component) from overwriting fresher state when `id` changes mid-flight.
export function useInvite(id) {
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setInvite(null);
    setError("");

    getInvite(id)
      .then((data) => {
        if (!ignore) setInvite(data);
      })
      .catch((requestError) => {
        if (!ignore) setError(requestError.message);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  return { invite, error };
}
