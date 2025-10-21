import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { 
  STARTUP_TEAM_FIELDS, 
  STARTUP_FUNDRAISING_FIELDS, 
  STARTUP_INFO_FIELDS, 
  firstNonEmpty 
} from '../../utils/startups';
import { detectMissingColumn, deriveColumnPresence } from '../../utils/salary';

/**
 * Custom hook for managing startup profile state and operations
 * Handles startup profile loading, saving, and form management
 */
export const useStartupProfile = ({ user, translate, setFeedback, upsertCompanyFromStartup }) => {
  // Startup state
  const [startupProfile, setStartupProfile] = useState(null);
  const [startupModalOpen, setStartupModalOpen] = useState(false);
  const [startupForm, setStartupForm] = useState({
    name: '',
    registry_number: '',
    description: '',
    website: '',
    logo_url: '',
    verification_status: 'unverified',
    verification_note: '',
    team_size: '',
    fundraising: '',
    info_link: '',
  });
  const [startupColumnPresence, setStartupColumnPresence] = useState({});
  const [startupSaving, setStartupSaving] = useState(false);

  // Load startup profile
  const loadStartupProfile = useCallback(
    async (supabaseUser) => {
      if (!supabaseUser || supabaseUser.type !== 'startup') {
        setStartupProfile(null);
        setStartupColumnPresence({});
        return;
      }

      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('owner_id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Startup fetch error', error);
          return;
        }

        let startupRecord = data;

        if (!startupRecord) {
          const baseStartup = {
            owner_id: supabaseUser.id,
            name: supabaseUser.name,
            registry_number: '',
            description: '',
            website: '',
            logo_url: '',
            verification_status: 'unverified',
            verification_note: '',
          };

          const { data: inserted, error: insertError } = await supabase
            .from('startups')
            .insert(baseStartup)
            .select('*')
            .single();

          if (insertError) {
            console.error('Startup insert error', insertError);
            return;
          }

          startupRecord = inserted;
        }

        if (startupRecord) {
          setStartupColumnPresence((previous) => ({
            ...previous,
            ...deriveColumnPresence([startupRecord]),
          }));
        }

        setStartupProfile(startupRecord);
        upsertCompanyFromStartup(startupRecord);

        const teamSizeValue = firstNonEmpty(
          startupRecord.team,
          startupRecord.team_size,
          startupRecord.employees,
          startupRecord.headcount
        );
        const fundraisingValue = firstNonEmpty(
          startupRecord.fundraising,
          startupRecord.total_funding,
          startupRecord.total_raised,
          startupRecord.funding
        );
        const infoLinkValue = firstNonEmpty(
          startupRecord.info_link,
          startupRecord.profile_link,
          startupRecord.external_profile,
          startupRecord.external_profile_url
        );

        setStartupForm({
          name: startupRecord.name || supabaseUser.name,
          registry_number: startupRecord.registry_number || '',
          description: startupRecord.description || '',
          website: startupRecord.website || '',
          logo_url: startupRecord.logo_url || '',
          verification_status: startupRecord.verification_status || 'unverified',
          verification_note: startupRecord.verification_note || '',
          team_size: teamSizeValue || '',
          fundraising: fundraisingValue || '',
          info_link: infoLinkValue || '',
        });
      } catch (error) {
        console.error('Startup load error', error);
      }
    },
    [upsertCompanyFromStartup]
  );

  // Load startup profile when user changes
  useEffect(() => {
    if (user && user.type === 'startup') {
      loadStartupProfile(user);
    } else {
      setStartupProfile(null);
      setStartupColumnPresence({});
    }
  }, [user, loadStartupProfile]);

  // Submit startup profile handler
  const handleStartupSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!user) return;

    setStartupSaving(true);
    try {
      const trimmedName = startupForm.name?.trim?.() || user.name || '';
      const trimmedRegistry = startupForm.registry_number?.trim?.() ?? '';
      const trimmedDescription = startupForm.description?.trim?.() ?? '';
      const trimmedWebsite = startupForm.website?.trim?.() ?? '';
      const trimmedLogo = startupForm.logo_url?.trim?.() ?? '';
      const trimmedTeam = startupForm.team_size?.trim?.() ?? '';
      const trimmedFundraising = startupForm.fundraising?.trim?.() ?? '';
      const trimmedInfoLink = startupForm.info_link?.trim?.() ?? '';

      const basePayload = { owner_id: user.id };
      const assignBaseField = (key, value) => {
        if (value === undefined) {
          return;
        }
        if (key !== 'owner_id' && startupColumnPresence[key] === false) {
          return;
        }
        basePayload[key] = value;
      };

      assignBaseField('name', trimmedName);
      assignBaseField('registry_number', trimmedRegistry || null);
      assignBaseField('description', trimmedDescription || null);
      assignBaseField('website', trimmedWebsite || null);
      assignBaseField('logo_url', trimmedLogo || null);

      const dynamicAssignments = [];
      const registerDynamicField = (keys, rawValue) => {
        if (!Array.isArray(keys) || keys.length === 0) {
          return;
        }
        const normalizedKeys = keys.filter(Boolean);
        if (normalizedKeys.length === 0) {
          return;
        }

        const trimmedValue = rawValue?.trim?.() ?? '';
        const value = trimmedValue || null;

        let selectedIndex = normalizedKeys.findIndex((key) => startupColumnPresence[key] === true);
        if (selectedIndex === -1) {
          selectedIndex = normalizedKeys.findIndex((key) => startupColumnPresence[key] !== false);
        }

        if (selectedIndex === -1) {
          return;
        }

        const currentKey = normalizedKeys[selectedIndex];
        basePayload[currentKey] = value;
        dynamicAssignments.push({ keys: normalizedKeys, selectedIndex, currentKey, value });
      };

      registerDynamicField(STARTUP_TEAM_FIELDS, trimmedTeam);
      registerDynamicField(STARTUP_FUNDRAISING_FIELDS, trimmedFundraising);
      registerDynamicField(STARTUP_INFO_FIELDS, trimmedInfoLink);

      let attemptPayload = { ...basePayload };
      if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'owner_id')) {
        attemptPayload.owner_id = user.id;
      }
      const removedColumns = new Set();
      let finalPayload = attemptPayload;
      let upsertedStartup = null;

      const markColumnMissing = (column) => {
        removedColumns.add(column);
        setStartupColumnPresence((previous) => ({ ...previous, [column]: false }));
      };

      const handleMissingColumn = (column) => {
        if (!column) {
          return;
        }

        if (Object.prototype.hasOwnProperty.call(attemptPayload, column)) {
          const { [column]: _omitted, ...rest } = attemptPayload;
          attemptPayload = rest;
        }

        const assignment = dynamicAssignments.find((entry) => entry.keys.includes(column));
        markColumnMissing(column);

        if (!assignment || assignment.currentKey !== column) {
          return;
        }

        for (let index = assignment.selectedIndex + 1; index < assignment.keys.length; index += 1) {
          const nextKey = assignment.keys[index];
          if (removedColumns.has(nextKey)) {
            continue;
          }
          if (startupColumnPresence[nextKey] === false) {
            continue;
          }
          attemptPayload[nextKey] = assignment.value;
          assignment.selectedIndex = index;
          assignment.currentKey = nextKey;
          return;
        }

        assignment.exhausted = true;
      };

      while (Object.keys(attemptPayload).length > 0) {
        const { data, error } = await supabase
          .from('startups')
          .upsert(attemptPayload, { onConflict: 'owner_id' })
          .select('*')
          .single();

        if (!error) {
          upsertedStartup = data;
          finalPayload = attemptPayload;
          break;
        }

        const missingColumn = detectMissingColumn(error.message, 'startups');
        if (!missingColumn) {
          throw error;
        }

        if (
          removedColumns.has(missingColumn) &&
          !Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)
        ) {
          throw error;
        }

        handleMissingColumn(missingColumn);

        if (Object.keys(attemptPayload).length === 0) {
          throw error;
        }

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'owner_id')) {
          attemptPayload.owner_id = user.id;
        }
      }

      if (!upsertedStartup) {
        throw new Error(translate('common.errors.unknown', 'Unknown error'));
      }

      setStartupColumnPresence((previous) => {
        const next = { ...previous };
        Object.keys(finalPayload || {}).forEach((column) => {
          next[column] = true;
        });
        dynamicAssignments.forEach((assignment) => {
          if (assignment.currentKey) {
            next[assignment.currentKey] = true;
          }
        });
        return next;
      });

      const savedRecord = { ...(startupProfile ?? {}), ...upsertedStartup };
      setStartupProfile(savedRecord);
      upsertCompanyFromStartup(savedRecord);

      const nextTeam = firstNonEmpty(
        savedRecord.team,
        savedRecord.team_size,
        savedRecord.employees,
        savedRecord.headcount
      );
      const nextFundraising = firstNonEmpty(
        savedRecord.fundraising,
        savedRecord.total_funding,
        savedRecord.total_raised,
        savedRecord.funding
      );
      const nextInfoLink = firstNonEmpty(
        savedRecord.info_link,
        savedRecord.profile_link,
        savedRecord.external_profile,
        savedRecord.external_profile_url
      );

      setStartupForm({
        name: savedRecord.name || trimmedName,
        registry_number: savedRecord.registry_number || '',
        description: savedRecord.description || '',
        website: savedRecord.website || '',
        logo_url: savedRecord.logo_url || '',
        verification_status: savedRecord.verification_status || 'unverified',
        verification_note: savedRecord.verification_note || '',
        team_size: nextTeam || '',
        fundraising: nextFundraising || '',
        info_link: nextInfoLink || '',
      });

      setFeedback({
        type: 'success',
        message: translate('startupModal.feedback.saved', 'Startup profile saved successfully!'),
      });

      setStartupModalOpen(false);
    } catch (error) {
      console.error('Startup save error', error);
      setFeedback({
        type: 'error',
        message: translate('startupModal.feedback.error', 'Failed to save startup profile. Please try again.'),
      });
    } finally {
      setStartupSaving(false);
    }
  }, [user, startupForm, startupColumnPresence, startupProfile, translate, setFeedback, upsertCompanyFromStartup]);

  return {
    // State
    startupProfile,
    setStartupProfile,
    startupModalOpen,
    setStartupModalOpen,
    startupForm,
    setStartupForm,
    startupColumnPresence,
    setStartupColumnPresence,
    startupSaving,

    // Functions
    loadStartupProfile,
    handleStartupSubmit,
  };
};

