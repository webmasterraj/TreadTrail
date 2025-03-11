import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../styles/theme';
import { WorkoutSession } from '../../types';

interface WorkoutCalendarProps {
  workoutHistory: WorkoutSession[];
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ workoutHistory }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Text style={styles.navButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthName}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={styles.navButton}>→</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekdays}>
        <Text style={styles.weekday}>S</Text>
        <Text style={styles.weekday}>M</Text>
        <Text style={styles.weekday}>T</Text>
        <Text style={styles.weekday}>W</Text>
        <Text style={styles.weekday}>T</Text>
        <Text style={styles.weekday}>F</Text>
        <Text style={styles.weekday}>S</Text>
      </View>
      
      <View style={styles.days}>
        {(() => {
          const today = new Date();
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth();
          
          // Get days in month and first day of month
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDayOfMonth = new Date(year, month, 1).getDay();
          
          const days = [];
          
          // Add empty cells for days before the 1st of the month
          for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(
              <View key={`empty-${i}`} style={styles.day} />
            );
          }
          
          // Add cells for each day of the month
          for (let day = 1; day <= daysInMonth; day++) {
            const isToday = 
              day === today.getDate() && 
              month === today.getMonth() && 
              year === today.getFullYear();
            
            // Create date in local timezone (not UTC)
            const currentDate = new Date(year, month, day);
            
            // Format date as YYYY-MM-DD in local timezone
            const dateString = 
              currentDate.getFullYear() + '-' + 
              String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
              String(currentDate.getDate()).padStart(2, '0');
            
            // Check if there's a workout on this specific date in the history
            const hasWorkout = workoutHistory.some(session => {
              try {
                // Skip sessions without a date
                if (!session || !session.date) {
                  return false;
                }
                
                // Get the session date - it may need normalization
                let sessionDate = session.date;
                
                // If the session date includes time part, extract just the date
                if (sessionDate && typeof sessionDate === 'string' && sessionDate.includes('T')) {
                  sessionDate = sessionDate.split('T')[0];
                }
                
                // Check if the dates match 
                return sessionDate === dateString;
              } catch (err) {
                console.error('Error processing workout date:', err);
                return false;
              }
            });
            
            days.push(
              <View 
                key={`day-${day}`} 
                style={[
                  styles.day,
                  isToday && styles.currentDay
                ]}
              >
                <Text style={[styles.dayNumber, isToday && styles.currentDayText]}>
                  {day}
                </Text>
                {hasWorkout && <View style={styles.workoutDot} />}
              </View>
            );
          }
          
          return days;
        })()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 15,
    padding: SPACING.medium,
    paddingBottom: SPACING.small,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  monthName: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  navButton: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.large,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    width: '14.28%',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 2,
  },
  day: {
    width: '14.28%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  dayNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 1,
  },
  currentDayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  workoutDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 1,
  },
});

export default WorkoutCalendar;