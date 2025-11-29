import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  it('renders the scenario selector successfully', () => {
    render(<Home />);

    // Check that the main heading is present
    const heading = screen.getByRole('heading', { name: /AI Game Engine/i });
    expect(heading).toBeInTheDocument();
  });

  it('displays the scenario selection prompt', () => {
    render(<Home />);

    // Check for the subtitle text
    const subtitle = screen.getByText(/Choose a scenario to begin your adventure/i);
    expect(subtitle).toBeInTheDocument();
  });
});
