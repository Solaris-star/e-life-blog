export interface Friend {
  name: string;
  url: string;
  description: string;
}

const friends: Friend[] = [
  {
    name: "John Doe",
    url: "https://example.com",
    description: "A passionate developer building awesome things."
  },
  {
    name: "Jane Smith",
    url: "https://example.com",
    description: "UI/UX Designer and Frontend Engineer."
  }
];

export default function FriendsPage() {
  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel relative overflow-hidden p-7 md:p-10">
        <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border-[18px] border-[color:rgb(217_118_66_/_28%)] md:block" />
        <div className="space-y-4">
          <p className="section-kicker">Friends</p>
          <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
            朋友们
          </h1>
          <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
            一些有趣的人，和他们认真维护的网站。
          </p>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {friends.map((friend) => (
          <a
            key={friend.name}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mcm-card group flex items-center gap-4 p-5"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-[color:var(--mustard)] bg-[color:var(--accent)] text-lg font-black uppercase text-[color:var(--surface)] transition-transform group-hover:scale-105">
              {friend.name.slice(0, 1)}
            </span>
            <div className="overflow-hidden">
              <h2 className="truncate text-lg font-black text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-strong)]">
                {friend.name}
              </h2>
              <p className="truncate text-sm text-[color:var(--walnut)]">
                {friend.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div className="mcm-panel mt-14 p-7 md:p-8">
        <h3 className="mb-4 text-2xl font-black text-[color:var(--foreground)]">申请友链</h3>
        <p className="mb-4 max-w-2xl leading-8 text-[color:var(--walnut)]">
          欢迎互换友链。请确保你的网站有原创内容，并且可以正常访问。
        </p>
        <ul className="ml-5 list-disc space-y-2 text-sm leading-7 text-[color:var(--walnut)]">
          <li><strong>名称：</strong> 我的博客</li>
          <li><strong>地址：</strong> https://your-blog-url.com</li>
          <li><strong>头像：</strong> https://your-blog-url.com/avatar.png</li>
          <li><strong>描述：</strong> 记录技术、生活与思考的数字花园。</li>
        </ul>
      </div>
    </div>
  );
}
