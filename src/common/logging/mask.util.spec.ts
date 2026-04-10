import { maskSensitiveData } from './mask.util';

describe('maskSensitiveData', () => {
  it('masks sensitive keys recursively', () => {
    expect(
      maskSensitiveData({
        password: 'plain-text',
        nested: {
          access_token: 'secret-token',
          profile: {
            email: 'alice@prisma.io',
          },
        },
      }),
    ).toEqual({
      password: '[REDACTED]',
      nested: {
        access_token: '[REDACTED]',
        profile: {
          email: 'alice@prisma.io',
        },
      },
    });
  });
});
