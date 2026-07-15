import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  listActivityInvites,
  listFriends,
  listReceivedRequests,
  listSentRequests,
} from "@/lib/queries";
import {
  acceptFriendRequest,
  removeFriendship,
  respondActivityInvite,
} from "@/lib/actions";
import { Masthead } from "@/components/masthead";
import { FriendSearch } from "@/components/friend-search";
import { CategoryTag, period } from "@/components/bits";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await requireUser();
  const invites = listActivityInvites(user.id);
  const received = listReceivedRequests(user.id);
  const sent = listSentRequests(user.id);
  const friends = listFriends(user.id);

  return (
    <>
      <Masthead user={user} active="/friends" />
      <main className="mx-auto w-full max-w-5xl px-6 py-8 flex-1 space-y-8">
        {/* 받은 활동 초대 */}
        {invites.length > 0 && (
          <div className="dossier !border-stamp/60">
            <div className="box-header text-stamp">
              받은 활동 초대
              <span className="stamp-badge !text-[0.65rem] ml-1">{invites.length}</span>
            </div>
            <ul>
              {invites.map(({ invite, activity, inviterName }) => (
                <li key={invite.id} className="box-row flex items-center gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <b>{inviterName}</b>님이 활동에 태그했습니다
                    </p>
                    <p className="mt-1 flex items-center gap-2 flex-wrap">
                      <CategoryTag category={activity.category} />
                      <span className="font-bold">{activity.title}</span>
                      <span className="font-mono text-xs text-ink-soft">
                        {period(activity.startDate, activity.endDate)}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={respondActivityInvite}>
                      <input type="hidden" name="id" value={invite.id} />
                      <input type="hidden" name="response" value="accept" />
                      <button className="btn-ink !py-1.5 !px-3 text-xs">수락 — 내 서고에도 추가</button>
                    </form>
                    <form action={respondActivityInvite}>
                      <input type="hidden" name="id" value={invite.id} />
                      <input type="hidden" name="response" value="decline" />
                      <button className="btn-ghost !py-1.5 !px-3 text-xs">거절</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 받은 친구 요청 */}
        {received.length > 0 && (
          <div className="dossier">
            <div className="box-header text-stamp">
              받은 친구 요청
              <span className="stamp-badge !text-[0.65rem] ml-1">{received.length}</span>
            </div>
            <ul>
              {received.map((r) => (
                <li key={r.id} className="box-row flex items-center gap-3 flex-wrap">
                  <span className="font-bold">{r.requester.name}</span>
                  <span className="font-mono text-xs text-ink-soft">{r.requester.email}</span>
                  <div className="flex gap-2 ml-auto">
                    <form action={acceptFriendRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn-ink !py-1.5 !px-3 text-xs">수락</button>
                    </form>
                    <form action={removeFriendship}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn-ghost !py-1.5 !px-3 text-xs">거절</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <FriendSearch />

        {/* 친구 목록 */}
        <div className="dossier">
          <div className="box-header justify-between">
            <span>동료 명부</span>
            <span className="label-mono !text-[0.6rem]">{friends.length}명</span>
          </div>
          {friends.length === 0 ? (
            <p className="p-4 text-sm text-ink-soft">
              아직 등록된 동료가 없습니다. 위에서 이메일로 친구 요청을 보내보세요.
              친구가 되면 활동에 바로 태그할 수 있습니다.
            </p>
          ) : (
            <ul>
              {friends.map(({ friendshipId, friend }) => (
                <li key={friendshipId} className="box-row !py-2.5 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-paper-line grid place-items-center text-[0.65rem] font-bold select-none shrink-0">
                    {friend.name[0]}
                  </span>
                  <span className="font-semibold">{friend.name}</span>
                  <span className="font-mono text-xs text-ink-soft">{friend.email}</span>
                  <form action={removeFriendship} className="ml-auto">
                    <input type="hidden" name="id" value={friendshipId} />
                    <button className="text-stamp text-xs underline">삭제</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sent.length > 0 && (
          <div className="dossier">
            <div className="box-header">보낸 요청 (수락 대기중)</div>
            <ul>
              {sent.map((s) => (
                <li key={s.id} className="box-row !py-2.5 flex items-center gap-3 text-sm">
                  <span>{s.addressee.name}</span>
                  <span className="font-mono text-xs text-ink-soft">{s.addressee.email}</span>
                  <form action={removeFriendship} className="ml-auto">
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-stamp text-xs underline">요청 취소</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-ink-soft">
          친구를 활동에 태그하려면 <Link href="/archive" className="underline">서고</Link>에서
          활동 상세로 들어가 "친구 태그"를 사용하세요. 태그받은 친구가 수락하면 그 활동이
          친구의 서고에도 나타납니다.
        </p>
      </main>
    </>
  );
}
