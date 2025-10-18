import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
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

jest.mock('./SwitzerlandMap', () => {
  const React = require('react');

  const MockMap = ({
    jobs = [],
    events = [],
    onJobCityClick,
    onEventCityClick,
    visibleLayer,
  }) => {
    return (
      <div data-testid="mock-map">
        {visibleLayer === 'events'
          ? events.map((event) => (
              <button
                key={`event-${event.id}`}
                type="button"
                onClick={() => onEventCityClick(event.cityKey)}
              >
                View events in {event.cityKey}
              </button>
            ))
          : jobs.map((job) => (
              <button
                key={`job-${job.id}`}
                type="button"
                onClick={() => onJobCityClick(job.cityKey)}
              >
                View jobs in {job.cityKey}
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
  SwissStartupConnect = require('./SwissStartupConnect').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

it('switches hero copy when changing languages', async () => {
  setupSupabaseSuccess();
  const user = await renderApp();

  expect(await screen.findByText(/Shape the next Swiss startup success story/i)).toBeInTheDocument();

  const languageGroup = await screen.findByRole('group', { name: /language/i });
  const toggleButton = within(languageGroup).getByRole('button', { name: 'EN' });
  fireEvent.click(toggleButton);

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

  const mapButton = await screen.findByRole('button', { name: /View jobs in Zurich/i });
  await user.click(mapButton);

  expect(await screen.findByRole('heading', { name: /Roles in Zurich/i })).toBeInTheDocument();

  await user.click(await screen.findByRole('button', { name: /Close panel/i }));

  const mapControls = await screen.findByRole('group', { name: /Show on map/i });
  const eventsToggle = within(mapControls).getByRole('button', { name: /Events/i });
  await user.click(eventsToggle);

  const eventButton = await screen.findByRole('button', { name: /View events in Zurich/i });
  await user.click(eventButton);

  expect(await screen.findByRole('heading', { name: /Events in Zurich/i })).toBeInTheDocument();
});
