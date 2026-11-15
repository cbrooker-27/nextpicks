/** @jest-environment node */
import { getUserStatsForStandings } from './users';
import * as dbUtils from '@/app/utils/db';
import * as msfUtils from '@/app/lib/msf';

jest.mock('@/app/utils/db', () => ({
  getThisYearsActiveUsers: jest.fn(),
  getAllPickedGames: jest.fn()
}));
jest.mock('@/app/lib/msf', () => ({
  getGamesForWeekFromMsf: jest.fn()
}));

describe('getUserStatsForStandings', () => {
  it('calculates standings correctly based on mock db data', async () => {
    const mockActiveUsers = [{ name: 'Freddy' }, { name: 'Homer' }];
    (dbUtils.getThisYearsActiveUsers as jest.Mock).mockResolvedValue(JSON.stringify(mockActiveUsers));

    const mockPickedGames = [
      {
        _id: 1,
        week: 1,
        awayFavorite: true,
        awayScore: 30,
        homeScore: 20,
        spread: 5, // away favorite by 5. Away won by 10. so "ff" wins.
        playedStatus: 'COMPLETED',
        userChoices: [
          { userId: 'Freddy', choice: 'ff' }, // correct
          { userId: 'Homer', choice: 'uu' } // incorrect
        ]
      }
    ];
    (dbUtils.getAllPickedGames as jest.Mock).mockResolvedValue(JSON.stringify(mockPickedGames));

    const stats = await getUserStatsForStandings({ season: 2025, week: 1 }, false);
    
    expect(stats).toHaveLength(2);
    const freddy = stats.find((u: any) => u.name === 'Freddy');
    const homer = stats.find((u: any) => u.name === 'Homer');

    // ff choice should be 2 points
    expect(freddy.totalPoints).toBe(2);
    expect(freddy.week1).toBe(2);

    // uu choice should be 0 points
    expect(homer.totalPoints).toBe(0);
    expect(homer.week1).toBe(0);
  });

  it('tracks total and per-week points earned from admin picks', async () => {
    const mockActiveUsers = [{ name: 'AdminPicked' }, { name: 'RegularPicker' }];
    (dbUtils.getThisYearsActiveUsers as jest.Mock).mockResolvedValue(JSON.stringify(mockActiveUsers));

    const mockPickedGames = [
      {
        week: 1,
        awayFavorite: true,
        spread: 3.5,
        awayScore: 30,
        homeScore: 20,
        playedStatus: 'COMPLETED',
        userChoices: [
          { userId: 'AdminPicked', choice: 'ff', adminOverride: true },
          { userId: 'RegularPicker', choice: 'uu' }
        ]
      },
      {
        week: 2,
        awayFavorite: true,
        spread: 3.5,
        awayScore: 20,
        homeScore: 24,
        playedStatus: 'COMPLETED',
        userChoices: [
          { userId: 'AdminPicked', choice: 'uf', adminOverride: true },
          { userId: 'RegularPicker', choice: 'uu' }
        ]
      },
      {
        week: 2,
        awayFavorite: true,
        spread: 3.5,
        awayScore: 0,
        homeScore: 0,
        playedStatus: 'UNPLAYED',
        userChoices: [
          { userId: 'AdminPicked', choice: 'ff', adminOverride: true }
        ]
      }
    ];
    (dbUtils.getAllPickedGames as jest.Mock).mockResolvedValue(JSON.stringify(mockPickedGames));

    const stats = await getUserStatsForStandings({ season: 2025, week: 2 }, false);
    const adminPicked = stats.find((u: any) => u.name === 'AdminPicked');
    const regularPicker = stats.find((u: any) => u.name === 'RegularPicker');

    expect(adminPicked).toMatchObject({
      totalPoints: 3,
      adminPoints: 3,
      totalAdminPicks: 3,
      hasAdminPicks: true,
      week1: 2,
      adminPointsWeek1: 2,
      week2: 1,
      adminPointsWeek2: 1,
      adminPicksWeek1: 1,
      adminPicksWeek2: 2
    });
    expect(regularPicker).toMatchObject({
      totalPoints: 2,
      adminPoints: 0,
      totalAdminPicks: 0,
      hasAdminPicks: false,
      adminPointsWeek1: 0,
      adminPointsWeek2: 0,
      adminPicksWeek1: 0,
      adminPicksWeek2: 0
    });
  });

  it('marks a week in progress while keeping live-game points out of completed scores', async () => {
    const mockActiveUsers = [{ name: 'Player' }];
    (dbUtils.getThisYearsActiveUsers as jest.Mock).mockResolvedValue(JSON.stringify(mockActiveUsers));
    const mockPickedGames = [
      {
        _id: 1,
        week: 1,
        awayFavorite: true,
        awayScore: 0,
        homeScore: 0,
        spread: 3,
        playedStatus: 'UNPLAYED',
        userChoices: [{ userId: 'Player', choice: 'ff' }]
      },
      {
        _id: 2,
        week: 1,
        awayFavorite: true,
        awayScore: 0,
        homeScore: 0,
        spread: 3,
        playedStatus: 'UNPLAYED',
        userChoices: [{ userId: 'Player', choice: 'ff' }]
      }
    ];
    (dbUtils.getAllPickedGames as jest.Mock).mockResolvedValue(JSON.stringify(mockPickedGames));
    (msfUtils.getGamesForWeekFromMsf as jest.Mock).mockResolvedValue([
      { _id: 1, awayScore: 30, homeScore: 20, playedStatus: 'COMPLETED' },
      { _id: 2, awayScore: 14, homeScore: 10, playedStatus: 'LIVE' }
    ]);

    const stats = await getUserStatsForStandings({ season: 2025, week: 1 }, true);

    expect(stats[0].week1).toBe(2);
    expect(stats[0].weekLive1).toBe(2);
    expect(stats[0].weekInProgress1).toBe(1);
  });
});
