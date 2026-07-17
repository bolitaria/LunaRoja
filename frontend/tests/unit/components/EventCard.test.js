import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import EventCard from '@/components/EventCard';

const event = {
  id: 1,
  title: 'Evento test',
  datetime: new Date().toISOString(),
};

test('muestra el título del evento', () => {
  render(<EventCard event={event} />);
  expect(screen.getByText('Evento test')).toBeInTheDocument();
});