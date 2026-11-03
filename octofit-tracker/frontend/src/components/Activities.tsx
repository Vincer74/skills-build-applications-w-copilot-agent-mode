import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (active) setActivities(data.activities);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load activities');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {error ? (
        <p role="alert">Unable to load activities: {error}</p>
      ) : activities === null ? (
        <p role="status">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p>No activities yet.</p>
      ) : (
        <ul className="list-unstyled mb-0">
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`}>
              {activity.type ?? 'Activity'}: {activity.minutes ?? 0} minutes, {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
