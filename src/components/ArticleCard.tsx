import { format, differenceInHours, differenceInDays } from 'date-fns';
import { CategoryBadge } from './CategoryBadge';
import { slugify } from '@/lib/slugify';
import type { FeedItem } from '@/lib/types';

const SOURCE_LOGOS: Record<string, string> = {
  "Bank Info Security": '/Logo%20-%20Bank%20Info%20Security.png',
  "The Register Security": '/Logo%20-%20The%20Register%20Security.png',
  "Bleeping Computer": '/Logo%20-%20Bleeping%20Computer.png',
  "CISA Advisories": '/Logo%20-%20CISA%20Advisories.png',
};

interface ArticleCardProps {
  item: FeedItem;
}

function formatDisplayDate(timestamp: number): string {
  if (timestamp === 0) return 'Recent';
  const date = new Date(timestamp);
  const now = new Date();
  const hours = differenceInHours(now, date);
  const days = differenceInDays(now, date);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days === 2) return '2 days ago';
  return format(date, 'EEE yyyy-MM-dd');
}

export function ArticleCard({ item }: ArticleCardProps) {
  const displayDate = formatDisplayDate(item.timestamp);
  const fullDate =
    item.timestamp > 0
      ? new Date(item.timestamp).toUTCString()
      : 'Publication date not provided by feed';

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md sm:flex-row sm:h-[220px] dark:border-gray-700 dark:bg-gray-800">
      {/* Image panel — full-width banner on mobile, 1/3 sidebar on desktop */}
      <div className="h-40 w-full shrink-0 bg-black sm:h-full sm:w-1/3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover sm:object-contain"
          />
        ) : SOURCE_LOGOS[item.source] ? (
          <div className="flex h-full w-full items-center justify-center bg-black px-4">
            <img
              src={SOURCE_LOGOS[item.source]}
              alt={item.source}
              className="max-h-32 max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black px-4">
            <span className="text-center text-lg font-semibold text-white">{item.source}</span>
          </div>
        )}
      </div>

      {/* Right content panel */}
      <div className="flex flex-1 flex-col overflow-hidden p-5">
        <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">{item.source}</p>
        <h2 className="mb-2 line-clamp-2 text-lg sm:text-2xl font-bold leading-snug text-gray-900 dark:text-gray-100">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:text-blue-400"
          >
            {item.title}
          </a>
        </h2>
        <p className="mb-4 line-clamp-2 sm:line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <time
            className="text-xs text-gray-500 dark:text-gray-400"
            title={fullDate}
            dateTime={item.pubDate}
          >
            {displayDate}
          </time>
          <span className="relative z-10">
            <CategoryBadge category={item.category} href={`/category/${slugify(item.category)}`} />
          </span>
        </div>
      </div>
    </article>
  );
}
