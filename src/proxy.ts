import { NextRequest, NextResponse } from 'next/server';

// Función auxiliar para redirigir al home
function redirectHome(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.redirect(url);
}

// Proxy principal
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo proteger rutas /admin
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const cookie = req.cookies.get('user');
  if (!cookie) return redirectHome(req);

  try {
    const user = JSON.parse(cookie.value);

    // Validación segura del role
    const role = typeof user === 'object' && user !== null ? user.role : null;

    if (role !== 'admin') return redirectHome(req);

    // Aquí podrías validar un JWT si quieres:
    // if (!verifyJwt(user.token)) return redirectHome(req);
  } catch {
    // Cookie corrupta o JSON inválido
    return redirectHome(req);
  }

  // Usuario autorizado
  return NextResponse.next();
}

// Configuración para aplicar el middleware a /admin y subrutas
export const config = {
  matcher: '/admin/:path*',
};
