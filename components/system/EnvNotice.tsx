export function EnvNotice() {
  return (
    <div className="rounded-lg border border-line bg-white px-5 py-4">
      <p className="text-sm font-semibold text-foreground">
        로그인 서비스 준비 중입니다
      </p>
      <p className="mt-1.5 text-sm leading-6 text-muted">
        서비스 연결 설정이 아직 완료되지 않아 지금은 로그인·회원가입을 진행할 수
        없습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <p className="mt-3 text-xs leading-5 text-muted">
        관리자 안내: Supabase 환경변수{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 설정한
        뒤 재배포하면 이 안내가 사라집니다.
      </p>
    </div>
  );
}
