import { useState, useMemo } from 'react';
import Head from 'next/head';
import { ArticleCard } from '@/components/ArticleCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FeedErrorNotice } from '@/components/FeedErrorNotice';
import { Layout } from '@/components/Layout';
import { filterBySearch } from '@/lib/search';
import { useFeedData } from '@/hooks/useFeedData';

export default function Home() {
  const { items, failed, loading, categories } = useFeedData();
  const [searchQuery, setSearchQuery] = useState('');

  const displayedItems = useMemo(() => filterBySearch(items, searchQuery), [items, searchQuery]);

  return (
    <>
      <Head>
        <title>AI &amp; Cybersecurity Daily</title>
        <meta name="description" content="Daily AI and cybersecurity news and research, aggregated from leading security vendors, researchers, and journalists." />
        <meta property="og:title" content="AI &amp; Cybersecurity Daily" />
        <meta property="og:description" content="Daily AI and cybersecurity news and research, aggregated from leading security vendors, researchers, and journalists." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://rss-reader-ismg.vercel.app/ISMG%20Feed%20Reader%20-%2001.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://rss-reader-ismg.vercel.app/ISMG%20Feed%20Reader%20-%2001.png" />
      </Head>

      <Layout
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResultCount={displayedItems.length}
      >
        <FeedErrorNotice failed={failed} />

        <div role="status" aria-live="polite" className="sr-only">
          {loading ? 'Loading feed items...' : `${displayedItems.length} feed items loaded.`}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayedItems.length > 0 ? (
          <div className="flex flex-col gap-4">
            {displayedItems.map((item) => (
              <ArticleCard key={item.guid} item={item} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No results found.' : 'No feed items available.'}
          </p>
        )}
      </Layout>
    </>
  );
}
