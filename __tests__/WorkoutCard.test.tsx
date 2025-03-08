import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WorkoutCard from '../src/components/workout/WorkoutCard';

describe('WorkoutCard', () => {
  const mockWorkout = {
    id: 'workout-1',
    name: 'Test Workout',
    description: 'A test workout description',
    level: 'intermediate',
    duration: 1800, // 30 minutes
    focus: 'hiit',
    favorite: false,
    segments: [
      { type: 'warmup', intensity: 'recovery', duration: 300 },
      { type: 'run', intensity: 'base', duration: 600 },
      { type: 'recovery', intensity: 'recovery', duration: 300 },
      { type: 'run', intensity: 'run', duration: 300 },
      { type: 'cooldown', intensity: 'recovery', duration: 300 },
    ],
  };

  const mockOnPress = jest.fn();
  const mockOnFavoriteToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders workout information correctly', () => {
    const { getByText } = render(
      <WorkoutCard 
        workout={mockWorkout} 
        onPress={mockOnPress} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );

    // Check that the workout name is displayed
    expect(getByText('Test Workout')).toBeTruthy();
    
    // Check that the duration is formatted correctly
    expect(getByText('30 min')).toBeTruthy();
    
    // Check that the difficulty is displayed as stars
    expect(getByText('★ intensity')).toBeTruthy();
    
    // Check that interval count is correct
    expect(getByText('5 intervals')).toBeTruthy();
  });

  test('calls onPress when card is pressed', () => {
    const { getByText } = render(
      <WorkoutCard 
        workout={mockWorkout} 
        onPress={mockOnPress} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );

    // Find the card by its title and press it
    const card = getByText('Test Workout');
    fireEvent.press(card);
    
    // Verify onPress callback was called
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('calls onFavoriteToggle when favorite button is pressed', () => {
    const { getByText } = render(
      <WorkoutCard 
        workout={mockWorkout} 
        onPress={mockOnPress} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );

    // Find and press the favorite heart icon
    const heartIcon = getByText('♡');
    fireEvent.press(heartIcon);
    
    // Verify onFavoriteToggle callback was called
    expect(mockOnFavoriteToggle).toHaveBeenCalledTimes(1);
  });

  test('shows filled heart when workout is favorited', () => {
    const favoritedWorkout = {
      ...mockWorkout,
      favorite: true
    };
    
    const { getByText } = render(
      <WorkoutCard 
        workout={favoritedWorkout} 
        onPress={mockOnPress} 
        onFavoriteToggle={mockOnFavoriteToggle} 
      />
    );

    // Check that a filled heart is displayed
    expect(getByText('♥')).toBeTruthy();
  });

  test('renders visualization when showVisualization is true', () => {
    const { getByTestId } = render(
      <WorkoutCard 
        workout={mockWorkout} 
        onPress={mockOnPress} 
        onFavoriteToggle={mockOnFavoriteToggle}
        showVisualization={true}
      />
    );

    // Check that the visualization container is in the DOM
    expect(getByTestId('visualization-container')).toBeTruthy();
  });

  test('does not render visualization when showVisualization is false', () => {
    const { queryByTestId } = render(
      <WorkoutCard 
        workout={mockWorkout} 
        onPress={mockOnPress} 
        onFavoriteToggle={mockOnFavoriteToggle}
        showVisualization={false}
      />
    );

    // Check that the visualization is not in the DOM
    expect(queryByTestId('visualization-container')).toBeNull();
  });
});