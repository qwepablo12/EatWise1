import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../utils/theme';

export type MainTab = 'today' | 'progress' | 'profile';

interface TabBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onAddPress: () => void;
}

const TAB_ITEMS: { key: MainTab; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '●' },
  { key: 'progress', label: 'Progress', icon: '▲' },
  { key: 'profile', label: 'Profile', icon: '◆' },
];

export default function TabBar({ activeTab, onTabChange, onAddPress }: TabBarProps) {
  const { colors } = useTheme();

  const leftTab = TAB_ITEMS[0];
  const rightTabs = TAB_ITEMS.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <TabButton item={leftTab} active={activeTab === leftTab.key} onPress={() => onTabChange(leftTab.key)} />

      <View style={styles.addButtonSlot}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={onAddPress}
          accessibilityLabel="Add food"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {rightTabs.map((item) => (
        <TabButton key={item.key} item={item} active={activeTab === item.key} onPress={() => onTabChange(item.key)} />
      ))}
    </View>
  );
}

function TabButton({
  item,
  active,
  onPress,
}: {
  item: { key: MainTab; label: string; icon: string };
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Text style={[styles.tabIcon, { color: active ? colors.accent : colors.secondaryText }]}>{item.icon}</Text>
      <Text
        style={[
          styles.tabLabel,
          { color: active ? colors.primaryText : colors.secondaryText, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' },
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
  addButtonSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'Inter_400Regular',
    lineHeight: 28,
  },
});
