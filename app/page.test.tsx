import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  it('renders the app successfully', () => {
    render(<Home />);

    // Check that the main heading is present
    const heading = screen.getByRole('heading', { name: /AI Game Engine/i });
    expect(heading).toBeInTheDocument();
  });

  it('displays the output section', () => {
    render(<Home />);

    // Check that the output section is present
    const outputHeading = screen.getByRole('heading', { name: /Output/i });
    expect(outputHeading).toBeInTheDocument();

    // Check for the placeholder text
    const placeholder = screen.getByText(/Your game responses will appear here.../i);
    expect(placeholder).toBeInTheDocument();
  });

  it('displays the input section with textarea and submit button', () => {
    render(<Home />);

    // Check that the input section is present
    const inputHeading = screen.getByRole('heading', { name: /Input/i });
    expect(inputHeading).toBeInTheDocument();

    // Check for the textarea
    const textarea = screen.getByPlaceholderText(/Enter your command/i);
    expect(textarea).toBeInTheDocument();

    // Check for the submit button
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled(); // Should be disabled when textarea is empty
  });
});
