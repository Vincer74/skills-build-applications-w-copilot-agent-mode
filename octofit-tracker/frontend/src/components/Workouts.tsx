import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then((data) => {
        if (active) setSuggestions(data.suggestions);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load workout suggestions');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {error ? (
        <p role="alert">Unable to load workout suggestions: {error}</p>
      ) : suggestions === null ? (
        <p role="status">Loading workout suggestions...</p>
      ) : suggestions.length === 0 ? (
        <p>No workout suggestions.</p>
      ) : (
        <ul className="mb-0">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'workout'}-${index}`}>
              {suggestion.title ?? 'Workout'}
              {suggestion.reason ? `: ${suggestion.reason}` : ''}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
