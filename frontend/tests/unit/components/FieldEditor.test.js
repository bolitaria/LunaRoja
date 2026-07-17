import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import FieldEditor from '@/components/FieldEditor';

test('se renderiza sin errores', () => {
  render(<FieldEditor fields={[]} onChange={() => {}} />);
});