import { cookies } from 'next/headers';

const APP_PASSWORD = process.env.APP_PASSWORD || 'ihaul2024boxdrop';

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('box-drop-auth');
  return authCookie?.value === 'authenticated';
}

export function verifyPassword(password: string): boolean {
  return password === APP_PASSWORD;
}
