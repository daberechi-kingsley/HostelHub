import { useMutation } from '@tanstack/react-query';
import { useContext } from 'react';
import { AuthContext } from '@/app/providers/AuthProvider';
import { useUser } from '@/hooks/useUser';
import {
  uploadProfilePhoto,
  updateUserProfile,
  updateUserAvatar,
  type ProfileUpdate,
} from './api';

/**
 * Save editable profile fields, then refresh the auth context so the new
 * name/bio propagate everywhere that reads appUser.
 */
export function useUpdateProfile() {
  const { firebaseUser } = useUser();
  const { refreshAppUser } = useContext(AuthContext);

  return useMutation({
    mutationFn: (fields: ProfileUpdate) => {
      if (!firebaseUser) return Promise.reject(new Error('Not signed in'));
      return updateUserProfile(firebaseUser.uid, fields);
    },
    onSuccess: () => refreshAppUser(),
  });
}

/**
 * Upload a new profile photo, write its URL to Firestore, then refresh the
 * auth context so the navbar, dropdown, and dashboard all show it immediately.
 */
export function useUploadProfilePhoto() {
  const { firebaseUser } = useUser();
  const { refreshAppUser } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (file: File) => {
      if (!firebaseUser) throw new Error('Not signed in');
      const url = await uploadProfilePhoto(firebaseUser.uid, file);
      await updateUserAvatar(firebaseUser.uid, url);
      return url;
    },
    onSuccess: () => refreshAppUser(),
  });
}
