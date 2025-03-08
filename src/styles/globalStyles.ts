import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING, BORDER_RADIUS } from './theme';

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  containerPadded: {
    flex: 1,
    backgroundColor: COLORS.black,
    padding: SPACING.medium,
  },
  
  // Card styles
  card: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  
  // Text styles
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    marginBottom: SPACING.medium,
  },
  subtitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  heading: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    marginBottom: SPACING.small,
  },
  textSmall: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
  },
  textHighlight: {
    color: COLORS.accent,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.button,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.button,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  
  // Row and column layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  column: {
    flexDirection: 'column',
  },
  
  // Spacing
  spacer: {
    height: SPACING.medium,
  },
  spacerSmall: {
    height: SPACING.small,
  },
  spacerLarge: {
    height: SPACING.large,
  },
  
  // Form elements
  inputContainer: {
    marginBottom: SPACING.medium,
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.mediumGray,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
  },
  
  // Utility
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paddingHorizontal: {
    paddingHorizontal: SPACING.medium,
  },
  paddingVertical: {
    paddingVertical: SPACING.medium,
  },
});