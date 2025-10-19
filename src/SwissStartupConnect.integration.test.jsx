import React from 'react';
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fetchJobs } from './services/supabaseJobs';
import { fetchCompanies } from './services/supabaseCompanies';
import { loadMockJobs } from './data/mockJobs';
import { loadMockEvents } from './data/mockEvents';
import {
  loadCompanyProfiles,
  loadCompanyProfilesById,
  loadMockCompanies,
} from './data/companyProfiles';

jest.mock('./services/supabaseJobs', () => ({
  fetchJobs: jest.fn(),
}));

jest.mock('./services/supabaseCompanies', () => ({
  fetchCompanies: jest.fn(),
}));

jest.mock('./data/mockJobs', () => ({
  loadMockJobs: jest.fn(),
}));

jest.mock('./data/mockEvents', () => ({
  loadMockEvents: jest.fn(),
}));

jest.mock('./data/companyProfiles', () => ({
  loadCompanyProfiles: jest.fn(),
  loadCompanyProfilesById: jest.fn(),
  loadMockCompanies: jest.fn(),
}));

jest.mock('./supabaseClient', () => {
  const eventRecord = {
    id: 'event-supabase-1',
    title: 'Supabase Showcase',
    cityKey: 'Zurich',
    city: 'Zurich',
    event_date: '2024-09-01',
    event_time: '18:00',
    location: 'Impact Hub',
  };

  const createQuery = (data = []) => {
    const query = {
      select: jest.fn(() => query),
      order: jest.fn(() => Promise.resolve({ data, error: null })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
      eq: jest.fn(() => query),
      in: jest.fn(() => query),
      maybeSingle: jest.fn(() => Promise.resolve({ data: data[0] ?? null, error: null })),
      single: jest.fn(() => Promise.resolve({ data: data[0] ?? null, error: null })),
      limit: jest.fn(() => query),
      range: jest.fn(() => query),
    };
    return query;
  };

  const eventsQuery = createQuery([eventRecord]);
  const defaultQuery = createQuery([]);

  const from = jest.fn((table) => (table === 'events' ? eventsQuery : defaultQuery));

  const supabaseMock = {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
        error: null,
      })),
      getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: null }, error: null })),
      })),
    },
    from,
  };

  return {
    supabase: supabaseMock,
    default: supabaseMock,
    isSupabaseConfigured: true,
  };
});

jest.mock('./SwitzerlandMap', () => {
  const React = require('react');

  const groupByCity = (items = [], resolveKey) => {
    return items.reduce((accumulator, item) => {
      const key = resolveKey(item);
      if (!key) {
        return accumulator;
      }
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(item);
      return accumulator;
    }, {});
  };

  const MockMap = ({
    jobs = [],
    events = [],
    visibleLayer = 'jobs',
    onJobCityClick,
    onEventCityClick,
  }) => {
    const jobCities = React.useMemo(() => groupByCity(jobs, (job) => job.cityKey), [jobs]);
    const eventCities = React.useMemo(() => groupByCity(events, (event) => event.cityKey), [events]);

    return (
      <div data-testid="mock-map">
        <span data-testid="mock-visible-layer">{visibleLayer}</span>
        {visibleLayer === 'jobs'
          ? Object.entries(jobCities).map(([cityKey, cityJobs]) => (
              <button
                key={`jobs-${cityKey}`}
                type="button"
                onClick={() => onJobCityClick && onJobCityClick(cityKey, cityJobs)}
              >
                View jobs in {cityKey}
              </button>
            ))
          : Object.entries(eventCities).map(([cityKey, cityEvents]) => (
              <button
                key={`events-${cityKey}`}
                type="button"
                onClick={() => onEventCityClick && onEventCityClick(cityKey, cityEvents)}
              >
                View events in {cityKey}
              </button>
            ))}
      </div>
    );
  };

  return {
    __esModule: true,
    default: MockMap,
    SWISS_CITIES: {
      Zurich: { name: 'Zurich' },
      Bern: { name: 'Bern' },
    },
    resolveCityKeyForJob: (job) => job.cityKey,
    resolveCityKeyForEvent: (event) => event.cityKey,
  };
});

