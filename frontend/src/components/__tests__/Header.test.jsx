import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  it('renders the page title and subtitle', () => {
    render(
      <Header
        title="Payments"
        subtitle="All recorded payments"
        onMenuToggle={() => {}}
      />
    );

    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('All recorded payments')).toBeInTheDocument();
  });
});
