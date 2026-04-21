import { format, differenceInHours, differenceInDays } from 'date-fns';
import { CategoryBadge } from './CategoryBadge';
import { slugify } from '@/lib/slugify';
import type { FeedItem } from '@/lib/types';

const SOURCE_LOGOS: Record<string, string> = {
  "Bank Info Security": '/Logo%20-%20Bank%20Info%20Security.png',
};

interface ArticleCardProps {
  item: FeedItem;
}

export function ArticleCard({ item }: ArticleCardProps) {
  const relativeDate = (() => {
    if (item.timestamp === 0) return 'Recent';
    const date = new Date(item.timestamp);
    const now = new Date();
    const hours = differenceInHours(now, date);
    const days = differenceInDays(now, date);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days === 2) return '2 days ago';
    return format(date, 'EEE yyyy-MM-dd');
  })();

  const fullDate =
    item.timestamp > 0
      ? new Date(item.timestamp).toUTCString()
      : 'Publication date not provided by feed';

  const excerpt = (() => {
    if (item.description.length <= 200) return item.description;
    const cut = item.description.lastIndexOf(' ', 200);
    return item.description.slice(0, cut > 0 ? cut : 200) + '…';
  })();

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="relative">
        <a href={item.link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
          {item.imageUrl ? (
            <div className="h-48 w-full rounded-t-lg bg-black">
              <img
                src={item.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-t-lg object-contain"
              />
            </div>
          ) : SOURCE_LOGOS[item.source] ? (
            <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-black px-4">
              <img
                src={SOURCE_LOGOS[item.source]}
                alt={item.source}
                className="max-h-32 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-black px-4">
              <span className="text-center text-lg font-semibold text-white">{item.source}</span>
            </div>
          )}
        </a>
      </div>
      {item.imageUrl && (
        <div className="border-b border-gray-100 px-5 py-2 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.source}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-2 text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-h-[44px] hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:text-blue-400"
          >
            {item.title}
          </a>
        </h2>
        <p className="mb-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {excerpt}
        </p>
        <div className="flex items-center justify-between">
          <time
            className="text-xs text-gray-500 dark:text-gray-400"
            title={fullDate}
            dateTime={item.pubDate}
          >
            {relativeDate}
          </time>
          <CategoryBadge category={item.category} href={`/category/${slugify(item.category)}`} />
        </div>
      </div>
    </article>
  );
}
