import Image from "next/image";

export const dynamic = "force-dynamic";

export interface Friend {
  name: string;
  url: string;
  description: string;
  logoSrc: string;
  logoAlt: string;
  inviteUrl: string;
  inviteNote: string;
}

const friends: Friend[] = [
  {
    name: "L 站",
    url: "https://linux.do/",
    description: "Linux.do 社区",
    logoSrc: "/images/friends/linuxdo-logo.png",
    logoAlt: "LINUX DO",
    inviteUrl: "https://invite.linuxdo.org/",
    inviteNote: "国内直连，不要挂 VPN"
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
          <div
            key={friend.name}
            className="mcm-card group flex items-center gap-5 p-5"
          >
            <Image
              src={friend.logoSrc}
              alt={friend.logoAlt}
              width={120}
              height={35}
              className="h-[35px] w-[120px] shrink-0 object-contain"
              style={{ width: 120, height: 35 }}
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <a
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-lg font-black text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-strong)]"
              >
                {friend.name}
              </a>
              <p className="truncate text-sm text-[color:var(--walnut)]">
                {friend.description}
              </p>
              <a
                href={friend.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-fit max-w-full border-b-2 border-[color:var(--accent)] text-sm font-black text-[color:var(--accent-strong)] hover:border-[color:var(--line)] hover:text-[color:var(--foreground)]"
              >
                自主邀请码
              </a>
              <p className="mt-1 text-xs font-bold leading-5 text-[color:var(--walnut)]">
                {friend.inviteNote}
              </p>
            </div>
          </div>
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
