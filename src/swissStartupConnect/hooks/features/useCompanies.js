import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCompanies } from '../../../services/supabaseCompanies';
import { loadMockCompanies } from '../../../data/companyProfiles';
import { mapStartupToCompany } from '../../utils/startups';
import { COMPANIES_PAGE_SIZE, MAX_INITIAL_COMPANY_PAGES } from '../../constants/pagination';

/**
 * Custom hook for managing companies data, catalog, and following
 */
export const useCompanies = () => {
  // Companies state
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesFallbackActive, setCompaniesFallbackActive] = useState(false);
  const [activeCompanyProfile, setActiveCompanyProfile] = useState(null);
  
  // Company catalog
  const [companyCatalog, setCompanyCatalog] = useState([]);
  const [companyCatalogById, setCompanyCatalogById] = useState({});
  
  // Pagination state
  const [supabaseCompanyPages, setSupabaseCompanyPages] = useState([]);
  const [companyPageRequest, setCompanyPageRequest] = useState(1);
  const [companyHasMorePages, setCompanyHasMorePages] = useState(false);
  
  // Sorting state
  const [companySort, setCompanySort] = useState('recent');
  
  // Refs
  const fallbackCompaniesRef = useRef([]);
  const supabaseCompanyPagesRef = useRef([]);
  
  // Followed companies state
  const [followedCompanies, setFollowedCompanies] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('ssc_followed_companies');
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return Array.from(
        new Set(
          parsed
            .filter((id) => id !== null && id !== undefined)
            .map((id) => String(id).trim())
            .filter(Boolean)
        )
      );
    } catch (error) {
      console.error('Failed to parse followed companies', error);
      return [];
    }
  });

  // Sync refs with state
  useEffect(() => {
    supabaseCompanyPagesRef.current = supabaseCompanyPages;
  }, [supabaseCompanyPages]);

  // Persist followed companies to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sanitized = Array.from(new Set(followedCompanies.filter(Boolean)));
    window.localStorage.setItem('ssc_followed_companies', JSON.stringify(sanitized));
  }, [followedCompanies]);

  // Helper to set fallback state
  const setCompaniesFallbackState = useCallback((active) => {
    setCompaniesFallbackActive(active);
  }, []);

  // Upsert company from startup
  const upsertCompanyFromStartup = useCallback(
    (startupRecord) => {
      const mapped = mapStartupToCompany(startupRecord);
      if (!mapped || !mapped.name) {
        return;
      }

      const idKey = mapped.id != null ? String(mapped.id) : '';
      const nameKey = mapped.name ? mapped.name.trim().toLowerCase() : '';

      setCompanies((previous) => {
        const matchIndex = previous.findIndex((company) => {
          if (!company) {
            return false;
          }
          if (idKey && company.id != null && String(company.id) === idKey) {
            return true;
          }
          if (nameKey && company.name && company.name.trim().toLowerCase() === nameKey) {
            return true;
          }
          return false;
        });

        if (matchIndex >= 0) {
          const updated = [...previous];
          updated[matchIndex] = { ...previous[matchIndex], ...mapped };
          return updated;
        }

        return [...previous, mapped];
      });
    },
    []
  );

  // Load companies effect
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadCompanies = async () => {
      if (companyPageRequest <= supabaseCompanyPagesRef.current.length) {
        return;
      }

      setCompaniesLoading(true);

      try {
        let fallbackCompanies =
          fallbackCompaniesRef.current.length > 0
            ? fallbackCompaniesRef.current
            : await loadMockCompanies();

        if (!Array.isArray(fallbackCompanies)) {
          fallbackCompanies = [];
        }

        if (!cancelled && fallbackCompaniesRef.current.length === 0) {
          fallbackCompaniesRef.current = fallbackCompanies;
        }

        while (
          !cancelled &&
          supabaseCompanyPagesRef.current.length < companyPageRequest
        ) {
          const pageNumber = supabaseCompanyPagesRef.current.length + 1;
          const response = await fetchCompanies({
            fallbackCompanies,
            mapStartupToCompany,
            page: pageNumber,
            pageSize: COMPANIES_PAGE_SIZE,
            filters: {},
            signal: controller.signal,
          });

          if (cancelled) {
            return;
          }

          if (response.error) {
            console.error('Company load error', response.error);
            setCompaniesFallbackState(true);
          } else if (response.fallbackUsed) {
            console.info('Using fallback companies dataset');
            setCompaniesFallbackState(true);
          } else {
            setCompaniesFallbackState(false);
          }

          if (response.fallbackUsed) {
            setCompanies(response.companies);
            supabaseCompanyPagesRef.current = [];
            setSupabaseCompanyPages([]);
            setCompanyHasMorePages(false);
            break;
          }

          const pageData = Array.isArray(response.companies) ? response.companies : [];
          const nextPages = [...supabaseCompanyPagesRef.current, pageData];
          supabaseCompanyPagesRef.current = nextPages;
          setSupabaseCompanyPages(nextPages);
          setCompanyHasMorePages(response.hasMore);

          const supabaseFlattened = nextPages.flat();
          const supabaseIdSet = new Set(
            supabaseFlattened
              .map((company) => (company?.id != null ? String(company.id) : ''))
              .filter(Boolean)
          );
          const fallbackUnique = fallbackCompanies.filter((company) => {
            const idKey = company?.id != null ? String(company.id) : '';
            return idKey ? !supabaseIdSet.has(idKey) : true;
          });
          setCompanies([...supabaseFlattened, ...fallbackUnique]);

          if (response.hasMore && pageNumber < MAX_INITIAL_COMPANY_PAGES) {
            setCompanyPageRequest((previous) =>
              previous < pageNumber + 1 ? pageNumber + 1 : previous
            );
          }

          if (!response.hasMore) {
            break;
          }
        }
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        console.error('Company load error', error);
        setCompaniesFallbackState(true);

        let fallbackCompanies =
          fallbackCompaniesRef.current.length > 0
            ? fallbackCompaniesRef.current
            : [];

        if (fallbackCompanies.length === 0) {
          try {
            const loaded = await loadMockCompanies();
            fallbackCompanies = Array.isArray(loaded) ? loaded : [];
            fallbackCompaniesRef.current = fallbackCompanies;
          } catch (fallbackError) {
            console.error('Fallback companies load error', fallbackError);
            fallbackCompanies = [];
          }
        }

        setCompanies(fallbackCompanies);
        supabaseCompanyPagesRef.current = [];
        setSupabaseCompanyPages([]);
        setCompanyHasMorePages(false);
      } finally {
        if (!cancelled) {
          setCompaniesLoading(false);
        }
      }
    };

    loadCompanies();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [companyPageRequest, setCompaniesFallbackState]);

  // Toggle followed company
  const toggleFollowedCompany = useCallback((followKey) => {
    setFollowedCompanies((prev) => {
      const key = followKey.trim();
      if (!key) {
        return prev;
      }
      if (prev.includes(key)) {
        return prev.filter((id) => id !== key);
      }
      return [...prev, key];
    });
  }, []);

  return {
    // Companies data
    companies,
    setCompanies,
    companiesLoading,
    companiesFallbackActive,
    setCompaniesFallbackActive,
    activeCompanyProfile,
    setActiveCompanyProfile,

    // Company catalog
    companyCatalog,
    setCompanyCatalog,
    companyCatalogById,
    setCompanyCatalogById,

    // Pagination
    supabaseCompanyPages,
    setSupabaseCompanyPages,
    companyPageRequest,
    setCompanyPageRequest,
    companyHasMorePages,
    setCompanyHasMorePages,

    // Sorting
    companySort,
    setCompanySort,

    // Following
    followedCompanies,
    setFollowedCompanies,
    toggleFollowedCompany,

    // Functions
    upsertCompanyFromStartup,

    // Refs
    fallbackCompaniesRef,
    supabaseCompanyPagesRef,
  };
};