const suppressedConsoleErrorPatterns = [
  /not wrapped in act\(\)/i,
  /Events load error/i,
];

let SwissStartupConnect;

const supabaseJob = {
  id: 'job-supabase-1',
  title: 'Supabase Engineer',
  company_name: 'Helvetic Data',
  location: 'Zurich',
  cityKey: 'Zurich',
  location_city: 'Zurich',
  work_arrangement: 'hybrid',
};

const fallbackJob = {
  id: 'job-fallback-1',
  title: 'Fallback Analyst',
  company_name: 'Fallback Ventures',
  location: 'Bern',
  cityKey: 'Bern',
  location_city: 'Bern',
  work_arrangement: 'on_site',
};

const supabaseCompany = {
  id: 'company-supabase-1',
  name: 'Helvetic Data',
  location: 'Zurich',
  profile: {
    hero: { headline: 'Empowering founders' },
  },
};

const fallbackCompany = {
  id: 'company-fallback-1',
  name: 'Fallback Ventures',
  location: 'Bern',
};

const mockEvent = {
  id: 'event-1',
  title: 'Zurich Startup Night',
  cityKey: 'Zurich',
  city: 'Zurich',
  location: 'Impact Hub',
  event_date: '2024-10-10',
  event_time: '18:00',
  street_address: 'Main Street 1',
  postal_code: '8000',
};

const commonMockSetup = () => {
  loadMockJobs.mockResolvedValue([supabaseJob, fallbackJob]);
  loadMockCompanies.mockResolvedValue([supabaseCompany, fallbackCompany]);
  loadCompanyProfiles.mockResolvedValue([
    { ...supabaseCompany, profile: { hero: { headline: 'Empowering founders' } } },
  ]);
  loadCompanyProfilesById.mockResolvedValue({
    [String(supabaseCompany.id)]: {
      ...supabaseCompany,
      profile: { hero: { headline: 'Empowering founders' } },
    },
  });
  loadMockEvents.mockResolvedValue([mockEvent]);
};

const setupSupabaseSuccess = () => {
  commonMockSetup();
  fetchJobs.mockResolvedValue({
    jobs: [supabaseJob],
    error: null,
    fallbackUsed: false,
    columnPresenceData: [supabaseJob],
    page: 1,
    pageSize: 50,
    hasMore: false,
    totalCount: 1,
  });
  fetchCompanies.mockResolvedValue({
    companies: [supabaseCompany],
    error: null,
    fallbackUsed: false,
    page: 1,
    pageSize: 50,
    hasMore: false,
    totalCount: 1,
  });
};

const setupFallbackScenario = () => {
  commonMockSetup();
  fetchJobs.mockResolvedValue({
    jobs: [fallbackJob],
    error: new Error('network error'),
    fallbackUsed: true,
    columnPresenceData: [fallbackJob],
    page: 1,
    pageSize: 50,
    hasMore: false,
    totalCount: 1,
  });
  fetchCompanies.mockResolvedValue({
    companies: [fallbackCompany],
    error: new Error('network error'),
    fallbackUsed: true,
    page: 1,
    pageSize: 50,
    hasMore: false,
    totalCount: 1,
  });
};

const setupSupabaseErrorScenario = () => {
  commonMockSetup();
  fetchJobs.mockRejectedValue(new Error('network down'));
  fetchCompanies.mockRejectedValue(new Error('network down'));
};

const renderApp = async () => {
  const user = userEvent.setup();
  render(<SwissStartupConnect />);
  await waitFor(() => expect(loadMockJobs).toHaveBeenCalled());
  await waitFor(() => expect(fetchJobs).toHaveBeenCalled());
  return user;
};

