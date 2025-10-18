import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCompanies,
  DEFAULT_COMPANY_PAGE_SIZE,
} from '../../../services/supabaseCompanies';
import { loadMockCompanies } from '../../../data/companyProfiles';

const MAX_INITIAL_COMPANY_PAGES = 3;

export const useSupabaseCompanies = ({
  mapStartupToCompany,
  pageSize = DEFAULT_COMPANY_PAGE_SIZE,
  maxInitialPages = MAX_INITIAL_COMPANY_PAGES,
} = {}) => {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyHasMorePages, setCompanyHasMorePages] = useState(false);
  const [supabaseCompanyPages, setSupabaseCompanyPages] = useState([]);
  const [companyPageRequest, setCompanyPageRequest] = useState(1);
  const fallbackCompaniesRef = useRef([]);
  const supabaseCompanyPagesRef = useRef([]);

  useEffect(() => {
    supabaseCompanyPagesRef.current = supabaseCompanyPages;
  }, [supabaseCompanyPages]);

  const setFallbackCompanies = useCallback((nextFallback) => {
    fallbackCompaniesRef.current = Array.isArray(nextFallback) ? nextFallback : [];
  }, []);

  const resetCompanies = useCallback(() => {
    setSupabaseCompanyPages([]);
    supabaseCompanyPagesRef.current = [];
    setCompanyHasMorePages(false);
    setCompanyPageRequest(1);
  }, []);

  useEffect(() => {
    resetCompanies();
  }, [mapStartupToCompany, resetCompanies]);

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

        while (!cancelled && supabaseCompanyPagesRef.current.length < companyPageRequest) {
          const pageNumber = supabaseCompanyPagesRef.current.length + 1;
          const response = await fetchCompanies({
            fallbackCompanies,
            mapStartupToCompany,
            page: pageNumber,
            pageSize,
            filters: {},
            signal: controller.signal,
          });

          if (cancelled) {
            return;
          }

          if (response.error) {
            console.error('Company load error', response.error);
          } else if (response.fallbackUsed) {
            console.info('Using fallback companies dataset');
          }

          if (response.fallbackUsed) {
            const fallbackResult = Array.isArray(response.companies)
              ? response.companies
              : fallbackCompanies;
            setCompanies(fallbackResult);
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

          if (response.hasMore && pageNumber < maxInitialPages) {
            setCompanyPageRequest((previous) =>
              previous < pageNumber + 1 ? pageNumber + 1 : previous
            );
          }

          if (!response.hasMore) {
            break;
          }
        }
      } catch (error) {
        console.error('Company load error', error);

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
  }, [companyPageRequest, mapStartupToCompany, maxInitialPages, pageSize]);

  const requestNextCompanyPage = useCallback(() => {
    setCompanyPageRequest((previous) => previous + 1);
  }, []);

  return {
    companies,
    setCompanies,
    companiesLoading,
    companyHasMorePages,
    requestNextCompanyPage,
    resetCompanies,
    setFallbackCompanies,
  };
};

export default useSupabaseCompanies;
