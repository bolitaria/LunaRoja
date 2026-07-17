import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import CampaignPreview from '@/components/CampaignPreview';

test('muestra el nombre de la campaña', () => {
  render(<CampaignPreview name="Campaña 1" description="Desc" />);
  expect(screen.getByText('Campaña 1')).toBeInTheDocument();
});