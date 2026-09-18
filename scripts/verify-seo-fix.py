#!/usr/bin/env python3
"""
Script de Verificación Rápida SEO - Post Despliegue
Verifica que las correcciones de indexación estén funcionando
"""

import requests
import sys
from typing import Dict, List

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def check_url(url: str, expected_cache: str) -> Dict:
    """Verifica una URL y retorna el estado"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        }

        response = requests.get(url, headers=headers, timeout=10)
        cache_control = response.headers.get('Cache-Control', '').lower()

        # Verificar si es cacheable públicamente
        is_public = 'public' in cache_control
        is_cacheable = 'no-cache' not in cache_control and 'no-store' not in cache_control
        has_title = '<title>' in response.text and '</title>' in response.text

        # Extraer título si existe
        title = ''
        if has_title:
            start = response.text.find('<title>') + 7
            end = response.text.find('</title>')
            title = response.text[start:end].strip() if start > 6 and end > start else ''

        passed = is_public and is_cacheable and has_title and response.status_code == 200

        return {
            'url': url,
            'status': response.status_code,
            'cache_control': cache_control,
            'is_public': is_public,
            'is_cacheable': is_cacheable,
            'has_title': has_title,
            'title': title[:80] if title else 'N/A',
            'passed': passed
        }
    except Exception as e:
        return {
            'url': url,
            'status': 'ERROR',
            'cache_control': str(e),
            'is_public': False,
            'is_cacheable': False,
            'has_title': False,
            'title': '',
            'passed': False
        }

def print_result(result: Dict, test_num: int, total: int):
    """Imprime el resultado de una prueba"""
    status_icon = f"{Colors.GREEN}✅{Colors.END}" if result['passed'] else f"{Colors.RED}❌{Colors.END}"

    print(f"\n[{test_num}/{total}] {status_icon} {result['url']}")
    print(f"    Status: {result['status']}")
    print(f"    Cache-Control: {result['cache_control'][:60]}...")
    print(f"    ├─ Public: {Colors.GREEN + '✓' + Colors.END if result['is_public'] else Colors.RED + '✗' + Colors.END}")
    print(f"    ├─ Cacheable: {Colors.GREEN + '✓' + Colors.END if result['is_cacheable'] else Colors.RED + '✗' + Colors.END}")
    print(f"    └─ Has Title: {Colors.GREEN + '✓' + Colors.END if result['has_title'] else Colors.RED + '✗' + Colors.END}")
    if result['title']:
        print(f"    Title: {result['title']}")

def main():
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}🔍 VERIFICACIÓN RÁPIDA SEO - POST DESPLIEGUE{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}\n")

    # URLs de prueba
    test_urls = [
        {
            'url': 'https://www.ravehublatam.com/djs/carl-cox',
            'expected': 'public, s-maxage=3600'
        },
        {
            'url': 'https://www.ravehublatam.com/djs/vintage-culture',
            'expected': 'public, s-maxage=3600'
        },
        {
            'url': 'https://www.ravehublatam.com/djs/artbat',
            'expected': 'public, s-maxage=3600'
        },
        {
            'url': 'https://www.ravehublatam.com/djs',
            'expected': 'public, s-maxage=3600'
        },
        {
            'url': 'https://www.ravehublatam.com/blog?category=news',
            'expected': 'public, s-maxage=1800'
        },
        {
            'url': 'https://www.ravehublatam.com/blog',
            'expected': 'public, s-maxage=1800'
        },
    ]

    results = []
    total = len(test_urls)

    print(f"📋 Ejecutando {total} pruebas...\n")

    for i, test in enumerate(test_urls, 1):
        result = check_url(test['url'], test['expected'])
        results.append(result)
        print_result(result, i, total)

    # Resumen
    passed = sum(1 for r in results if r['passed'])
    failed = total - passed

    print(f"\n{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}📊 RESUMEN{Colors.END}")
    print(f"{'='*80}")
    print(f"Total de pruebas: {total}")
    print(f"{Colors.GREEN}✅ Pasadas: {passed}{Colors.END}")
    print(f"{Colors.RED}❌ Fallidas: {failed}{Colors.END}")

    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ¡TODAS LAS PRUEBAS PASARON!{Colors.END}")
        print(f"{Colors.GREEN}Las páginas ahora son indexables por Google.{Colors.END}")
        print(f"\n{Colors.BOLD}Próximos pasos:{Colors.END}")
        print(f"1. Solicitar indexación manual en Google Search Console")
        print(f"2. Reenviar sitemap: https://www.ravehublatam.com/sitemap.xml")
        print(f"3. Monitorear indexación en 7-14 días")
        return 0
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️ ALGUNAS PRUEBAS FALLARON{Colors.END}")
        print(f"{Colors.RED}Verifica que los cambios estén desplegados en producción.{Colors.END}")
        print(f"\n{Colors.BOLD}Problemas comunes:{Colors.END}")
        print(f"- Caché de CDN no limpiado (esperar 5-10 minutos)")
        print(f"- Cambios no desplegados a producción")
        print(f"- Configuración de Vercel necesita actualización")
        return 1

if __name__ == "__main__":
    sys.exit(main())
