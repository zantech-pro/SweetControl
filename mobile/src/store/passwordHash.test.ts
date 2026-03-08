import { makeOfflinePasswordHash } from './passwordHash';

describe('passwordHash', () => {
  it('should generate deterministic hash for same password', () => {
    const first = makeOfflinePasswordHash('Senha@123');
    const second = makeOfflinePasswordHash('Senha@123');
    expect(first).toBe(second);
  });

  it('should generate different hashes for different passwords', () => {
    const first = makeOfflinePasswordHash('Senha@123');
    const second = makeOfflinePasswordHash('OutraSenha@123');
    expect(first).not.toBe(second);
  });
});

