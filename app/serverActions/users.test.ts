/** @jest-environment node */
import { getUserStatsForStandings } from './users';
import * as dbUtils from '@/app/utils/db';
import * as msfUtils from '@/app/lib/msf';

jest.mock('@/app/utils/db');
jest.mock('@/app/lib/msf');

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
});
