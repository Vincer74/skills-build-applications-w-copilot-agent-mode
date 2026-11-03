import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (active) setLeaderboard(data.leaderboard);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load leaderboard');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {error ? (
        <p role="alert">Unable to load leaderboard: {error}</p>
      ) : leaderboard === null ? (
        <p role="status">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p>No leaderboard rankings yet.</p>
      ) : (
        <ol className="mb-0">
          {leaderboard.map((entry, index) => (
            <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? index}`}>
              {entry.teamName ?? 'Team'}: {entry.totalPoints ?? 0} points
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
