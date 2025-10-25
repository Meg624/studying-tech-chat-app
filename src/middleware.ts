import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 認証が必要なルート
const authRequiredRoutes: string[] = ['/workspace'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証チェック
  // if (authRequiredRoutes.some((route) => pathname.startsWith(route))) {
  //   // TODO: ここに実際の認証チェックロジックを実装

  //   // 例: Cookie や Session からトークンを取得してチェック
  //   const token = request.cookies.get('auth-token')?.value;

  //   // トークンがない場合、ログインページにリダイレクト
  //   if (!token) {
  //     const url = new URL('/login', request.url);
  //     url.searchParams.set('from', pathname);

  //     // ログインページにリダイレクト
  //     return NextResponse.redirect(url);
  //   }
  // }

  // 次のミドルウェア or ルーティングにリクエストを渡す
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  /*
   * - /workspace とその配下のすべてのパス
   * - /login
   * - /signup
   */
  matcher: ['/workspace/:path*', '/login', '/signup'],
};