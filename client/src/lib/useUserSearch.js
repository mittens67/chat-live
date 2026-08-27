import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "./api";

const DEBOUNCE_MS = 300;

/**
 * Debounced user search, shared by the three places that need it.
 *
 * Each copy of this previously fired a request per keystroke using the
 * `search` *state* rather than the incoming query, so every request lagged one
 * character behind - typing "bob" searched for "", "b", "bo".
 */
export const useUserSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        //params, so the term is URL-encoded properly - interpolating it raw
        //broke on &, # and +
        const { data } = await api.get("/user", {
          params: { search: term },
          signal: controller.signal,
        });
        setResults(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error(errorMessage(error, "Could not search users"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    //Cancels both the pending debounce and any in-flight request, so results
    //can never arrive out of order and overwrite a newer search
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const reset = () => {
    setQuery("");
    setResults([]);
  };

  return { query, setQuery, results, loading, reset };
};
