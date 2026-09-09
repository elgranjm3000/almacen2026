import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const tieneSesion = req.cookies.has('almacen_sesion')
  if (!tieneSesion && req.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (tieneSesion && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|icon.svg|.*\\.[\\w]+$).*)'],
}
