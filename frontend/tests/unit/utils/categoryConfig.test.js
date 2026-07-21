import { categoryLabels, categoryStyles } from '../../../src/utils/categoryConfig';

test('returns label for known category', () => {
  expect(categoryLabels['talk']).toBe('Charla');
});

test('returns style for known category', () => {
  expect(categoryStyles['talk']).toEqual(expect.objectContaining({
    backgroundColor: expect.any(String),
    color: expect.any(String),
  }));
});

test('returns undefined for unknown category', () => {
  expect(categoryLabels['unknown']).toBeUndefined();
  expect(categoryStyles['unknown']).toBeUndefined();
});
