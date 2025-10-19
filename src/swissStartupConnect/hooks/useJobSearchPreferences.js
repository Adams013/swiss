import { useMemo, useState } from 'react';
import { activeCityFilters } from '../data/filters';
import { SALARY_FALLBACK_RANGE, EQUITY_FALLBACK_RANGE, formatSalaryValue, formatEquityValue } from '../utils/salary';
import { Clock, TrendingUp, Percent } from 'lucide-react';

export const useJobSearchPreferences = ({ translate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);

  const jobFilters = useMemo(() => {
    const normalizedSearch = typeof searchTerm === 'string' ? searchTerm.trim() : '';
    const locationSelections = selectedFilters
      .map((filterId) => {
        const match = activeCityFilters.find((filter) => filter.id === filterId);
        return match ? match.label : null;
      })
      .filter(Boolean)
      .map((label) => label.trim())
      .filter(Boolean);

    const uniqueLocations = Array.from(new Set(locationSelections));

    return {
      searchTerm: normalizedSearch,
      locations: uniqueLocations,
    };
  }, [searchTerm, selectedFilters]);

  const [salaryRange, setSalaryRange] = useState(() => [...SALARY_FALLBACK_RANGE]);
  const [salaryBounds, setSalaryBounds] = useState(() => [...SALARY_FALLBACK_RANGE]);
  const [salaryRangeDirty, setSalaryRangeDirty] = useState(false);
  const [salaryFilterCadence, setSalaryFilterCadence] = useState('month');
  const [salaryInputValues, setSalaryInputValues] = useState(() => ({
    min: formatSalaryValue(SALARY_FALLBACK_RANGE[0], 'month'),
    max: formatSalaryValue(SALARY_FALLBACK_RANGE[1], 'month'),
  }));

  const [equityRange, setEquityRange] = useState(() => [...EQUITY_FALLBACK_RANGE]);
  const [equityBounds, setEquityBounds] = useState(() => [...EQUITY_FALLBACK_RANGE]);
  const [equityRangeDirty, setEquityRangeDirty] = useState(false);
  const [equityInputValues, setEquityInputValues] = useState(() => ({
    min: formatEquityValue(EQUITY_FALLBACK_RANGE[0]),
    max: formatEquityValue(EQUITY_FALLBACK_RANGE[1]),
  }));

  const [jobSort, setJobSort] = useState('recent');
  const jobSortOptions = useMemo(
    () => [
      { value: 'recent', label: translate('jobs.sort.recent', 'Most recent'), icon: Clock },
      { value: 'salary_desc', label: translate('jobs.sort.salary', 'Highest salary'), icon: TrendingUp },
      { value: 'equity_desc', label: translate('jobs.sort.equity', 'Highest equity'), icon: Percent },
    ],
    [translate]
  );

  return {
    searchTerm,
    setSearchTerm,
    selectedFilters,
    setSelectedFilters,
    jobFilters,
    salaryRange,
    setSalaryRange,
    salaryBounds,
    setSalaryBounds,
    salaryRangeDirty,
    setSalaryRangeDirty,
    salaryFilterCadence,
    setSalaryFilterCadence,
    salaryInputValues,
    setSalaryInputValues,
    equityRange,
    setEquityRange,
    equityBounds,
    setEquityBounds,
    equityRangeDirty,
    setEquityRangeDirty,
    equityInputValues,
    setEquityInputValues,
    jobSort,
    setJobSort,
    jobSortOptions,
  };
};

export default useJobSearchPreferences;
