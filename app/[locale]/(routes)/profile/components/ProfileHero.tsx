import { Users } from "@prisma/client";
import { ProfileHeroAvatar } from "./ProfileHeroAvatar";

type Props = {
  data: Users;
};

export async function ProfileHero({ data }: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-7 py-6 flex items-center gap-4 text-white">
      <ProfileHeroAvatar avatar={data.avatar} name={data.name} />
      <div>
        <div className="text-xl font-bold leading-tight">
          {data.name || "System User"}
        </div>
        <div className="text-white/80 text-sm">{data.email}</div>
        <span className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
          {data.role}
        </span>
      </div>
    </div>
  );
}
