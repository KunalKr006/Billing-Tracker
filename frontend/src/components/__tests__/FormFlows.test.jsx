import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkForm from '../WorkForm';
import PaymentForm from '../PaymentForm';

const clients = [{ id: 1, name: 'Client A' }];

describe('Form flows', () => {
  it('allows a user to create a work entry', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <WorkForm
        isOpen={true}
        onClose={() => {}}
        onSubmit={onSubmit}
        clients={clients}
        defaultClientId={1}
      />
    );

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), 'New edit');
    await user.clear(screen.getByLabelText(/rate/i));
    await user.type(screen.getByLabelText(/rate/i), '2500');
    await user.click(screen.getByRole('button', { name: /save work/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 1,
          title: 'New edit',
          rate: 2500,
        })
      );
    });
  });

  it('allows a user to create a payment', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <PaymentForm
        isOpen={true}
        onClose={() => {}}
        onSubmit={onSubmit}
        clients={clients}
      />
    );

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '1500');
    await user.clear(screen.getByLabelText(/payment date/i));
    await user.type(screen.getByLabelText(/payment date/i), '2026-09-15');
    await user.click(screen.getByRole('button', { name: /save payment/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 1,
          amount: 1500,
          payment_date: '2026-09-15',
        })
      );
    });
  });
});
