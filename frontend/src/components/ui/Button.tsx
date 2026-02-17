import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../config/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = false,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    let baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: SPACING.md,
    };

    // Size
    if (size === 'small') {
      baseStyle = { ...baseStyle, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
    } else if (size === 'medium') {
      baseStyle = { ...baseStyle, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    } else {
      baseStyle = { ...baseStyle, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, minHeight: 48 };
    }

    // Variant
    if (variant === 'primary') {
      baseStyle = { ...baseStyle, backgroundColor: COLORS.primary };
    } else if (variant === 'secondary') {
      baseStyle = { ...baseStyle, backgroundColor: COLORS.secondary };
    } else if (variant === 'outline') {
      baseStyle = {
        ...baseStyle,
        backgroundColor: COLORS.transparent,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
      };
    } else if (variant === 'ghost') {
      baseStyle = { ...baseStyle, backgroundColor: COLORS.transparent };
    }

    // Disabled
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return { ...baseStyle, ...style };
  };

  const getLabelStyle = (): TextStyle => {
    let baseStyle: TextStyle = {
      ...TYPOGRAPHY.body,
      fontWeight: '600',
    };

    if (variant === 'primary' || variant === 'secondary') {
      baseStyle.color = COLORS.white;
    } else if (variant === 'outline') {
      baseStyle.color = COLORS.primary;
    } else {
      baseStyle.color = COLORS.primary;
    }

    if (size === 'small') {
      baseStyle = { ...baseStyle, ...TYPOGRAPHY.captionBold };
    }

    return { ...baseStyle, ...labelStyle };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white} />
      ) : (
        <>
          {icon && icon}
          <Text style={getLabelStyle()}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({});
