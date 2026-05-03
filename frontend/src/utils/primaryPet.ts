import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PetSummary } from '../services/api';

export const PRIMARY_PET_STORAGE_KEY = 'primaryPetId';

export async function getPrimaryPetId() {
  const value = await AsyncStorage.getItem(PRIMARY_PET_STORAGE_KEY);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setPrimaryPetId(petId: number) {
  await AsyncStorage.setItem(PRIMARY_PET_STORAGE_KEY, String(petId));
}

export async function clearPrimaryPetId() {
  await AsyncStorage.removeItem(PRIMARY_PET_STORAGE_KEY);
}

export async function resolvePrimaryPet(
  pets: PetSummary[],
  preferredPetId?: number | null,
) {
  if (pets.length === 0) {
    await clearPrimaryPetId();
    return null;
  }

  const candidateId =
    preferredPetId !== undefined ? preferredPetId : await getPrimaryPetId();
  const matchedPet = pets.find((pet) => pet.id === candidateId) || pets[0];

  await setPrimaryPetId(matchedPet.id);
  return matchedPet;
}
