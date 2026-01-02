'use client';

import { useState, useRef, useEffect } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { Event, BlogPost } from '@/lib/types';
import { EventCard } from './EventCard';
import { NewsCard } from './NewsCard';
import { fetchMoreEvents, fetchMoreNews } from '../actions';
import { useInView } from 'react-intersection-observer';

interface ContentFeedProps {
    initialEvents: Event[];
    initialNews: BlogPost[];
}

export function ContentFeed({ initialEvents, initialNews }: ContentFeedProps) {
    const [activeTab, setActiveTab] = useState<'events' | 'news'>('events');

    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [news, setNews] = useState<BlogPost[]>(initialNews);

    const [isLoading, setIsLoading] = useState(false);
    const [eventsOffset, setEventsOffset] = useState(initialEvents.length);
    const [newsOffset, setNewsOffset] = useState(initialNews.length);
    const [hasMoreEvents, setHasMoreEvents] = useState(true);
    const [hasMoreNews, setHasMoreNews] = useState(true);

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '200px',
    });

    useEffect(() => {
        if (inView && !isLoading) {
            if (activeTab === 'events' && hasMoreEvents) {
                loadMoreEvents();
            } else if (activeTab === 'news' && hasMoreNews) {
                loadMoreNews();
            }
        }
    }, [inView, activeTab]);

    const loadMoreEvents = async () => {
        setIsLoading(true);
        const newEvents = await fetchMoreEvents(eventsOffset);
        if (newEvents.length === 0) {
            setHasMoreEvents(false);
        } else {
            setEvents([...events, ...newEvents]);
            setEventsOffset(prev => prev + newEvents.length);
        }
        setIsLoading(false);
    };

    const loadMoreNews = async () => {
        setIsLoading(true);
        const newPosts = await fetchMoreNews(newsOffset);
        if (newPosts.length === 0) {
            setHasMoreNews(false);
        } else {
            setNews([...news, ...newPosts]);
            setNewsOffset(prev => prev + newPosts.length);
        }
        setIsLoading(false);
    };

    return (
        <div className="w-full max-w-md mx-auto pb-32">
            {/* Sticky Segmented Control */}
            <div className="sticky top-4 z-40 px-4 mb-6">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl flex relative">
                    {['events', 'news'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 relative py-3 text-sm font-bold z-10 transition-colors uppercase tracking-wide ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-xl shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {tab === 'events' ? 'Eventos 🎟️' : 'Noticias 📰'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4 min-h-[50vh]">
                {activeTab === 'events' ? (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {news.map((post, idx) => (
                            <NewsCard key={post.id} post={post} index={idx} />
                        ))}
                    </motion.div>
                )}

                {/* Loading Spinner */}
                <div ref={ref} className="py-8 flex justify-center w-full">
                    {(isLoading || (activeTab === 'events' && hasMoreEvents) || (activeTab === 'news' && hasMoreNews)) && (
                        <div className="w-8 h-8 border-2 border-white/20 border-t-[#FBA905] rounded-full animate-spin" />
                    )}
                    {activeTab === 'events' && !hasMoreEvents && events.length > 0 && (
                        <p className="text-gray-500 text-xs text-center w-full">No hay más eventos por ahora.</p>
                    )}
                    {activeTab === 'news' && !hasMoreNews && news.length > 0 && (
                        <p className="text-gray-500 text-xs text-center w-full">Has llegado al final.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
