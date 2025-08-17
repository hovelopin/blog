import Link from 'next/link';
import { getBlogPosts } from './utils';

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.'
};

export default function Page() {
  let allBlogs = getBlogPosts();

  return (
    <section>
      {/* <h1 className="mb-8 text-2xl font-semibold tracking-tighter">All Posts</h1> */}
      <div className="flex flex-col gap-4">
        {allBlogs
          .sort((a, b) => {
            if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
              return -1;
            }
            return 1;
          })
          .map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <div className="flex flex-col gap-2 rounded-[16px] p-3 hover:bg-[#F5F5F5]">
                <p className="text-[18px] font-bold">{post.metadata.title}</p>
                <p className="line-clamp-3 overflow-hidden text-[13px] text-ellipsis">
                  {post.content}
                </p>
                <p className="text-[12px] text-[#9EA4AA]">{post.metadata.publishedAt}</p>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
