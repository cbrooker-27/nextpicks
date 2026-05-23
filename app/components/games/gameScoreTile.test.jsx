import { render, screen } from '@testing-library/react';
import GameScoreTile from './gameScoreTile';
import React from 'react';

jest.mock('@/app/context/SeasonStatistics', () => ({
  useSeasonStatistics: () => ({ seasonData: [] }),
}));

const mockGame = {
  startTime: '2025-09-07T13:00:00.000Z',
  awayFavorite: true,
  spread: 3.5,
  location: 'Test Stadium',
  away: { id: 1, name: 'Eagles', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/eagles.png' },
  home: { id: 2, name: 'Cowboys', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/cowboys.png' },
  userChoices: [
    { userId: 'TestUser', choice: 'ff' }
  ]
};

const mockLiveDetails = {
  playedStatus: 'COMPLETED',
  awayScore: 30,
  homeScore: 20,
  currentQuarter: 4,
  intermission: 0,
  timeRemaining: 0
};

const mockTeamDetails = [
  { _id: 1, name: 'Eagles', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/eagles.png' },
  { _id: 2, name: 'Cowboys', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/cowboys.png' }
];

const mockUsers = [
  { name: 'TestUser', image: '/user.png', npc: false }
];

describe('GameScoreTile', () => {
  it('renders correctly with final score', () => {
    render(
      <GameScoreTile 
        game={mockGame}
        liveDetails={mockLiveDetails}
        users={mockUsers}
        activeUser={{ name: 'TestUser' }}
        teamDetails={mockTeamDetails}
      />
    );

    expect(screen.getByText('Final')).toBeInTheDocument();
    
    // TestUser chose 'ff' and that should be rendered as an avatar
    // The avatar has alt text 'TestUser'
    expect(screen.getByAltText('TestUser')).toBeInTheDocument();
  });
});
