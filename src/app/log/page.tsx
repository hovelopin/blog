import { getLogPosts } from '../blog/utils';

export default function LogPage() {
  let allLogs = getLogPosts();

  return (
    <section>
      {/* <h1 className="mb-8 text-2xl font-semibold tracking-tighter">Diary</h1> */}
      <div>
        {allLogs
          .sort((a, b) => {
            if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
              return -1;
            }
            return 1;
          })
          .map((log) => (
            <div key={log.slug}>
              <p>{log.metadata.title}</p>
            </div>
          ))}
      </div>
    </section>
  );
}
