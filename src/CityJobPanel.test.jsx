import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityJobPanel from './CityJobPanel';

const defaultTranslate = (key, fallback) => fallback;

const renderPanel = (overrideProps = {}) => {
  const onClose = jest.fn();
  const onJobClick = jest.fn();

  const props = {
    selectedCity: 'Zurich',
    selectedCityLabel: 'Zürich',
    cityJobs: [],
    onClose,
    onJobClick,
    translate: defaultTranslate,
    ...overrideProps,
  };

  const result = render(<CityJobPanel {...props} />);
  return { ...result, onClose, onJobClick };
};

describe('CityJobPanel', () => {
  it('returns null when no city or jobs provided', () => {
    const { container: emptyCity } = renderPanel({ selectedCity: null });
    expect(emptyCity.firstChild).toBeNull();

    const { container: emptyJobs } = renderPanel({ cityJobs: [] });
    expect(emptyJobs.firstChild).toBeNull();
  });

  it('prefers the formatted salary string when provided', async () => {
    const job = {
      id: 'job-1',
      title: 'Software Engineer',
      company_name: 'Alpine Tech',
      location: 'Zurich',
      created_at: '2024-09-01',
      salary: 'CHF 100k – 120k per year',
    };

    const user = userEvent.setup();
    const { onJobClick } = renderPanel({ cityJobs: [job] });

    expect(screen.getByText('CHF 100k – 120k per year')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view role details/i }));
    expect(onJobClick).toHaveBeenCalledWith(job);
  });

  it('falls back to numeric salary values when formatted text is absent', () => {
    const job = {
      id: 'job-2',
      title: 'Product Manager',
      company_name: 'Lake Labs',
      location: 'Zurich',
      created_at: '2024-08-15',
      salary_min_value: 90000,
      salary_max_value: 110000,
    };

    renderPanel({ cityJobs: [job] });

    const salaryElement = screen.getByText(/CHF/, { selector: '.ssc__map-job-salary' });
    expect(salaryElement).toHaveTextContent('CHF');
    expect(salaryElement).toHaveTextContent('90,000');
    expect(salaryElement).toHaveTextContent('110,000');
  });
});

