#!/usr/bin/env python3
"""
SEO Audit Script para Ravehub
Verifica por qué las páginas no están siendo indexadas por Google
"""

import requests
import json
from urllib.parse import urlparse, urljoin
from datetime import datetime
import time
from typing import Dict, List, Optional
import sys

class SEOAuditor:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
        }
        self.results = []

    def check_url(self, url: str) -> Dict:
        """Verifica una URL específica y retorna el análisis SEO"""
        print(f"\n🔍 Analizando: {url}")

        result = {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'status_code': None,
            'issues': [],
            'warnings': [],
            'passed': [],
            'headers': {},
            'meta_robots': None,
            'canonical': None,
            'indexable': True,
            'response_time': 0
        }

        try:
            start_time = time.time()
            response = requests.get(url, headers=self.headers, timeout=30, allow_redirects=True)
            result['response_time'] = round(time.time() - start_time, 2)
            result['status_code'] = response.status_code

            # Guardar headers importantes
            important_headers = [
                'x-robots-tag', 'cache-control', 'content-type',
                'x-frame-options', 'vary', 'x-matched-path'
            ]

            for header in important_headers:
                if header in response.headers:
                    result['headers'][header] = response.headers[header]

            # ❌ PROBLEMA 1: Status Code
            if response.status_code != 200:
                result['issues'].append(f"❌ Status HTTP {response.status_code} - La página no está accesible")
                result['indexable'] = False
                return result
            else:
                result['passed'].append("✅ Status HTTP 200 OK")

            # ❌ PROBLEMA 2: X-Robots-Tag Header
            x_robots = response.headers.get('X-Robots-Tag', '').lower()
            if 'noindex' in x_robots:
                result['issues'].append(f"❌ CRÍTICO: X-Robots-Tag header contiene 'noindex': {x_robots}")
                result['indexable'] = False
            elif x_robots:
                result['warnings'].append(f"⚠️ X-Robots-Tag presente: {x_robots}")
            else:
                result['passed'].append("✅ Sin X-Robots-Tag bloqueando")

            # ❌ PROBLEMA 3: Cache-Control
            cache_control = response.headers.get('Cache-Control', '').lower()
            if 'private' in cache_control or 'no-cache' in cache_control or 'no-store' in cache_control:
                result['issues'].append(f"❌ CRÍTICO: Cache-Control restrictivo: {cache_control}")
                result['issues'].append("   → Google puede tener problemas para cachear y rastrear la página")
                result['indexable'] = False
            else:
                result['passed'].append(f"✅ Cache-Control adecuado: {cache_control or 'no especificado'}")

            html = response.text

            # ❌ PROBLEMA 4: Meta Robots en HTML
            if '<meta name="robots"' in html.lower():
                # Búsqueda simple del meta tag
                import re
                meta_robots_match = re.search(r'<meta\s+name=["\']robots["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
                if meta_robots_match:
                    content = meta_robots_match.group(1).lower()
                    result['meta_robots'] = content
                    if 'noindex' in content:
                        result['issues'].append(f"❌ CRÍTICO: Meta robots 'noindex' en HTML: {content}")
                        result['indexable'] = False
                    else:
                        result['passed'].append(f"✅ Meta robots permite indexación: {content}")
            else:
                result['passed'].append("✅ Sin meta robots bloqueando (por defecto indexable)")

            # ❌ PROBLEMA 5: Canonical
            import re
            canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html, re.IGNORECASE)
            if canonical_match:
                canonical_url = canonical_match.group(1)
                result['canonical'] = canonical_url
                # Verificar si canonical apunta a la misma URL
                parsed_canonical = urlparse(canonical_url)
                parsed_current = urlparse(url)

                if parsed_canonical.path != parsed_current.path:
                    result['warnings'].append(f"⚠️ Canonical apunta a URL diferente: {canonical_url}")
                else:
                    result['passed'].append(f"✅ Canonical correcto: {canonical_url}")
            else:
                result['warnings'].append("⚠️ Sin tag canonical definido")

            # ❌ PROBLEMA 6: Contenido vacío o muy corto
            # Eliminar scripts y estilos para contar contenido real
            text_content = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
            text_content = re.sub(r'<style[^>]*>.*?</style>', '', text_content, flags=re.DOTALL | re.IGNORECASE)
            text_content = re.sub(r'<[^>]+>', '', text_content)
            text_content = re.sub(r'\s+', ' ', text_content).strip()

            content_length = len(text_content)
            if content_length < 100:
                result['issues'].append(f"❌ Contenido muy corto: {content_length} caracteres")
                result['issues'].append("   → Google puede considerar la página como thin content")
            elif content_length < 300:
                result['warnings'].append(f"⚠️ Contenido corto: {content_length} caracteres (mínimo recomendado: 300)")
            else:
                result['passed'].append(f"✅ Contenido adecuado: {content_length} caracteres")

            # ❌ PROBLEMA 7: Título
            title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = title_match.group(1).strip()
                if len(title) > 0:
                    result['passed'].append(f"✅ Título presente: {title[:60]}...")
                else:
                    result['issues'].append("❌ Título vacío")
            else:
                result['issues'].append("❌ Sin tag <title>")

            # ❌ PROBLEMA 8: Meta Description
            meta_desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
            if meta_desc_match:
                description = meta_desc_match.group(1).strip()
                if len(description) > 0:
                    result['passed'].append(f"✅ Meta description presente: {description[:60]}...")
                else:
                    result['warnings'].append("⚠️ Meta description vacía")
            else:
                result['warnings'].append("⚠️ Sin meta description")

            # ❌ PROBLEMA 9: Verificar si es contenido dinámico (CSR)
            if 'id="__NEXT_DATA__"' in html or 'id="__next"' in html:
                # Es una app Next.js - verificar si el contenido se renderiza en servidor
                if len(text_content) < 200 and '__NEXT_DATA__' in html:
                    result['warnings'].append("⚠️ Posible contenido renderizado solo en cliente (CSR)")
                    result['warnings'].append("   → Verificar que Next.js esté usando SSR/SSG correctamente")

        except requests.exceptions.Timeout:
            result['issues'].append("❌ Timeout al intentar acceder a la URL")
            result['indexable'] = False
        except requests.exceptions.RequestException as e:
            result['issues'].append(f"❌ Error de conexión: {str(e)}")
            result['indexable'] = False
        except Exception as e:
            result['issues'].append(f"❌ Error inesperado: {str(e)}")
            result['indexable'] = False

        return result

    def check_robots_txt(self):
        """Verifica el archivo robots.txt"""
        print("\n🤖 Verificando robots.txt...")
        robots_url = urljoin(self.base_url, '/robots.txt')

        try:
            response = requests.get(robots_url, timeout=10)
            if response.status_code == 200:
                print("✅ robots.txt encontrado")
                print("\nContenido:")
                print("-" * 50)
                print(response.text)
                print("-" * 50)

                # Verificar si hay bloqueos problemáticos
                lines = response.text.lower().split('\n')
                for line in lines:
                    if 'disallow:' in line and '/djs' in line:
                        print("⚠️ ADVERTENCIA: /djs puede estar bloqueado en robots.txt")
                    if 'disallow:' in line and '/blog' in line:
                        print("⚠️ ADVERTENCIA: /blog puede estar bloqueado en robots.txt")
            else:
                print(f"❌ robots.txt no accesible (status: {response.status_code})")
        except Exception as e:
            print(f"❌ Error al verificar robots.txt: {e}")

    def check_sitemap(self):
        """Verifica el sitemap.xml"""
        print("\n🗺️ Verificando sitemap.xml...")
        sitemap_url = urljoin(self.base_url, '/sitemap.xml')

        try:
            response = requests.get(sitemap_url, timeout=10)
            if response.status_code == 200:
                print("✅ sitemap.xml encontrado")

                # Buscar URLs de ejemplo en el sitemap
                content = response.text
                dj_urls = content.count('<loc>https://www.ravehublatam.com/djs/')
                blog_urls = content.count('<loc>https://www.ravehublatam.com/blog/')

                print(f"   📊 URLs de DJs en sitemap: {dj_urls}")
                print(f"   📊 URLs de Blog en sitemap: {blog_urls}")

                # Verificar si las URLs problemáticas están en el sitemap
                test_urls = [
                    'https://www.ravehublatam.com/djs/above-and-beyond',
                    'https://www.ravehublatam.com/blog?category=news'
                ]

                for test_url in test_urls:
                    if test_url in content:
                        print(f"   ✅ {test_url} está en el sitemap")
                    else:
                        print(f"   ❌ {test_url} NO está en el sitemap")
            else:
                print(f"❌ sitemap.xml no accesible (status: {response.status_code})")
        except Exception as e:
            print(f"❌ Error al verificar sitemap.xml: {e}")

    def print_summary(self, results: List[Dict]):
        """Imprime un resumen del análisis"""
        print("\n" + "="*80)
        print("📊 RESUMEN DE AUDITORÍA SEO")
        print("="*80)

        total = len(results)
        indexable = sum(1 for r in results if r['indexable'])
        non_indexable = total - indexable

        print(f"\n📈 Total de URLs analizadas: {total}")
        print(f"✅ Indexables: {indexable}")
        print(f"❌ No indexables: {non_indexable}")

        if non_indexable > 0:
            print(f"\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:")
            print("-" * 80)

            # Agrupar problemas comunes
            issues_count = {}
            for result in results:
                if not result['indexable']:
                    for issue in result['issues']:
                        # Extraer el tipo de problema
                        issue_type = issue.split(':')[0].strip()
                        issues_count[issue_type] = issues_count.get(issue_type, 0) + 1

            for issue_type, count in sorted(issues_count.items(), key=lambda x: x[1], reverse=True):
                print(f"   {issue_type}: {count} páginas afectadas")

        print("\n" + "="*80)

