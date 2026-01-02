import { Metadata } from 'next';
import { getUpcomingEvents, getBlogPosts } from '@/lib/data-fetching';
import { LinkInBioClient } from './_components/LinkInBioClient';

// Force dynamic since we might use headers/IP later, and for fresh content
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute if static

export const metadata: Metadata = {
    title: 'Link in Bio',
    description: 'Comunidad #1 de Música Electrónica en Latinoamérica. Eventos, Noticias y Tickets.',
    openGraph: {
        title: 'Ravehub',
        description: 'Únete a la comunidad más grande de música electrónica.',
        images: ['/og-image.jpg'], // Make sure this exists or use a default
    },
};

export default async function BioLinkPage() {
    // 1. Fetch Initial Data (Parallel)
    // We use getUpcomingEvents logic, but we might want to filter by country eventually.
    // For now getting global upcoming events.
    const eventsData = getUpcomingEvents(10);

    // Blog posts
    const newsData = getBlogPosts({ limit: 10, status: 'published' });

    const [eventsRaw, { posts: news }] = await Promise.all([eventsData, newsData]);

    // Shuffle events for random display order on each visit
    const events = [...eventsRaw].sort(() => Math.random() - 0.5);

    // 2. Generate Organization/Profile Schema with CollectionPage
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
            "@type": "Organization",
            "name": "Ravehub Latam",
            "url": "https://ravehublatam.com/go",
            "sameAs": [
                "https://instagram.com/ravehub.latam",
                "https://tiktok.com/@ravehub.latam"
            ]
        },
        "hasPart": {
            "@type": "CollectionPage",
            "hasPart": [
                {
                    "@type": "ItemList",
                    "name": "Upcoming Events",
                    "itemListElement": events.map((event, index) => ({
                        "@type": "Event",
                        "position": index + 1,
                        "name": event.name,
                        "startDate": event.startDate,
                        "url": `https://ravehublatam.com/eventos/${event.slug}/comprar`,
                        "image": event.mainImageUrl,
                        "location": {
                            "@type": "Place",
                            "name": event.location.venue,
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": event.location.city,
                                "addressCountry": event.location.countryCode
                            }
                        },
                        "offers": {
                            "@type": "Offer",
                            "url": `https://ravehublatam.com/eventos/${event.slug}/comprar`,
                            "availability": "https://schema.org/InStock"
                        }
                    }))
                },
                {
                    "@type": "ItemList",
                    "name": "Latest News",
                    "itemListElement": news.map((post, index) => ({
                        "@type": "NewsArticle",
                        "position": index + 1,
                        "headline": post.title,
                        "url": `https://ravehublatam.com/blog/${post.slug}`,
                        "image": post.featuredImageUrl,
                        "datePublished": post.publishDate
                    }))
                }
            ]
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LinkInBioClient initialEvents={events} initialNews={news} />
        </>
    );
}
