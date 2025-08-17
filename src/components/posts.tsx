import { formatDate, getBlogPosts } from '@/app/blog/utils';
import Image from 'next/image';
import Link from 'next/link';

export function BlogPosts() {
  let allBlogs = getBlogPosts();

  return (
    <div className="tab:grid-cols-2 pc:grid-cols-3 grid grid-cols-1 gap-4">
      {allBlogs
        .slice(0, 9)
        .sort((a, b) => {
          if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
            return -1;
          }
          return 1;
        })
        .map((post) => (
          <Link key={post.slug} className="mb-8 block" href={`/blog/${post.slug}`}>
            <div className="grid gap-4 transition-transform duration-300 hover:scale-[1.05]">
              <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg hover:bg-[rgba(0,0,0,0.48)]">
                <Image
                  src={'/ai-illustration.png'}
                  alt={post.metadata.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-opacity duration-300 group-hover:opacity-50"
                />
                <div className="absolute top-3 left-3 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-[16px] border-2 p-2 text-[12px] font-bold text-white">
                    생산성
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg font-semibold tracking-tight text-black">
                  {post.metadata.title}
                </p>
                <p className="mt-2 text-neutral-600 tabular-nums">{post.metadata.publishedAt}</p>
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
}