def main():
    """Función principal"""
    print("="*80)
    print("🔍 AUDITORÍA SEO - RAVEHUB")
    print("="*80)
    print("Analizando por qué las páginas no están siendo indexadas por Google")
    print("="*80)

    base_url = "https://www.ravehublatam.com"
    auditor = SEOAuditor(base_url)

    # Verificar robots.txt y sitemap primero
    auditor.check_robots_txt()
    auditor.check_sitemap()

    # Lista de URLs problemáticas reportadas por Google Search Console
    problem_urls = [
        "https://www.ravehublatam.com/blog/ultra-peru-2025",
        "https://www.ravehublatam.com/blog?category=interviews",
        "https://www.ravehublatam.com/blog?category=news",
        "https://www.ravehublatam.com/blog?category=reviews",
        "https://www.ravehublatam.com/blog?category=tutorials",
        "https://www.ravehublatam.com/blog?tag=peru",
        "https://www.ravehublatam.com/djs/above-and-beyond",
        "https://www.ravehublatam.com/djs/andrea-zapata",
        "https://www.ravehublatam.com/djs/anhedonia",
        "https://www.ravehublatam.com/djs/artbat",
        "https://www.ravehublatam.com/djs/carl-cox",
        "https://www.ravehublatam.com/djs/vintage-culture",
    ]

    print(f"\n🎯 Analizando {len(problem_urls)} URLs problemáticas...")
    print("="*80)

    results = []
    for i, url in enumerate(problem_urls, 1):
        print(f"\n[{i}/{len(problem_urls)}] ", end='')
        result = auditor.check_url(url)
        results.append(result)

        # Imprimir resultado inmediato
        print(f"\n📋 Resultado: {'✅ INDEXABLE' if result['indexable'] else '❌ NO INDEXABLE'}")
        print(f"⏱️ Tiempo de respuesta: {result['response_time']}s")

        if result['issues']:
            print("\n🚨 PROBLEMAS:")
            for issue in result['issues']:
                print(f"   {issue}")

        if result['warnings']:
            print("\n⚠️ ADVERTENCIAS:")
            for warning in result['warnings']:
                print(f"   {warning}")

        if result['passed']:
            print("\n✅ CHECKS PASADOS:")
            for check in result['passed'][:3]:  # Solo mostrar los primeros 3
                print(f"   {check}")

        # Pausa para no saturar el servidor
        if i < len(problem_urls):
            time.sleep(2)

    # Imprimir resumen
    auditor.print_summary(results)

    # Guardar resultados en JSON
    output_file = 'seo-audit-results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Resultados guardados en: {output_file}")

    # Diagnóstico final
    print("\n" + "="*80)
    print("🎯 DIAGNÓSTICO Y RECOMENDACIONES")
    print("="*80)

    non_indexable_results = [r for r in results if not r['indexable']]

    if non_indexable_results:
        # Analizar el problema más común
        cache_issues = sum(1 for r in non_indexable_results if any('Cache-Control' in issue for issue in r['issues']))

        if cache_issues > len(non_indexable_results) * 0.5:
            print("\n🚨 PROBLEMA PRINCIPAL IDENTIFICADO: Cache-Control restrictivo")
            print("\n📝 El problema está en next.config.js:")
            print("   - Las páginas de DJs y Blog tienen Cache-Control: private, no-cache, no-store")
            print("   - Esto impide que Google cachee y indexe correctamente las páginas")
            print("\n✅ SOLUCIÓN:")
            print("   1. Modificar next.config.js para permitir cache público en páginas de DJs")
            print("   2. Agregar headers para /djs/:slug* similar a /blog/:slug*")
            print("   3. Cambiar a: 'public, s-maxage=3600, stale-while-revalidate=86400'")

if __name__ == "__main__":
    main()
