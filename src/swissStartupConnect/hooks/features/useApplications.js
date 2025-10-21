import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { 
  normalizeApplicationKey, 
  upsertLocalApplication, 
  loadLocalApplicationsForStartup,
  updateStoredLocalApplication 
} from '../../utils/applicationStorage';
import { 
  APPLICATION_THREAD_STORAGE_KEY, 
  normalizeThreadStateValue 
} from '../../utils/applicationThreads';
import { detectMissingColumn, deriveColumnPresence } from '../../utils/salary';
import { getJobIdKey } from '../../utils/identifiers';

/**
 * Custom hook for managing job applications, CV uploads, and application threads
 */
export const useApplications = ({ 
  user, 
  profile, 
  profileForm, 
  startupProfile, 
  translate, 
  setFeedback,
  getLocalizedJobText 
}) => {
  // Application state
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationColumnPresence, setApplicationColumnPresence] = useState({});
  const [applicationsVersion, setApplicationsVersion] = useState(0);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [applicationStatusUpdating, setApplicationStatusUpdating] = useState(null);

  // Application modal state
  const [applicationModal, setApplicationModal] = useState(null);
  const [applicationSaving, setApplicationSaving] = useState(false);
  const [applicationError, setApplicationError] = useState('');

  // CV upload state
  const cvFileInputRef = useRef(null);
  const lastUploadedCvRef = useRef('');
  const [cvLocalName, setCvLocalName] = useState('');
  const [cvUploadState, setCvUploadState] = useState('idle');
  const [cvUploadError, setCvUploadError] = useState('');
  const [acknowledgeShare, setAcknowledgeShare] = useState(false);
  const [useExistingCv, setUseExistingCv] = useState(true);
  const [applicationCvUrl, setApplicationCvUrl] = useState('');
  const [applicationCvName, setApplicationCvName] = useState('');

  // Motivational letter state
  const [motivationalLetterUrl, setMotivationalLetterUrl] = useState('');
  const [motivationalLetterName, setMotivationalLetterName] = useState('');

  // Application threads state
  const [applicationThreads, setApplicationThreads] = useState(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const stored = window.localStorage.getItem(APPLICATION_THREAD_STORAGE_KEY);
      if (!stored) {
        return {};
      }
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }
      const normalised = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (!key) {
          return;
        }
        normalised[key] = normalizeThreadStateValue(value);
      });
      return normalised;
    } catch (error) {
      console.error('Failed to parse application threads', error);
      return {};
    }
  });

  const [applicationThreadDrafts, setApplicationThreadDrafts] = useState({});
  const [applicationThreadTypeDrafts, setApplicationThreadTypeDrafts] = useState({});
  const [applicationThreadScheduleDrafts, setApplicationThreadScheduleDrafts] = useState({});
  const [applicationThreadErrors, setApplicationThreadErrors] = useState({});

  // Persist application threads to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(
        APPLICATION_THREAD_STORAGE_KEY,
        JSON.stringify(applicationThreads)
      );
    } catch (error) {
      console.error('Failed to persist application threads', error);
    }
  }, [applicationThreads]);

  // Load applications when user or startup profile changes
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || user.type !== 'startup') {
        setApplications([]);
        return;
      }

      setApplicationsLoading(true);
      try {
        const baseColumns = ['id', 'status', 'motivational_letter', 'created_at'];
        if (applicationColumnPresence.acknowledged !== false) {
          baseColumns.push('acknowledged');
        }
        if (applicationColumnPresence.cv_override_url !== false) {
          baseColumns.push('cv_override_url');
        }

        let columnsToRequest = [...baseColumns];
        let fetchedApplications = [];
        let fetchError = null;

        while (columnsToRequest.length > 0) {
          const selectColumns = `${columnsToRequest.join(', ')}, profiles ( id, full_name, university, program, avatar_url, cv_url ), jobs ( id, title, company_name, startup_id )`;
          let query = supabase
            .from('job_applications')
            .select(selectColumns)
            .order('created_at', { ascending: false });

          if (startupProfile?.id) {
            query = query.eq('jobs.startup_id', startupProfile.id);
          }

          const { data, error } = await query;

          if (!error) {
            fetchedApplications = Array.isArray(data) ? data : [];
            fetchError = null;
            break;
          }

          fetchError = error;
          const missingColumn = detectMissingColumn(error.message, 'job_applications');
          if (!missingColumn || !columnsToRequest.includes(missingColumn)) {
            break;
          }

          columnsToRequest = columnsToRequest.filter((column) => column !== missingColumn);
          setApplicationColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));
        }

        if (fetchError) {
          console.error('Applications load error', fetchError);
          const localFallback = loadLocalApplicationsForStartup(startupProfile?.id);
          const sortedLocal = [...localFallback].sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            const safeATime = Number.isFinite(aTime) ? aTime : 0;
            const safeBTime = Number.isFinite(bTime) ? bTime : 0;
            return safeBTime - safeATime;
          });
          setApplications(sortedLocal);
          setApplicationColumnPresence((previous) => {
            const next = { ...previous };
            const derived = deriveColumnPresence(sortedLocal);
            Object.keys(derived).forEach((column) => {
              next[column] = true;
            });
            return next;
          });
        } else {
          const remoteApplications = fetchedApplications.map((application) => ({
            ...application,
            isLocal: false,
          }));
          const localFallback = loadLocalApplicationsForStartup(startupProfile?.id, fetchedApplications);
          const combined = [...remoteApplications, ...localFallback].sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            const safeATime = Number.isFinite(aTime) ? aTime : 0;
            const safeBTime = Number.isFinite(bTime) ? bTime : 0;
            return safeBTime - safeATime;
          });
          setApplications(combined);
          setApplicationColumnPresence((previous) => {
            const next = { ...previous };
            columnsToRequest.forEach((column) => {
              next[column] = true;
            });
            const derived = deriveColumnPresence(combined);
            Object.keys(derived).forEach((column) => {
              next[column] = true;
            });
            return next;
          });
        }
      } catch (error) {
        console.error('Applications load error', error);
        const localFallback = loadLocalApplicationsForStartup(startupProfile?.id);
        const sortedLocal = [...localFallback].sort((a, b) => {
          const aTime = new Date(a.created_at).getTime();
          const bTime = new Date(b.created_at).getTime();
          const safeATime = Number.isFinite(aTime) ? aTime : 0;
          const safeBTime = Number.isFinite(bTime) ? bTime : 0;
          return safeBTime - safeATime;
        });
        setApplications(sortedLocal);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, [user, startupProfile, applicationsVersion, applicationColumnPresence.acknowledged, applicationColumnPresence.cv_override_url]);

  // Submit application handler
  const submitApplication = useCallback(async () => {
    if (!applicationModal || !user) return;
    if (!acknowledgeShare) {
      setApplicationError('Please acknowledge that your profile will be shared.');
      return;
    }
    if (applicationModal.motivational_letter_required && !motivationalLetterUrl) {
      setApplicationError('A motivational letter file is required for this role.');
      return;
    }

    setApplicationSaving(true);
    setApplicationError('');

    try {
      if (!profile?.id) {
        setApplicationError('Complete your student profile before applying.');
        setApplicationSaving(false);
        return;
      }

      const selectedCvUrl = useExistingCv ? profileForm.cv_url : applicationCvUrl;

      if (!selectedCvUrl) {
        setApplicationError('Upload your CV or select the one saved in your profile before applying.');
        setApplicationSaving(false);
        return;
      }

      const basePayload = {
        job_id: applicationModal.id,
        profile_id: profile.id,
      };

      const assignOptionalField = (field, value, { skipIfNull } = {}) => {
        if (applicationColumnPresence[field] === false) {
          return;
        }
        if (skipIfNull && (value == null || value === '')) {
          return;
        }
        basePayload[field] = value;
      };

      assignOptionalField('status', 'submitted');
      assignOptionalField('acknowledged', false);
      if (applicationColumnPresence.motivational_letter !== false) {
        basePayload.motivational_letter = motivationalLetterUrl || null;
      }
      assignOptionalField('cv_override_url', !useExistingCv ? selectedCvUrl : null, { skipIfNull: true });

      let attemptPayload = { ...basePayload };
      const removedColumns = new Set();
      let insertSucceeded = false;
      let lastErrorMessage = '';
      let fallbackNotice = false;

      while (Object.keys(attemptPayload).length > 0) {
        const { error } = await supabase.from('job_applications').insert(attemptPayload);

        if (!error) {
          insertSucceeded = true;
          break;
        }

        lastErrorMessage = error.message;
        const missingColumn = detectMissingColumn(error.message, 'job_applications');

        if (!missingColumn) {
          break;
        }

        if (removedColumns.has(missingColumn)) {
          break;
        }

        removedColumns.add(missingColumn);
        setApplicationColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
          break;
        }

        const { [missingColumn]: _omitted, ...rest } = attemptPayload;
        attemptPayload = rest;
      }

      if (!insertSucceeded) {
        const rowLevelSecurityError = lastErrorMessage
          ?.toLowerCase?.()
          ?.includes('row-level security');

        if (!rowLevelSecurityError) {
          setApplicationError(
            lastErrorMessage ||
              translate('applications.errors.submit', 'Could not submit application. Please try again.')
          );
          return;
        }

        fallbackNotice = true;
        console.warn('RLS prevented Supabase application insert; storing locally.');

        const now = new Date();
        const createdAt = Number.isFinite(now.getTime()) ? now.toISOString() : new Date().toISOString();
        const baseProfileCvUrl = profileForm.cv_url?.trim?.() || profile?.cv_url || '';
        const profileName =
          profileForm.full_name?.trim?.() || profile?.full_name || user?.name?.trim?.() || '';
        const companyNameSnapshot = applicationModal.company_name?.trim?.() || 'Verified startup';
        const jobTitleSnapshot = getLocalizedJobText(applicationModal, 'title') || applicationModal.title || '';
        const localStartupId = applicationModal.startup_id || null;
        const localApplicationEntry = {
          id: `local-${Date.now()}`,
          job_id: applicationModal.id,
          profile_id: profile.id,
          startup_id: localStartupId,
          status: 'submitted',
          acknowledged: false,
          motivational_letter:
            applicationColumnPresence.motivational_letter !== false ? motivationalLetterUrl || null : null,
          cv_override_url: !useExistingCv && selectedCvUrl ? selectedCvUrl : null,
          created_at: createdAt,
          isLocal: true,
          profiles: {
            id: profile.id,
            full_name: profileName,
            university: profileForm.university || profile?.university || '',
            program: profileForm.program || profile?.program || '',
            avatar_url: profileForm.avatar_url || profile?.avatar_url || '',
            cv_url: baseProfileCvUrl,
          },
          jobs: {
            id: applicationModal.id,
            title: jobTitleSnapshot,
            company_name: companyNameSnapshot,
            startup_id: localStartupId,
          },
        };

        upsertLocalApplication(localApplicationEntry);
      }

      const appliedJobKey = getJobIdKey(applicationModal.id);
      if (appliedJobKey) {
        // Note: This would need access to setAppliedJobs from useJobs hook
        // You may need to lift this state or use a callback
      }

      setFeedback({
        type: 'success',
        message: fallbackNotice
          ? translate(
              'applications.feedback.submittedLocal',
              'Your application was saved locally and will sync when possible.'
            )
          : translate('applications.feedback.submitted', 'Application submitted successfully!'),
      });

      setApplicationModal(null);
      setAcknowledgeShare(false);
      setMotivationalLetterUrl('');
      setMotivationalLetterName('');
      setApplicationCvUrl('');
      setApplicationCvName('');
      setUseExistingCv(true);
      setApplicationsVersion((prev) => prev + 1);
    } catch (error) {
      console.error('Application submission error', error);
      setApplicationError(
        translate('applications.errors.submit', 'Could not submit application. Please try again.')
      );
    } finally {
      setApplicationSaving(false);
    }
  }, [
    applicationModal,
    user,
    profile,
    profileForm,
    acknowledgeShare,
    motivationalLetterUrl,
    useExistingCv,
    applicationCvUrl,
    applicationColumnPresence,
    translate,
    setFeedback,
    getLocalizedJobText,
  ]);

  // Update application status
  const handleApplicationStatusUpdate = useCallback(async (applicationId, newStatus) => {
    setApplicationStatusUpdating(applicationId);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) {
        console.error('Status update error', error);
        const localUpdated = updateStoredLocalApplication(applicationId, { status: newStatus });
        if (localUpdated) {
          setApplications((prev) =>
            prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
          );
        }
      } else {
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (error) {
      console.error('Status update error', error);
    } finally {
      setApplicationStatusUpdating(null);
    }
  }, []);

  return {
    // Application state
    applications,
    setApplications,
    applicationsLoading,
    applicationColumnPresence,
    setApplicationColumnPresence,
    applicationsVersion,
    setApplicationsVersion,
    expandedApplicationId,
    setExpandedApplicationId,
    applicationStatusUpdating,

    // Application modal
    applicationModal,
    setApplicationModal,
    applicationSaving,
    applicationError,
    setApplicationError,

    // CV upload
    cvFileInputRef,
    lastUploadedCvRef,
    cvLocalName,
    setCvLocalName,
    cvUploadState,
    setCvUploadState,
    cvUploadError,
    setCvUploadError,
    acknowledgeShare,
    setAcknowledgeShare,
    useExistingCv,
    setUseExistingCv,
    applicationCvUrl,
    setApplicationCvUrl,
    applicationCvName,
    setApplicationCvName,

    // Motivational letter
    motivationalLetterUrl,
    setMotivationalLetterUrl,
    motivationalLetterName,
    setMotivationalLetterName,

    // Application threads
    applicationThreads,
    setApplicationThreads,
    applicationThreadDrafts,
    setApplicationThreadDrafts,
    applicationThreadTypeDrafts,
    setApplicationThreadTypeDrafts,
    applicationThreadScheduleDrafts,
    setApplicationThreadScheduleDrafts,
    applicationThreadErrors,
    setApplicationThreadErrors,

    // Functions
    submitApplication,
    handleApplicationStatusUpdate,
  };
};

