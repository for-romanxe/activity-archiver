import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  canAccessActivity,
  cancelActivityInvite,
  deleteActivity,
  deleteAttachment,
  tagFriend,
  uploadAttachment,
} from "@/lib/actions";
import { friendsWithActivityStatus, getActivityMeta, listAttachments } from "@/lib/queries";
import { Masthead } from "@/components/masthead";
import { CategoryTag, period } from "@/components/bits";
import { InviteCopy } from "@/components/invite-copy";

export const dynamic = "force-dynamic";

function formatBytes(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-paper-line pb-4">
      <p className="label-mono mb-2">{title}</p>
      {children}
    </div>
  );
}

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const raw = await canAccessActivity(user.id, id);
  if (!raw) notFound();
  const activity = getActivityMeta(raw, user.id);
  const files = listAttachments(id);
  const taggableFriends = activity.isOwner ? friendsWithActivityStatus(user.id, id) : [];

  return (
    <>
      <Masthead user={user} active="/archive" />
      <main className="mx-auto w-full max-w-5xl px-6 py-6 flex-1">
        {/* 이슈 헤더 */}
        <div className="pb-4 border-b border-paper-line">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-semibold leading-snug">{activity.title}</h2>
            {activity.result && (
              <span className="stamp-badge !text-seal shrink-0">🏆 {activity.result}</span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-3 text-sm text-ink-soft flex-wrap">
            <CategoryTag category={activity.category} />
            {activity.org && <span>{activity.org}</span>}
            <span className="font-mono text-xs">{period(activity.startDate, activity.endDate)}</span>
            <span className="font-mono text-xs">
              <b className="text-ink font-medium">{activity.ownerName}</b> 님의 기록
            </span>
          </p>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_260px]">
          {/* 본문 컬럼 */}
          <div className="space-y-6 min-w-0">
            <div className="dossier">
              <div className="box-header">활동 내용</div>
              <div className="p-4">
                {activity.description ? (
                  <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">
                    {activity.description}
                  </p>
                ) : (
                  <p className="text-sm text-ink-soft">
                    아직 내용이 없습니다. 무엇을 했고 무엇을 배웠는지 적어두면 나중에
                    자소서 쓸 때 이 칸이 당신을 구합니다.
                  </p>
                )}
              </div>
            </div>

            <div className="dossier">
              <div className="box-header justify-between">
                <span>증빙 서류</span>
                <span className="label-mono !text-[0.6rem]">{files.length}건 보관</span>
              </div>
              {files.length === 0 ? (
                <p className="p-4 text-sm text-ink-soft">
                  수료증, 상장, 활동 사진 등을 올려두면 나중에 찾아 헤매지 않아도 됩니다.
                </p>
              ) : (
                <ul>
                  {files.map(({ attachment: f, uploaderName }) => (
                    <li key={f.id} className="box-row !py-2.5 flex items-center gap-3 text-sm">
                      <a href={`/api/files/${f.id}`} target="_blank" className="title-link truncate text-sm">
                        {f.filename}
                      </a>
                      <span className="label-mono !text-[0.6rem] shrink-0">{formatBytes(f.size)}</span>
                      <span className="text-xs text-ink-soft shrink-0 ml-auto">{uploaderName}</span>
                      {(f.uploaderId === user.id || activity.isOwner) && (
                        <form action={deleteAttachment}>
                          <input type="hidden" name="id" value={f.id} />
                          <button className="text-stamp text-xs underline">삭제</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form
                action={uploadAttachment}
                className="flex items-center gap-3 flex-wrap p-3 border-t border-paper-line bg-paper-deep rounded-b-md"
              >
                <input type="hidden" name="activityId" value={id} />
                <input type="file" name="file" required className="text-sm file:btn-ghost file:mr-3 file:text-xs" />
                <button className="btn-ink !py-1 !px-3 text-xs">보관</button>
                <span className="label-mono !text-[0.6rem]">max 20MB</span>
              </form>
            </div>
          </div>

          {/* 사이드바 */}
          <aside className="space-y-4">
            <SidebarSection title="역할">
              <p className="text-sm">{activity.role || <span className="text-ink-soft">—</span>}</p>
            </SidebarSection>

            <SidebarSection title="함께한 사람">
              {activity.companionNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activity.companionNames.map((n) => (
                    <span key={n} className="stamp-badge !text-[0.68rem] !text-ink-soft">
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">단독 기록</p>
              )}
            </SidebarSection>

            {activity.isOwner && taggableFriends.length > 0 && (
              <SidebarSection title="친구 태그">
                <ul className="space-y-2">
                  {taggableFriends.map(({ friend, status, inviteId }) => (
                    <li key={friend.id} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{friend.name}</span>
                      {status === "participant" ? (
                        <span className="label-mono !text-[0.6rem] text-seal ml-auto">참여중</span>
                      ) : status === "invited" ? (
                        <form action={cancelActivityInvite} className="ml-auto flex items-center gap-1.5">
                          <input type="hidden" name="id" value={inviteId} />
                          <span className="label-mono !text-[0.6rem]">수락 대기</span>
                          <button className="text-stamp text-xs underline">취소</button>
                        </form>
                      ) : (
                        <form action={tagFriend} className="ml-auto">
                          <input type="hidden" name="activityId" value={id} />
                          <input type="hidden" name="userId" value={friend.id} />
                          <button className="text-xs underline text-accent font-semibold">+ 태그</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </SidebarSection>
            )}

            <SidebarSection title="초대 링크">
              <InviteCopy token={activity.inviteToken} />
              <p className="text-xs text-ink-soft mt-2">
                함께한 친구에게 보내면 이 기록에 참여자로 들어옵니다.
              </p>
            </SidebarSection>

            {activity.isOwner && (
              <div className="space-y-2 pt-1">
                <Link
                  href={`/archive/${id}/edit`}
                  className="btn-ghost block w-full text-center text-xs"
                >
                  기록 수정
                </Link>
                <form action={deleteActivity}>
                  <input type="hidden" name="id" value={id} />
                  <button className="btn-ghost w-full text-xs !border-stamp !text-stamp">
                    기록 폐기
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
