import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportCard from '@/components/ReportCard';

test('muestra el título del reporte', () => {
  render(<ReportCard report={{ title: 'Reporte de prueba' }} />);
  expect(screen.getByText('Reporte de prueba')).toBeInTheDocument();
});