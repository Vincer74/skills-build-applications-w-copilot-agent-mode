import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function clientError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw clientError('Activity data is required');

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)
    || typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)
    || typeof type !== 'string' || type.trim().length === 0
    || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw clientError('Invalid activity data');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw clientError('Activity references a missing user or team', 404);

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw clientError('Team data is required');

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0
    || typeof mascot !== 'string' || mascot.trim().length === 0
    || !Array.isArray(members)) {
    throw clientError('Invalid team data');
  }

  if (members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw clientError('Invalid team member reference');
  }

  const uniqueMemberIds = [...new Set(members as string[])];
  const existingMembers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id').lean();
  if (existingMembers.length !== uniqueMemberIds.length) {
    throw clientError('Team references a missing user', 404);
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: uniqueMemberIds,
  });
  await User.updateMany({ _id: { $in: uniqueMemberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $match: { team: { $ne: [] } } },
    { $unwind: '$team' },
  ]);

  return totals.map((entry, index) => ({
    teamName: entry.team.name,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
    throw clientError('A user email is required');
  }

  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw clientError('User not found', 404);

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();

  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    cycling: 'endurance',
    walk: 'mobility',
    strength: 'strength',
  };
  const activityType = typeof recentActivity?.type === 'string' ? recentActivity.type.toLowerCase() : '';
  const focus = activityFocus[activityType] ?? (typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : 'general');

  let workout = await Workout.findOne({ focus }).lean();
  if (!workout) workout = await Workout.findOne().lean();
  if (!workout) throw clientError('No workout suggestions available', 404);

  const reason = activityType
    ? `Recommended for your recent ${activityType} activity and ${focus} focus.`
    : `Recommended for your ${focus} fitness goal.`;

  return [{ ...workout, reason }];
}

export { User };
