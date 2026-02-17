import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../config/theme';

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  testID?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  disabled = false,
  icon,
  rightIcon,
  onRightIconPress,
  maxLength,
  autoCapitalize = 'none',
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? COLORS.darkCard : COLORS.lightCard;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;
  const borderColor = isFocused 
    ? COLORS.primary 
    : error 
    ? COLORS.error 
    : (isDark ? COLORS.darkBorder : COLORS.lightBorder);
  const borderWidth = isFocused || error ? 2 : 1;

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: textColor }]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: containerBg,
            borderColor,
            borderWidth,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}

        <RNTextInput
          testID={testID}
          style={[
            styles.input,
            {
              color: textColor,
            },
            multiline && { minHeight: numberOfLines ? numberOfLines * 40 : 80 },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? COLORS.darkGray : COLORS.lightGray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable && !disabled}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: textColor, fontSize: 18 }}>
              {showPassword ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: COLORS.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  iconLeft: {
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  error: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm,
  },
});
