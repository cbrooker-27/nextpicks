import { saltAndHashPassword, verifyPassword } from './password';

describe('password utils', () => {
  it('salts and hashes a password, and can verify it', async () => {
    const rawPassword = 'mySuperSecretPassword123';
    
    // Hash the password
    const hashedPassword = await saltAndHashPassword(rawPassword);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(rawPassword);

    // Verify correct password
    const isValid = await verifyPassword(rawPassword, hashedPassword);
    expect(isValid).toBe(true);

    // Verify incorrect password
    const isInvalid = await verifyPassword('wrongPassword', hashedPassword);
    expect(isInvalid).toBe(false);
  });
});
