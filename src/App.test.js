import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the hero headline', async () => {
  render(<App />);
  expect(
    await screen.findByText(/We have reinvented how Swiss startups and talent connect/i)
  ).toBeInTheDocument();
});
