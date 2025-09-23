// Importa los tipos y utilidades de Next.js para API routes, módulo de sistema de archivos, 
// módulo para manejar rutas de archivos
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Función que maneja el método POST para el login
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user, password } = body;
  const filePath = path.join(process.cwd(), 'apiUsers.json');
  let users: Array<{ user: string; password: string }> = [];
  if (fs.existsSync(filePath)) {
    users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }


  const found = users.find(u => u.user === user && u.password === password);
  if (!found) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: found.user });
}
