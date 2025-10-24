import { normalizeEventTimeRange } from './calendarService';

describe('normalizeEventTimeRange', () => {
  it('returns null start and end when no start time is provided', () => {
    const { start, end } = normalizeEventTimeRange({});
    expect(start).toBeNull();
    expect(end).toBeNull();
  });

  it('uses a 90 minute fallback when end time is missing', () => {
    const startTime = '2024-06-01T09:00:00.000Z';
    const { start, end } = normalizeEventTimeRange({ startTime });

    expect(start?.toISOString()).toBe(startTime);
    expect(end?.toISOString()).toBe('2024-06-01T10:30:00.000Z');
  });

  it('corrects an end time that is before the start time', () => {
    const startTime = '2024-06-01T09:00:00.000Z';
    const endTime = '2024-06-01T08:30:00.000Z';
    const { start, end } = normalizeEventTimeRange({ startTime, endTime });

    expect(start?.toISOString()).toBe(startTime);
    expect(end?.toISOString()).toBe('2024-06-01T10:30:00.000Z');
  });

  it('honours a custom duration when supplied', () => {
    const startTime = '2024-06-01T09:00:00.000Z';
    const { start, end } = normalizeEventTimeRange({
      startTime,
      durationMinutes: 45,
    });

    expect(start?.toISOString()).toBe(startTime);
    expect(end?.toISOString()).toBe('2024-06-01T09:45:00.000Z');
  });
});
