jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { fetchJobs } from './supabaseJobs';
import { fetchCompanies } from './supabaseCompanies';
import { supabase } from '../supabaseClient';

const createQueryStub = (responseOverride = {}) => {
  const response = {
    data: [],
    error: null,
    count: 0,
    ...responseOverride,
  };

  const stub = {
    selectColumns: null,
    selectOptions: null,
    orClauses: [],
    inCalls: [],
    orderCalls: [],
    rangeArgs: null,
    limitArg: null,
    select(columns, options) {
      this.selectColumns = columns;
      this.selectOptions = options;
      return this;
    },
    or(value) {
      this.orClauses.push(value);
      return this;
    },
    order(column, options) {
      this.orderCalls.push({ column, options });
      return this;
    },
    range(start, end) {
      this.rangeArgs = [start, end];
      return this;
    },
    limit(value) {
      this.limitArg = value;
      return this;
    },
    in(column, values) {
      this.inCalls.push({ column, values });
      return this;
    },
    abortSignal() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(response).then(resolve, reject);
    },
  };

  return stub;
};

describe('Supabase filter composition', () => {
  beforeEach(() => {
    supabase.from.mockReset();
  });

  it('combines job search and location filters within a single OR clause', async () => {
    const queryStub = createQueryStub({
      data: [{ id: '1', title: 'Frontend Engineer', company_name: 'Example Co' }],
      count: 1,
    });

    supabase.from.mockReturnValue(queryStub);

    await fetchJobs({
      filters: { locations: ['Zurich'], searchTerm: 'engineer' },
      fallbackJobs: [],
    });

    expect(queryStub.orClauses).toHaveLength(1);
    expect(queryStub.orClauses[0]).toContain('and(location.ilike.%Zurich%,title.ilike.%engineer%)');
    expect(queryStub.orClauses[0]).toContain(
      'and(location_city.ilike.%Zurich%,company_name.ilike.%engineer%)'
    );
  });

  it('combines startup search and location filters within a single OR clause', async () => {
    const queryStub = createQueryStub({
      data: [{ id: '1', name: 'Climate Labs' }],
      count: 1,
    });

    supabase.from.mockReturnValue(queryStub);

    await fetchCompanies({
      filters: { locations: ['Geneva'], searchTerm: 'climate' },
      fallbackCompanies: [],
      mapStartupToCompany: (startup) => startup,
    });

    expect(queryStub.orClauses).toHaveLength(1);
    expect(queryStub.orClauses[0]).toContain('and(location.ilike.%Geneva%,name.ilike.%climate%)');
    expect(queryStub.orClauses[0]).toContain('and(location.ilike.%Geneva%,description.ilike.%climate%)');
  });
});
