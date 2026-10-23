jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

const cron = require('node-cron');
const { startReminderJob, stopReminderJob, runReminderJob } = require('../../../src/jobs/reminderJob');

describe('reminderJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopReminderJob();
  });

  test('exports the expected functions', () => {
    expect(typeof startReminderJob).toBe('function');
    expect(typeof stopReminderJob).toBe('function');
    expect(typeof runReminderJob).toBe('function');
  });

  test('startReminderJob is idempotent', () => {
    const a = startReminderJob();
    const b = startReminderJob();
    expect(a).toBe(b);
    expect(cron.schedule).toHaveBeenCalledTimes(1);
    stopReminderJob();
  });

  test('stopReminderJob is safe when not started', () => {
    expect(() => stopReminderJob()).not.toThrow();
  });

  test('startReminderJob calls cron.schedule with the right expression', () => {
    startReminderJob();
    expect(cron.schedule).toHaveBeenCalledWith('*/10 * * * *', runReminderJob);
    stopReminderJob();
  });
});
