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
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#FAFDFF]">
              <FileText className="h-5 w-5" style={{ color: dominantColor }} />
              Acerca del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              {shouldTruncate ? (
                <>
                  <p className="text-white/80 leading-relaxed">
                    {isDescriptionExpanded ? description : `${descriptionPreview}...`}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-4 hover:underline flex items-center gap-1 transition-colors"
                    style={{ color: dominantColor }}
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Ver menos <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Ver más <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <p className="text-white/80 leading-relaxed">{description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specifications */}
      {specifications && specifications.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-[#FAFDFF]">Especificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {specifications.map((spec, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-2 text-[#FAFDFF]">{spec.title}</h4>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {spec.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                  {index < specifications.length - 1 && <Separator className="mt-4 bg-white/10" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      {faqSection && faqSection.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-[#FAFDFF]">Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqSection.map((faq, index) => (
                  <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="border-white/10"
                >
                  <AccordionTrigger 
                    className="text-left text-[#FAFDFF] transition-colors"
                    style={{ 
                      '--hover-color': dominantColor,
                    } as React.CSSProperties & { '--hover-color': string }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = dominantColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#FAFDFF';
                    }}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#FAFDFF]">
              <Tag className="h-5 w-5" style={{ color: dominantColor }} />
              Etiquetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={`tag-${index}-${tag}`} 
                  variant="outline"
                  className="border-white/20 text-white/90 bg-white/5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

