# TreadTrail Developer Notes

This document contains important technical notes for developers working on the TreadTrail application. It outlines key architectural decisions, known issues, and implementation details that will help onboard new developers and serve as a reference for the existing team.

## Architecture Overview

TreadTrail is a React Native application built with TypeScript, using the following main technologies:

- React Native (with Expo)
- TypeScript
- Redux (with Redux Toolkit) for global state management
- React Context API for user settings and authentication
- AsyncStorage for local data persistence

## Key Components

### State Management

The app uses a hybrid approach to state management:

1. **Redux** - Used for workout data, favorites, and history
2. **React Context** - Used for user settings, preferences, and authentication state

### User Settings and Preferences

User settings are managed through `UserContext` and stored in AsyncStorage. The key implementation notes:

- Settings are stored in AsyncStorage under the key `@treadtrail:user_settings`
- All settings are kept in a single object to avoid partial updates
- Speed values are always stored in miles per hour (mph) internally
- Unit conversion (mph to km/h) happens at the display level only

## Pace Settings Implementation

### Working with Units

Speeds in the app are always stored in miles per hour (mph) internally, but can be displayed in either mph or km/h based on user preference.

**Unit Conversion:**
- When converting from mph to km/h: `km/h = mph * 1.60934`
- When converting from km/h to mph: `mph = km/h / 1.60934`

**Display Conversion Implementation:**
- Edit screens use real-time conversion for display and input
- List/detail screens convert only for display purposes 
- Always try to implement unit conversion at the display level, not by modifying the stored data

Example implementation:
```typescript
// Convert mph to km/h for display
const convertToMetric = (speed: number) => {
  return (speed * 1.60934).toFixed(1);
};

// Get displayed speed value based on current unit setting
const getDisplaySpeed = (speed: number) => {
  return isMetric ? convertToMetric(speed) : speed.toFixed(1);
};
```

### EditPaceScreen

When implementing or modifying pace settings screens, note:

1. Speeds are always stored internally in mph
2. For editing:
   - If user selects metric units, convert input values from km/h to mph before storing
   - When displaying values, convert from mph to km/h if metric is selected
3. Both pace values AND unit preference are saved together to ensure consistency
4. Always use `.toFixed(1)` for display to ensure one decimal place is shown

### WorkoutLibraryScreen

The WorkoutLibraryScreen handles both displaying workouts and showing current pace settings:

1. The screen maintains its own local state for pace settings to avoid re-render issues
2. `useFocusEffect` is used to refresh the displayed pace values when returning to the screen
3. Unit conversion happens at display time using the `getDisplaySpeed` helper function
4. An update key is used to force re-rendering when needed

## Known Issues and Solutions

### State Update Issues

**Problem:** Updates to settings may not be immediately reflected in the UI

**Solution:** 
- Use a combination of `useEffect` and `useFocusEffect` to ensure updates are captured
- Create local states that track the latest values from context
- Add an update key to force re-renders when necessary
- Ensure that the Context provider properly updates its own state after saving to AsyncStorage

### Units Conversion

**Problem:** Unit preferences (miles vs. kilometers) may not update correctly

**Solution:**
- Always store speeds in a single unit (mph) internally
- Perform conversion at display time based on the current preference
- When saving from user input, convert back to the storage unit if necessary
- Track unit preference changes and update the UI accordingly

## Testing

When testing unit conversion and pace settings:

1. Test both saving and loading of pace values
2. Verify conversion accuracy when switching between units
3. Test that values persist correctly after navigating away and back
4. Verify that decimal points display correctly (always show one decimal place)

## Future Improvements

1. Consider refactoring unit conversion into a shared utility
2. Add unit tests for conversion functions
3. Improve data validation for pace values
4. Add animations for unit changes
5. Consider adding support for more unit types (pace in min/km or min/mile)