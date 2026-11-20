import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { FAB, Portal } from 'react-native-paper';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { colors } from '@/theme/colors';

export function FABMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  // Only show on main tab screens — hide on create/edit stack forms
  const inTabs = segments.includes('(tabs)');
  const onFormScreen =
    segments.includes('create') ||
    segments.includes('edit') ||
    pathname.includes('/income/') ||
    pathname.includes('/expenses/') ||
    pathname.includes('/progress/') ||
    pathname.includes('/contacts/') ||
    pathname.includes('/sites/') ||
    pathname.includes('/team/') ||
    pathname.includes('/settings');

  const visible = inTabs && !onFormScreen;
  const onMore = pathname.includes('more') || segments.includes('more');

  if (!visible) return null;

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible
        icon={open ? 'close' : 'plus'}
        style={[styles.group, onMore ? styles.groupMore : null]}
        fabStyle={styles.fab}
        color={colors.textInverse}
        actions={[
          {
            icon: 'cash-plus',
            label: 'Add income',
            onPress: () => router.push('/(app)/income/create'),
            color: colors.success,
          },
          {
            icon: 'cash-minus',
            label: 'Add expense',
            onPress: () => router.push('/(app)/expenses/create'),
            color: colors.danger,
          },
          {
            icon: 'calendar-plus',
            label: 'Add schedule',
            onPress: () => router.push('/(app)/schedule/create'),
            color: colors.accent,
          },
          {
            icon: 'camera-plus',
            label: 'Add progress',
            onPress: () => router.push('/(app)/progress/create'),
            color: colors.info,
          },
          {
            icon: 'account-plus',
            label: 'Add contact',
            onPress: () => router.push('/(app)/contacts/create'),
            color: colors.primary,
          },
        ]}
        onStateChange={({ open: next }) => setOpen(next)}
        onPress={() => {
          // toggle handled by onStateChange
        }}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  group: {
    // Lift above tab bar so More stays tappable
    paddingBottom: 64,
  },
  groupMore: {
    // Keep clear of the More tab on the far right
    marginRight: 64,
  },
  fab: {
    backgroundColor: colors.accent,
    borderRadius: 16,
  },
});
