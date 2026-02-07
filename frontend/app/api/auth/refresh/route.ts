import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({ id: decoded.id, email: decoded.email });

    return NextResponse.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
