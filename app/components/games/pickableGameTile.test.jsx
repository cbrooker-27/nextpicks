import { render, screen, fireEvent } from '@testing-library/react';
import PickableGameTile from './pickableGameTile';
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
  home: { id: 2, name: 'Cowboys', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/cowboys.png' }
};

const mockTeamDetails = [
  { _id: 1, name: 'Eagles', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/eagles.png' },
  { _id: 2, name: 'Cowboys', teamColoursHex: ['#000000', '#ffffff'], officialLogoImageSrc: '/cowboys.png' }
];

describe('PickableGameTile', () => {
  it('renders teams and allows making a pick', () => {
    const choiceChangedMock = jest.fn();
    
    render(
      <PickableGameTile 
        game={mockGame} 
        index={0} 
        choiceChanged={choiceChangedMock} 
        teamDetails={mockTeamDetails} 
      />
    );
    
    expect(screen.getByText(/Eagles will win by more than 3.5/i)).toBeInTheDocument();
    
    const ffButton = screen.getByRole('button', { name: 'ff' });
    fireEvent.click(ffButton);
    
    expect(choiceChangedMock).toHaveBeenCalledWith(0, 'ff');
  });
});
