import { render, screen, fireEvent } from '@testing-library/react';
import TopThreeWidget from './TopThreeWidget';
import React from 'react';

describe('TopThreeWidget', () => {
  it('renders loading state when no stats', () => {
    render(<TopThreeWidget userStats={[]} week={{ week: 2 }} />);
    expect(screen.getByText('Top 3 are making their way to the podium...')).toBeInTheDocument();
  });

  it('renders top 3 users correctly', () => {
    const mockStats = [
      { name: 'UserA', week1: 10, npc: false },
      { name: 'UserB', week1: 15, npc: false }, // 1st
      { name: 'UserC', week1: 12, npc: false }, // 2nd
      { name: 'UserD', week1: 8, npc: false },  // 4th
      { name: 'UserE', week1: 11, npc: false }, // 3rd
    ];
    
    render(<TopThreeWidget userStats={mockStats} week={{ week: 2 }} />);
    
    expect(screen.getByText('UserB')).toBeInTheDocument(); // 1st
    expect(screen.getByText('UserC')).toBeInTheDocument(); // 2nd
    expect(screen.getByText('UserE')).toBeInTheDocument(); // 3rd
    expect(screen.queryByText('UserA')).not.toBeInTheDocument(); // 4th
  });

  it('filters out npcs when toggle is clicked', () => {
    const mockStats = [
      { name: 'Human', week1: 10, npc: false },
      { name: 'Robot', week1: 15, npc: true }, 
    ];
    
    render(<TopThreeWidget userStats={mockStats} week={{ week: 2 }} />);
    
    // Initially NPCs included
    expect(screen.getByText('Robot')).toBeInTheDocument();
    
    // Toggle off
    const toggle = screen.getByLabelText(/Include NPCs/i);
    fireEvent.click(toggle);
    
    expect(screen.queryByText('Robot')).not.toBeInTheDocument();
    expect(screen.getByText('Human')).toBeInTheDocument();
  });
});
