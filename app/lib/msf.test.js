import { getGamesForWeekFromMsf, getTeamStatisticsFromMsf, getThisWeeksGamesFromMsf } from './msf';
import * as dbUtils from '@/app/utils/db';

jest.mock('@/app/utils/db', () => ({
  getCurrentWeek: jest.fn()
}));

global.fetch = jest.fn();

describe('msf.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      MYSPORTSFEED_BASE_URL: 'https://api.mysportsfeeds.com/v2.1/pull/nfl/',
      MYSPORTSFEED_CREDS: 'testuser:testpass'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockGamesResponse = {
    games: [
      {
        schedule: {
          id: 1,
          week: 1,
          startTime: '2025-09-07T13:00:00.000Z',
          awayTeam: { abbreviation: 'PHI' },
          homeTeam: { abbreviation: 'DAL' },
          venue: { name: 'AT&T Stadium' },
          playedStatus: 'COMPLETED'
        },
        score: {
          homeScoreTotal: 24,
          awayScoreTotal: 21,
          currentQuarter: 4,
          currentQuarterSecondsRemaining: 0,
          currentIntermission: 0
        }
      }
    ],
    references: {
      teamReferences: [
        { abbreviation: 'PHI', name: 'Eagles' },
        { abbreviation: 'DAL', name: 'Cowboys' }
      ]
    }
  };

  it('getGamesForWeekFromMsf formats games correctly', async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockGamesResponse
    });

    const games = await getGamesForWeekFromMsf({ season: 2025, week: 1 });
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.mysportsfeeds.com/v2.1/pull/nfl/2025-2026-regular/week/1/games.json',
      expect.objectContaining({ method: 'GET' })
    );

    expect(games).toHaveLength(1);
    expect(games[0]._id).toBe(1);
    expect(games[0].homeScore).toBe(24);
    expect(games[0].home.name).toBe('Cowboys');
  });

  it('getThisWeeksGamesFromMsf uses getCurrentWeek', async () => {
    dbUtils.getCurrentWeek.mockResolvedValueOnce({ season: 2025, week: 2 });
    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockGamesResponse
    });

    await getThisWeeksGamesFromMsf();
    expect(dbUtils.getCurrentWeek).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.mysportsfeeds.com/v2.1/pull/nfl/2025-2026-regular/week/2/games.json',
      expect.any(Object)
    );
  });

  it('getTeamStatisticsFromMsf formats team stats correctly', async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        teams: [
          {
            team: { id: 10, abbreviation: 'PHI' },
            stats: { standings: { wins: 10, losses: 2, ties: 0, pointsFor: 300, pointsAgainst: 200 } }
          }
        ]
      })
    });

    const teams = await getTeamStatisticsFromMsf({ season: 2025 });
    
    expect(teams).toHaveLength(1);
    expect(teams[0]._id).toBe(10);
    expect(teams[0].wins).toBe(10);
  });
});
