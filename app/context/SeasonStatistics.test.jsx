import { render, screen } from '@testing-library/react';
import { SeasonStatisticsProvider, useSeasonStatistics } from './SeasonStatistics';
import React from 'react';

const TestComponent = () => {
  const ctx = useSeasonStatistics();
  return <div>{ctx ? ctx.teamDetails : 'No Context'}</div>;
};

describe('SeasonStatisticsContext', () => {
  it('provides value to consumers', () => {
    const testValue = { teamDetails: 'Eagles' };
    
    render(
      <SeasonStatisticsProvider value={testValue}>
        <TestComponent />
      </SeasonStatisticsProvider>
    );

    expect(screen.getByText('Eagles')).toBeInTheDocument();
  });

  it('warns when used outside of provider', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<TestComponent />);
    
    expect(screen.getByText('No Context')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith("useSeasonStatistics must be used within a SeasonStatisticsProvider");
    
    consoleSpy.mockRestore();
  });
});
