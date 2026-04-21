import { useState, useMemo } from 'react';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArticleCard } from '@/components/ArticleCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FeedErrorNotice } from '@/components/FeedErrorNotice';
import { Layout } from '@/components/Layout';
import { filterBySearch } from '@/lib/search';
import { useFeedData } from '@/hooks/useFeedData';
import { getFeeds } from '@/lib/feeds';
import { fetchAllFeeds } from '@/lib/rss';
import type { FeedApiResponse } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const { items, failed, loading, categories, sources } = useFeedData();
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSource = typeof router.query.source === 'string' ? router.query.source : null;

  const displayedItems = useMemo(() => {
    const sourceFiltered = selectedSource ? items.filter((item) => item.source === selectedSource) : items;
    return filterBySearch(sourceFiltered, searchQuery);
  }, [items, searchQuery, selectedSource]);

  return (
    <>
      <Head>
        <title>AI &amp; Cybersecurity Daily</title>
        <meta name="description" content="Daily AI and cybersecurity news and research, aggregated from leading security vendors, researchers, and journalists." />
        <meta property="og:title" content="AI &amp; Cybersecurity Daily" />
        <meta property="og:description" content="Daily AI and cybersecurity news and research, aggregated from leading security vendors, researchers, and journalists." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://rss-reader-ismg.vercel.app/ai-cybersecurity-daily-og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://rss-reader-ismg.vercel.app/ai-cybersecurity-daily-og.png" />
      </Head>

      <Layout
        categories={categories}
        sources={sources}
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
            {selectedSource
              ? `No articles from "${selectedSource}".`
              : searchQuery
                ? 'No results found.'
                : 'No feed items available.'}
          </p>
        )}
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<{ initialFeedData: FeedApiResponse }> = async () => {
  const configs = getFeeds();
  const data = await fetchAllFeeds(configs);
  return {
    props: { initialFeedData: data },
    revalidate: 300,
  };
};
