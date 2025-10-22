import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { readCachedProfile, writeCachedProfile } from '../../utils/profileStorage';
import { getFileNameFromUrl } from '../../utils/documents';
import { detectMissingColumn, deriveColumnPresence } from '../../utils/salary';

/**
 * Custom hook for managing user profile state and operations
 * Handles profile loading, saving, and form management
 */
export const useProfile = ({ user, translate, setFeedback }) => {
  // Profile state
  const [profile, setProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    university: '',
    program: '',
    experience: '',
    bio: '',
    portfolio_url: '',
    cv_url: '',
    cv_file_name: '',
    avatar_url: '',
    cv_public: false,
  });
  const [profileColumnPresence, setProfileColumnPresence] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  // Refs
  const lastUploadedCvRef = useRef('');

  // Load profile function
  const loadProfile = useCallback(
    async (supabaseUser, options = {}) => {
      if (!supabaseUser) {
        setProfile(null);
        lastUploadedCvRef.current = '';
        return;
      }

      const applyProfileState = (profileRecord, applyOptions = {}) => {
        if (!profileRecord) {
          return;
        }

        const resolvedOptions = { ...options, ...applyOptions };
        const isStudentProfile = supabaseUser.type === 'student';
        const normalized = isStudentProfile
          ? profileRecord
          : { ...profileRecord, cv_url: null, cv_public: false };

        const lastUploadedCv = lastUploadedCvRef.current?.trim?.() || '';

        const profileId =
          normalized.id ||
          profileRecord.id ||
          normalized.user_id ||
          profileRecord.user_id ||
          supabaseUser.id;

        const sanitizedProfile = {
          ...normalized,
          id: profileId,
          user_id: supabaseUser.id,
          type: supabaseUser.type,
        };

        let resolvedCvUrl = '';
        let resolvedCvFileName =
          sanitizedProfile.cv_file_name || getFileNameFromUrl(sanitizedProfile.cv_url);

        if (isStudentProfile) {
          const incomingCv = sanitizedProfile.cv_url;
          if (typeof incomingCv === 'string' && incomingCv.trim()) {
            resolvedCvUrl = incomingCv.trim();
            if (!resolvedCvFileName) {
              resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
            }
            if (lastUploadedCv && resolvedCvUrl === lastUploadedCv) {
              lastUploadedCvRef.current = '';
            }
          }
        }

        if (resolvedOptions.updatePresence !== false) {
          setProfileColumnPresence((previous) => ({
            ...previous,
            ...deriveColumnPresence([sanitizedProfile]),
          }));
        }

        setProfile((previous) => {
          const nextProfile = { ...sanitizedProfile };
          if (isStudentProfile) {
            const previousCv = previous?.cv_url;
            const trimmedPreviousCv =
              typeof previousCv === 'string' ? previousCv.trim() : previousCv ?? '';
            if (!resolvedCvUrl) {
              if (lastUploadedCv) {
                resolvedCvUrl = lastUploadedCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              } else if (!resolvedOptions.overwriteDraft && trimmedPreviousCv) {
                resolvedCvUrl = trimmedPreviousCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              }
            }
            nextProfile.cv_url = resolvedCvUrl || null;
            nextProfile.cv_file_name = resolvedCvFileName || getFileNameFromUrl(resolvedCvUrl) || '';
          } else {
            nextProfile.cv_url = null;
            nextProfile.cv_file_name = '';
          }

          if (!resolvedOptions.overwriteDraft && previous) {
            if (!nextProfile.avatar_url && previous.avatar_url) {
              nextProfile.avatar_url = previous.avatar_url;
            }
          }
          writeCachedProfile(supabaseUser.id, nextProfile);
          return nextProfile;
        });

        setProfileForm((previous) => {
          const nextForm = {
            full_name: sanitizedProfile.full_name || supabaseUser.name,
            university: sanitizedProfile.university || '',
            program: sanitizedProfile.program || '',
            experience: sanitizedProfile.experience || '',
            bio: sanitizedProfile.bio || '',
            portfolio_url: sanitizedProfile.portfolio_url || '',
            cv_url: isStudentProfile ? sanitizedProfile.cv_url || '' : '',
            cv_file_name: isStudentProfile
              ? resolvedCvFileName || getFileNameFromUrl(sanitizedProfile.cv_url)
              : '',
            avatar_url: sanitizedProfile.avatar_url || '',
            cv_public: isStudentProfile ? !!sanitizedProfile.cv_public : false,
          };

          if (isStudentProfile) {
            const previousFormCv = previous?.cv_url;
            const trimmedPreviousFormCv =
              typeof previousFormCv === 'string' ? previousFormCv.trim() : previousFormCv ?? '';
            if (!resolvedCvUrl) {
              if (lastUploadedCv) {
                resolvedCvUrl = lastUploadedCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              } else if (!resolvedOptions.overwriteDraft && trimmedPreviousFormCv) {
                resolvedCvUrl = trimmedPreviousFormCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              }
            }
            nextForm.cv_url = resolvedCvUrl || '';
            nextForm.cv_file_name =
              resolvedCvFileName || getFileNameFromUrl(resolvedCvUrl) || nextForm.cv_file_name || '';
          } else {
            nextForm.cv_url = '';
            nextForm.cv_file_name = '';
          }

          if (!resolvedOptions.overwriteDraft && previous) {
            if (!nextForm.avatar_url && previous.avatar_url) {
              nextForm.avatar_url = previous.avatar_url;
            }
          }

          return nextForm;
        });
      };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          const message = error.message?.toLowerCase?.() || '';
          if (message.includes('row-level security')) {
            const cachedProfile = readCachedProfile(supabaseUser.id);
            if (cachedProfile) {
              applyProfileState(cachedProfile, { updatePresence: false });
              return;
            }
          }

          console.error('Profile fetch error', error);
          const cachedProfile = readCachedProfile(supabaseUser.id);
          if (cachedProfile) {
            applyProfileState(cachedProfile, { updatePresence: false });
          }
          return;
        }

        let profileRecord = data;

        if (!profileRecord) {
          const baseProfile = {
            user_id: supabaseUser.id,
            full_name: supabaseUser.name || '',
            type: supabaseUser.type,
          };

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(baseProfile)
            .select('*')
            .single();

          if (insertError) {
            const message = insertError.message?.toLowerCase?.() || '';
            if (message.includes('row-level security')) {
              const cachedProfile = readCachedProfile(supabaseUser.id);
              if (cachedProfile) {
                applyProfileState(cachedProfile, { updatePresence: false });
                return;
              }

              applyProfileState(
                { ...baseProfile, id: supabaseUser.id },
                { updatePresence: false }
              );
              return;
            }

            console.error('Profile insert error', insertError);
            return;
          }

          profileRecord = inserted;
        }

        applyProfileState(profileRecord);
      } catch (error) {
        console.error('Profile load error', error);
        const cachedProfile = readCachedProfile(supabaseUser.id);
        if (cachedProfile) {
          applyProfileState(cachedProfile, { updatePresence: false });
        }
      }
    },
    []
  );

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile(user);
    } else {
      setProfile(null);
      setProfileForm({
        full_name: '',
        university: '',
        program: '',
        experience: '',
        bio: '',
        portfolio_url: '',
        cv_url: '',
        cv_file_name: '',
        avatar_url: '',
        cv_public: false,
      });
    }
  }, [user, loadProfile]);

  // Submit profile handler
  const handleProfileSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    try {
      const isStudentProfile = user.type === 'student';
      const trimmedFullName = profileForm.full_name?.trim?.() ?? '';
      const trimmedUniversity = profileForm.university?.trim?.() ?? '';
      const trimmedProgram = profileForm.program?.trim?.() ?? '';
      const trimmedExperience = profileForm.experience?.trim?.() ?? '';
      const trimmedBio = profileForm.bio?.trim?.() ?? '';
      const trimmedPortfolio = profileForm.portfolio_url?.trim?.() ?? '';

      const plannedUpdates = {
        user_id: user.id,
        type: user.type,
        full_name: trimmedFullName,
        university: trimmedUniversity,
        program: trimmedProgram,
        experience: trimmedExperience,
        bio: trimmedBio,
        portfolio_url: trimmedPortfolio,
        avatar_url: profileForm.avatar_url || null,
      };

      if (isStudentProfile) {
        plannedUpdates.cv_url = profileForm.cv_url || null;
        if (profileColumnPresence.cv_public !== false) {
          plannedUpdates.cv_public = profileForm.cv_public;
        }
      } else {
        if (profileColumnPresence.cv_url !== false) {
          plannedUpdates.cv_url = null;
        }
        if (profileColumnPresence.cv_public !== false) {
          plannedUpdates.cv_public = false;
        }
      }

      const filterUnsupportedColumns = (payload) =>
        Object.entries(payload).reduce((accumulator, [key, value]) => {
          if (profileColumnPresence[key] === false) {
            return accumulator;
          }
          if (value === undefined) {
            return accumulator;
          }
          accumulator[key] = value;
          return accumulator;
        }, {});

      let attemptPayload = filterUnsupportedColumns(plannedUpdates);

      if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'user_id')) {
        attemptPayload.user_id = user.id;
      }

      let upsertedProfile = null;
      let cachedFallbackProfile = null;

      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(attemptPayload, { onConflict: 'user_id' })
          .select('*')
          .single();

        if (!error) {
          upsertedProfile = data;
          setProfileColumnPresence((previous) => {
            const next = { ...previous };
            Object.keys(attemptPayload).forEach((key) => {
              next[key] = true;
            });
            return next;
          });
          break;
        }

        const missingColumn = detectMissingColumn(error.message, 'profiles');
        if (!missingColumn) {
          const message = error.message?.toLowerCase?.() || '';
          if (message.includes('row-level security')) {
            cachedFallbackProfile = {
              ...(profile ?? {}),
              ...attemptPayload,
              user_id: user.id,
            };
            if (!cachedFallbackProfile.id) {
              cachedFallbackProfile.id = profile?.id || profile?.user_id || user.id;
            }
            break;
          }
          throw error;
        }

        setProfileColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));

        if (missingColumn === 'cv_public') {
          setProfileForm((prev) => ({ ...prev, cv_public: false }));
        }

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
          throw error;
        }

        const { [missingColumn]: _omitted, ...rest } = attemptPayload;
        attemptPayload = rest;

        if (!Object.keys(attemptPayload).length) {
          throw error;
        }

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'user_id')) {
          attemptPayload.user_id = user.id;
        }
      }

      const mergedProfile = upsertedProfile
        ? { ...(profile ?? {}), ...upsertedProfile }
        : cachedFallbackProfile
          ? { ...cachedFallbackProfile }
          : { ...(profile ?? {}), ...attemptPayload };

      if (!mergedProfile.id) {
        mergedProfile.id = profile?.id || profile?.user_id || user.id;
      }
      mergedProfile.user_id = user.id;
      mergedProfile.type = user.type;

      const sanitizedProfile = isStudentProfile
        ? mergedProfile
        : { ...mergedProfile, cv_url: null, cv_public: false };

      setProfile(sanitizedProfile);
      setProfileForm({
        full_name: sanitizedProfile.full_name || '',
        university: sanitizedProfile.university || '',
        program: sanitizedProfile.program || '',
        experience: sanitizedProfile.experience || '',
        bio: sanitizedProfile.bio || '',
        portfolio_url: sanitizedProfile.portfolio_url || '',
        cv_url: isStudentProfile ? sanitizedProfile.cv_url || '' : '',
        cv_file_name: isStudentProfile
          ? sanitizedProfile.cv_file_name || getFileNameFromUrl(sanitizedProfile.cv_url)
          : '',
        avatar_url: sanitizedProfile.avatar_url || '',
        cv_public: isStudentProfile ? !!sanitizedProfile.cv_public : false,
      });

      writeCachedProfile(user.id, sanitizedProfile);

      setFeedback({
        type: 'success',
        message: translate('profileModal.feedback.saved', 'Profile saved successfully!'),
      });

      setProfileModalOpen(false);
    } catch (error) {
      console.error('Profile save error', error);
      setFeedback({
        type: 'error',
        message: translate('profileModal.feedback.error', 'Failed to save profile. Please try again.'),
      });
    } finally {
      setProfileSaving(false);
    }
  }, [user, profileForm, profileColumnPresence, profile, translate, setFeedback]);

  return {
    // State
    profile,
    setProfile,
    profileModalOpen,
    setProfileModalOpen,
    profileForm,
    setProfileForm,
    profileColumnPresence,
    setProfileColumnPresence,
    profileSaving,

    // Refs
    lastUploadedCvRef,

    // Functions
    loadProfile,
    handleProfileSubmit,
  };
};

