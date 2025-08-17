import { BlogPosts } from '@/components/posts';
import Image from 'next/image';

export default function Page() {
  return (
    <section>
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="h-30 w-30 rounded-[50%]">
          <Image
            src={'/avatar.png'}
            width={110}
            height={110}
            alt="avatar"
            className="mx-auto rounded-[50%]"
          />
        </div>
        <p className="font-semibold tracking-tighter">Harvey</p>
      </div>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  );
}
