import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the hero headline', async () => {
  render(<App />);
  expect(await screen.findByText(/Shape the next Swiss startup success story/i)).toBeInTheDocument();
});
