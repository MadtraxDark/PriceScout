import { authApi } from "@/utils/api/services";

function ScoutMark() {
  return <svg aria-hidden="true" className="scout-mark" viewBox="0 0 48 48" fill="none"><path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="2" /><path d="m24 17 2.2 4.8L31 24l-4.8 2.2L24 31l-2.2-4.8L17 24l4.8-2.2L24 17Z" fill="currentColor" /></svg>;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ auth?: string; next?: string }> }) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/admin";
  const signInUrl = authApi.signInUrl(nextPath);
  const googleButtonContent = <span className="gsi-material-button-content-wrapper"><span className="gsi-material-button-icon" aria-hidden="true"><svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.74 13.72 17.74 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.12 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19Z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" /></svg></span><span className="gsi-material-button-contents">Entrar com Google</span></span>;
  return <main className="login-shell">
    <section className="brand-panel" aria-label="Sobre o PriceScout">
      <a className="brand-lockup" href="#top" aria-label="PriceScout, página de autenticação"><ScoutMark /><span>Price<span>Scout</span></span></a>
      <div className="brand-copy"><p className="overline">Inteligência de compra</p><h1>Encontre o melhor preço antes de decidir.</h1><p className="brand-description">Uma memória de preços confiável para acompanhar produtos, comparar oportunidades e comprar no momento certo.</p></div>
      <div className="signal-visual" aria-hidden="true"><div className="signal-orbit orbit-one" /><div className="signal-orbit orbit-two" /><div className="signal-dot" /></div>
      <p className="brand-footer">Dados claros. Alertas úteis. Decisões melhores.</p>
    </section>
    <section className="form-panel" id="top">
      <div className="mobile-brand"><ScoutMark /><span>Price<span>Scout</span></span></div>
      <div className="form-wrap">
        <div className="form-heading"><p className="overline">Bem-vindo de volta</p><h2>Acesse sua conta</h2><p>Entre com sua conta Google para continuar no PriceScout.</p></div>
        {signInUrl
          ? <a className="auth-button gsi-material-button" href={signInUrl}>{googleButtonContent}</a>
          : <button className="auth-button gsi-material-button" type="button" disabled>{googleButtonContent}</button>}
        {!signInUrl && <p className="auth-configuration-message" role="alert"><strong>Conexão com a API não configurada.</strong><span>Defina <code>NEXT_PUBLIC_API_BASE_URL</code> em <code>.env.local</code> e reinicie o servidor de desenvolvimento. Em produção, informe a variável antes da build.</span></p>}
        <p className="auth-copy login-security-note">A autenticação é concluída pela API. Tokens, senhas e credenciais não são armazenados pelo frontend.</p>
        {params.auth === "error" && <p className="auth-message" role="status">Não foi possível concluir a autenticação. Tente novamente.</p>}
      </div>
      <footer className="form-footer"><span>PriceScout</span><span>Acesso administrativo protegido</span></footer>
    </section>
  </main>;
}
