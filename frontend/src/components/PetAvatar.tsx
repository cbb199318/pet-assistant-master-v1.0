import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { type PetSummary, resolveMediaUrl } from '../services/api';

type PetAvatarProps = {
  pet?: Pick<PetSummary, 'avatar' | 'species' | 'name'> | null;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
};

const speciesPalette: Record<string, { bg: string; fg: string; icon: string }> = {
  '狗': { bg: '#ffe4c7', fg: '#8b5b34', icon: '🐶' },
  '猫': { bg: '#e4efff', fg: '#55678d', icon: '🐱' },
};

export default function PetAvatar({
  pet,
  size = 84,
  borderColor = '#ffffff',
  borderWidth = 0,
}: PetAvatarProps) {
  const palette = speciesPalette[pet?.species || ''] || {
    bg: '#edf3ee',
    fg: '#56705f',
    icon: '🐾',
  };

  const dynamicStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderColor,
    borderWidth,
  };

  if (pet?.avatar) {
    return (
      <Image
        source={{ uri: resolveMediaUrl(pet.avatar) }}
        style={[styles.image, dynamicStyle]}
      />
    );
  }

  return (
    <View style={[styles.fallback, dynamicStyle, { backgroundColor: palette.bg }]}>
      <Text style={[styles.icon, { color: palette.fg, fontSize: size * 0.44 }]}>
        {palette.icon}
      </Text>
      <Text
        style={[styles.label, { color: palette.fg, fontSize: Math.max(11, size * 0.13) }]}
        numberOfLines={1}
      >
        {pet?.name || '宠物'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontWeight: '700',
  },
});
