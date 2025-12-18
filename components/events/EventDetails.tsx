'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventColors } from './EventColorContext';

interface EventDetailsProps {
  description: string;
  specifications?: Array<{ title: string; items: string[] }>;
  faqSection?: Array<{ question: string; answer: string }>;
  tags?: string[];
  categories?: string[];
}

export function EventDetails({
  description,
  specifications = [],
  faqSection = [],
  tags = [],
  categories = [],
}: EventDetailsProps) {
  const { colorPalette } = useEventColors();
  const dominantColor = colorPalette?.dominant || '#FBA905';
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionPreview = description.slice(0, 300);
  const shouldTruncate = description.length > 300;

  return (
    <div className="space-y-12">
      {/* Description */}
      {description && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
                <FileText
                    className="h-6 w-6"
                    style={{
                      color: dominantColor,
                      transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
             </div>
            <h2 className="text-3xl font-bold leading-none tracking-tight text-[#FAFDFF]">
              Acerca del Evento
            </h2>
          </div>
          
          <div className="prose prose-lg prose-invert max-w-none text-gray-300 leading-relaxed">
              {shouldTruncate ? (
                <>
                  <p className="whitespace-pre-line">
                    {isDescriptionExpanded ? description : `${descriptionPreview}...`}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-4 hover:underline flex items-center gap-2 font-medium text-sm"
                    style={{
                      color: dominantColor,
                      transition: 'color 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Ver menos <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Leer descripción completa <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <p className="whitespace-pre-line">{description}</p>
              )}
            </div>
        </section>
      )}

      {/* Specifications */}
      {specifications && specifications.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-bold mb-6 text-[#FAFDFF]">Especificaciones</h2>
          <div className="grid sm:grid-cols-2 gap-6 w-full overflow-hidden">
              {specifications
                .filter((spec: any) => {
                  return spec.title && spec.items && Array.isArray(spec.items);
                })
                .map((spec: any, index: number) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors w-full min-w-0">
                    <h4 className="font-bold text-lg mb-4 text-[#FAFDFF] flex items-center gap-2 truncate">
                        <span className="w-1.5 h-6 rounded-full bg-primary flex-shrink-0" style={{ backgroundColor: dominantColor }} />
                        <span className="truncate">{spec.title}</span>
                    </h4>
                    <ul className="space-y-3">
                      {spec.items.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start gap-2.5 text-gray-300">
                           <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0" />
                           <span className="leading-relaxed break-words min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
        </section>
      )}

      {/* FAQ */}
      {faqSection && faqSection.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold mb-6 text-[#FAFDFF]">Preguntas Frecuentes</h2>
          <div className="grid gap-4">
              {faqSection.map((faq, index) => (
                <Accordion type="single" collapsible key={index} className="bg-white/5 border border-white/10 rounded-xl px-2 overflow-hidden hover:border-white/20 transition-colors">
                    <AccordionItem value={`faq-${index}`} className="border-none">
                      <AccordionTrigger
                        className="px-4 py-4 text-left text-lg font-medium text-[#FAFDFF] hover:no-underline"
                        style={{
                          '--hover-color': dominantColor,
                        } as React.CSSProperties & { '--hover-color': string }}
                      >
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-gray-300 text-base leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                </Accordion>
              ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
           <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={`tag-${index}-${tag}`}
                  variant="outline"
                  className="px-3 py-1.5 text-sm border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-default"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
        </section>
      )}
    </div>
  );
}

