export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: PasswordStrengthScore;
  label: string;
  hint: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: '', hint: '' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) score += 1;

  const clamped = Math.min(score, 4) as PasswordStrengthScore;

  const labels: Record<PasswordStrengthScore, { label: string; hint: string }> = {
    0: { label: 'Lemah', hint: 'Minimal 8 karakter' },
    1: { label: 'Lemah', hint: 'Tambahkan angka atau simbol biar lebih kuat' },
    2: { label: 'Sedang', hint: 'Tambahkan huruf besar atau simbol biar lebih kuat' },
    3: { label: 'Kuat', hint: 'Tambahkan angka biar lebih kuat' },
    4: { label: 'Sangat kuat', hint: 'Password kamu sudah kuat' },
  };

  return { score: clamped, ...labels[clamped] };
}
