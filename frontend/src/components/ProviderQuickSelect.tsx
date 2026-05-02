import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProviderQuickSelectProps {
  providers: Array<{
    id: string;
    hospital: string;
    doctor: string;
    specialty?: string;
  }>;
  onSelect: (provider: { hospital: string; doctor: string }) => void;
}

const ProviderQuickSelect = ({ providers, onSelect }: ProviderQuickSelectProps) => {
  if (!providers.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>常用机构与医生</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={styles.chip}
            onPress={() =>
              onSelect({
                hospital: provider.hospital,
                doctor: provider.doctor,
              })
            }
          >
            <Text style={styles.hospitalText}>{provider.hospital}</Text>
            <Text style={styles.doctorText}>{provider.doctor}</Text>
            {provider.specialty ? <Text style={styles.metaText}>{provider.specialty}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#536159',
    marginBottom: 10,
  },
  chip: {
    width: 180,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2ebe5',
  },
  hospitalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 13,
    color: '#49685a',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#7d8a83',
  },
});

export default ProviderQuickSelect;
