import { signInSchema } from './zod';

describe('signInSchema', () => {
  it('validates a correct username and password', () => {
    const validData = { username: 'user1', password: 'password123' };
    expect(() => signInSchema.parse(validData)).not.toThrow();
  });

  it('fails if username is missing', () => {
    const invalidData = { password: 'password123' };
    const result = signInSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Username is required");
  });

  it('fails if password is too short or missing', () => {
    const invalidData = { username: 'user1', password: '' };
    const result = signInSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Password is required");
  });

  it('fails if password is too long', () => {
    const invalidData = { username: 'user1', password: 'a'.repeat(33) };
    const result = signInSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Password must be less than 32 characters");
  });
});
