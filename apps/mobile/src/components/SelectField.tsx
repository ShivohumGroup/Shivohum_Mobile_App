import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { HelperText, Menu, TextInput } from 'react-native-paper';
import { colors } from '@/theme/colors';

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  displayValue?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
};

/** Full-row tappable select (fixes “only arrow opens menu”). */
export function SelectField({
  label,
  value,
  displayValue,
  options,
  onChange,
  error,
  placeholder = 'Select…',
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const shown = displayValue ?? selected?.label ?? '';

  return (
    <View style={styles.wrap}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable
            disabled={disabled}
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <View pointerEvents="none">
              <TextInput
                label={label}
                mode="outlined"
                value={shown}
                placeholder={placeholder}
                editable={false}
                right={<TextInput.Icon icon="menu-down" />}
                style={styles.input}
                error={!!error}
              />
            </View>
          </Pressable>
        }
      >
        {options.map((o) => (
          <Menu.Item
            key={o.value}
            title={o.label}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
          />
        ))}
      </Menu>
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  input: { marginBottom: 4, backgroundColor: colors.surface },
});
