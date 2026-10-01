// Fetches the live numbers for the profile card (account age, contribution
// calendar and streaks) with a single GraphQL call. The workflow GITHUB_TOKEN
// is enough: only public profile data is read.

const QUERY = `
query($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

export async function fetchProfileData(login) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Set GITHUB_TOKEN');

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': login },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(`GitHub GraphQL failed: ${JSON.stringify(payload.errors ?? payload)}`);
  }

  const { createdAt, contributionsCollection } = payload.data.user;
  const calendar = contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  return {
    createdAt,
    totalContributions: calendar.totalContributions,
    streaks: computeStreaks(days),
  };
}

function computeStreaks(days) {
  let longest = 0;
  let running = 0;
  let peak = 0;
  for (const day of days) {
    running = day.contributionCount > 0 ? running + 1 : 0;
    longest = Math.max(longest, running);
    peak = Math.max(peak, day.contributionCount);
  }

  // Today may still be empty without breaking the streak.
  let current = 0;
  let index = days.length - 1;
  if (index >= 0 && days[index].contributionCount === 0) index--;
  while (index >= 0 && days[index].contributionCount > 0) {
    current++;
    index--;
  }

  const activeDays = days.filter((day) => day.contributionCount > 0).length;
  return { current, longest, peak, activeDays };
}
