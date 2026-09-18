'use client';

import Link from 'next/link';
import { Facebook, Instagram, Youtube, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ravehub</h3>
            <p className="text-gray-400 text-sm">
              La plataforma líder de música electrónica en Latinoamérica. Descubre eventos, compra entradas y conecta con la comunidad.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/eventos" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/djs" className="text-gray-400 hover:text-white text-sm transition-colors">
                  DJs
                </Link>
              </li>
              <li>
                <Link href="/tienda" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Tienda
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terminos" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/libro-reclamaciones"
                  className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Libro de Reclamaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Síguenos</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com/ravehublatam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/ravehublatam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@ravehublatam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Ravehub. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FileText className="w-4 h-4" />
              <Link
                href="/libro-reclamaciones"
                className="hover:text-white transition-colors"
              >
                Libro de Reclamaciones Virtual
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
