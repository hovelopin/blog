import { formatDate, getBlogPosts } from '@/app/blog/utils';
import Image from 'next/image';
import Link from 'next/link';

export function BlogPosts() {
  let allBlogs = getBlogPosts();

  console.log('allBlogs', allBlogs);

  return (
    <div className="tab:grid-cols-2 pc:grid-cols-3 grid grid-cols-1 gap-4">
      {allBlogs
        .sort((a, b) => {
          if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
            return -1;
          }
          return 1;
        })
        .map((post) => (
          <Link key={post.slug} className="mb-8 block" href={`/blog/${post.slug}`}>
            <div className="grid gap-4 transition-transform duration-300 hover:scale-[1.05]">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
                <Image
                  src={'/ai-illustration.png'}
                  alt={post.metadata.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg font-semibold tracking-tight text-black">
                  {post.metadata.title}
                </p>
                <p className="mt-2 text-neutral-600 tabular-nums">
                  {formatDate(post.metadata.publishedAt, false)}
                </p>
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
}
