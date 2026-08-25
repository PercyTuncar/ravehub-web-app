import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 px-4">
      <ol className="flex items-center gap-2 text-sm max-w-7xl mx-auto flex-wrap">
        <li>
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Inicio
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-600" />
            {index === items.length - 1 ? (
              <span className="text-white font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