beforeAll(() => {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  const originalConsoleError = console.error;
  jest.spyOn(console, 'error').mockImplementation((message, ...rest) => {
    if (
      typeof message === 'string' &&
      suppressedConsoleErrorPatterns.some((pattern) => pattern.test(message))
    ) {
      return;
    }
    originalConsoleError(message, ...rest);
  });
  SwissStartupConnect = require('./SwissStartupConnect').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

afterAll(() => {
  console.error.mockRestore();
});

it('switches hero copy when changing languages', async () => {
  setupSupabaseSuccess();
  const user = await renderApp();

  expect(await screen.findByText(/Shape the next Swiss startup success story/i)).toBeInTheDocument();

  const languageGroup = await screen.findByRole('group', { name: /language/i });
  const toggleButton = within(languageGroup).getByRole('button', { name: 'EN' });
  await act(async () => {
    fireEvent.click(toggleButton);
  });

  const frenchOption = await screen.findByRole('option', { name: 'Français' });
  await user.click(frenchOption);

  expect(
    await screen.findByText(/Devenez l’artisan du prochain succès start-up suisse/i)
  ).toBeInTheDocument();
});

it('opens resource modal with fallback data and closes on escape', async () => {
  setupFallbackScenario();
  const user = await renderApp();

  expect(await screen.findByText(/Fallback Analyst/i)).toBeInTheDocument();

  const fallbackCopy = await screen.findByText(
    /We're showing .* from our community snapshot while live data reconnects\./i
  );
  expect(fallbackCopy).toBeInTheDocument();

  const viewDetailButtons = await screen.findAllByRole('button', { name: /View details/i });
  await user.click(viewDetailButtons[0]);

  expect(
    await screen.findByRole('heading', { name: /Median internship pay by canton/i })
  ).toBeInTheDocument();

  await user.keyboard('{Escape}');

  await waitFor(() =>
    expect(
      screen.queryByRole('heading', { name: /Median internship pay by canton/i })
    ).not.toBeInTheDocument()
  );
});

it('displays fallback notice when Supabase requests fail and allows dismissal', async () => {
  setupSupabaseErrorScenario();
  const user = await renderApp();

  expect(await screen.findByText(/Fallback Analyst/i)).toBeInTheDocument();

  const noticePattern = /We're showing .* from our community snapshot while live data reconnects\./i;

  const fallbackNotice = await screen.findByText(noticePattern);
  expect(fallbackNotice).toBeInTheDocument();
  expect(fallbackNotice.textContent).toMatch(/jobs/i);

  await user.click(screen.getByRole('button', { name: /Dismiss notice/i }));

  await waitFor(() => expect(screen.queryByText(noticePattern)).not.toBeInTheDocument());
});

it('toggles map layers and reveals city panels', async () => {
  setupSupabaseSuccess();
  const user = await renderApp();

  const navigation = await screen.findByRole('navigation');
  const mapTab = within(navigation).getByRole('button', { name: /Map/i });
  await user.click(mapTab);

  await screen.findByTestId('mock-map');
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: /Job Locations in Switzerland/i })).toBeInTheDocument()
  );

  const jobButton = await screen.findByRole('button', { name: /View jobs in Zurich/i });
  await user.click(jobButton);

  expect(await screen.findByRole('heading', { name: /Roles in Zurich/i })).toBeInTheDocument();

  await user.click(await screen.findByRole('button', { name: /Close panel/i }));

  const mapControls = await screen.findByRole('group', { name: /Show on map/i });
  const eventsToggle = within(mapControls).getByRole('button', { name: /Events/i });
  await user.click(eventsToggle);

  const eventButton = await screen.findByRole('button', { name: /View events in Zurich/i });
  await user.click(eventButton);

  expect(await screen.findByRole('heading', { name: /Events in Zurich/i })).toBeInTheDocument();
});
