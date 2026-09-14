import { hashPassword, verifyPassword } from './staff.service';
describe('staff password storage', () => {
  it('hashes passwords with unique salts and verifies only the original', () => {
    const first = hashPassword('A-strong-password-2026');
    const second = hashPassword('A-strong-password-2026');
    expect(first).not.toBe(second);
    expect(verifyPassword('A-strong-password-2026', first)).toBe(true);
    expect(verifyPassword('wrong-password', first)).toBe(false);
  });
});
