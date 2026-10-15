import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('./services/api', () => ({ __esModule: true, default: {} }));
jest.mock('./components/Layout/Header', () => ({ __esModule: true, default: () => null }));

import App from './App';

test('renders the home page with navigation to the main sections', () => {
  render(<App />);
  expect(screen.getAllByText('משפחות').length).toBeGreaterThan(0);
  expect(screen.getAllByText('מתנדבים').length).toBeGreaterThan(0);
  expect(screen.getAllByText('נסיעות').length).toBeGreaterThan(0);
});
