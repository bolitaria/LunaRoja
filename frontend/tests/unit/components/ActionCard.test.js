import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ActionCard from '@/components/ActionCard';

jest.mock('next/link', () => ({ children, href }) => <a href={href}>{children}</a>);

describe('ActionCard', () => {
  const baseAction = {
    id: 1,
    title: 'Test Action',
    description: 'Description',
    datetime: '2025-06-15T10:00:00Z',
    category: 'talk',
    locationType: 'presencial',
    placeName: 'Málaga',
  };

  test('renders title, description, date and time', () => {
    render(<ActionCard action={baseAction} />);
    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/Málaga/)).toBeInTheDocument();
  });

  test('shows "Online" badge when online', () => {
    render(<ActionCard action={{ ...baseAction, locationType: 'online' }} />);
    expect(screen.getByText(/Online/)).toBeInTheDocument();
  });

  test('shows "Grabación disponible" for past events with recording', () => {
    render(<ActionCard action={{ ...baseAction, recordingUrl: 'http://video.com' }} type="past" />);
    expect(screen.getByText(/Grabación disponible/)).toBeInTheDocument();
  });

  test('returns null if action is null', () => {
    const { container } = render(<ActionCard action={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders fallbacks for missing fields', () => {
    render(<ActionCard action={{ id: 2 }} />);
    expect(screen.getByText('Sin título')).toBeInTheDocument();
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
    expect(screen.getByText('Sin categoría')).toBeInTheDocument();
  });
});
