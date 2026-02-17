import React from 'react';
import { View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, disabled }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? COLORS.darkCard : COLORS.lightCard;

  const Component = onPress ? View : View;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          ...SHADOWS.light,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
