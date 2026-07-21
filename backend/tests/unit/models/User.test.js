const User = require('../../../src/models/User');

describe('User Model', () => {
  test('should have correct table name', () => {
    expect(User.getTableName()).toBe('Users');
  });

  test('should have required fields', () => {
    const attrs = User.rawAttributes;
    expect(attrs).toHaveProperty('username');
    expect(attrs).toHaveProperty('email');
    expect(attrs).toHaveProperty('password');
    expect(attrs).toHaveProperty('role');
    expect(attrs.role.defaultValue).toBe('action_admin');
  });
});
