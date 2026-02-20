export function SlackMock() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 font-mono text-sm space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-gray-400 text-xs">#pr-notifications</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600/20 flex items-center justify-center shrink-0">
            <span className="text-indigo-400 text-xs">PR</span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-300">
              <span className="text-indigo-400 font-semibold">@김철수</span>님이{" "}
              <span className="text-white">feat: 결제 모듈 리팩토링</span>을
              리뷰했습니다
            </p>
            <p className="text-gray-600 text-xs">응답 시간: 47분 · 평균보다 2배 빠름</p>
          </div>
        </div>

        <div className="border-t border-gray-800" />

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded bg-amber-600/20 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-xs">⏰</span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-300">
              <span className="text-amber-400 font-semibold">방치 PR 알림</span>{" "}
              · 3개의 PR이 48시간 이상 리뷰 대기 중
            </p>
            <p className="text-gray-600 text-xs">fix: 로그인 버그 · chore: CI 업데이트 외 1건</p>
          </div>
        </div>

        <div className="border-t border-gray-800" />

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded bg-emerald-600/20 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-xs">🔥</span>
          </div>
          <div className="space-y-1">
            <p className="text-gray-300">
              <span className="text-emerald-400 font-semibold">Hot Streak!</span>{" "}
              이영희님 5연속 1시간 내 리뷰 달성
            </p>
            <p className="text-gray-600 text-xs">현재 팀 최고 기록</p>
          </div>
        </div>
      </div>
    </div>
  );
}
