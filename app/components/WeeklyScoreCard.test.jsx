import { render, screen } from '@testing-library/react';
import WeeklyScoreCard from './WeeklyScoreCard';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock SeasonStatistics context hook
jest.mock('../context/SeasonStatistics', () => ({
  useSeasonStatistics: () => ({ seasonData: [] }),
}));

describe('WeeklyScoreCard', () => {
  const mockUserStats = [
    { name: 'TestUser', week1: 10, possiblePoints1: 16 }
  ];

  it('renders loading state when userStats is empty', () => {
    render(
      <WeeklyScoreCard 
        userName="TestUser" 
        week={{ week: 1, season: 2025 }} 
        userStats={[]} 
      />
    );
    expect(screen.getByText('Calculating week 1 score...')).toBeInTheDocument();
  });

  it('renders score information correctly', () => {
    render(
      <WeeklyScoreCard 
        userName="TestUser" 
        week={{ week: 1, season: 2025 }} 
        userStats={mockUserStats} 
        currentWeek={false}
      />
    );
    
    // Should display the points (might be multiple due to Slider component labels)
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    
    // Check textContent
    const containerText = screen.getByRole('heading', { name: /10/ }).parentElement.textContent;
    expect(containerText).toMatch(/Last Week's Score/i);
    expect(containerText).toMatch(/out of 16 possible points/i);
  });
});
