import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (active) setTeams(data.teams);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load teams');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {error ? (
        <p role="alert">Unable to load teams: {error}</p>
      ) : teams === null ? (
        <p role="status">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p>No teams yet.</p>
      ) : (
        <ul className="mb-0">
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`}>{team.name ?? 'Team'}</li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
