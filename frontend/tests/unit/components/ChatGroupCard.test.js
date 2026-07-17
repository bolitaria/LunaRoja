import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatGroupCard from '@/components/ChatGroupCard';

test('muestra el nombre del grupo', () => {
  render(<ChatGroupCard group={{ name: 'Grupo de prueba' }} />);
  expect(screen.getByText('Grupo de prueba')).toBeInTheDocument();
});