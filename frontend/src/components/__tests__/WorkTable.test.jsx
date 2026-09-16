import { render, screen } from '@testing-library/react';
import WorkTable from '../WorkTable';

describe('WorkTable', () => {
  it('renders work entries with their title, rate, and status', () => {
    const entries = [
      {
        id: 1,
        title: 'Intro animation',
        work_date: '2026-09-14',
        client: { name: 'Client Alpha' },
        category: { name: 'Motion Graphics' },
        rate: '4500',
        status: 'completed',
      },
    ];

    render(
      <WorkTable
        entries={entries}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getAllByText('Intro animation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Client Alpha').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Motion Graphics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('completed').length).toBeGreaterThan(0);
  });
});
