"use client";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

function ScoutMark() { return <svg aria-hidden="true" className="scout-mark" viewBox="0 0 48 48" fill="none"><path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="2" /><path d="m24 17 2.2 4.8L31 24l-4.8 2.2L24 31l-2.2-4.8L17 24l4.8-2.2L24 17Z" fill="currentColor" /></svg>; }

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setNotice("A autenticação será conectada ao Supabase nesta etapa."); }
  async function handleGoogleLogin() {
    setNotice("");
    setIsGoogleLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsGoogleLoading(false);
      setNotice("Configure as variáveis do Supabase para ativar o login com Google.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
    if (error) {
      setIsGoogleLoading(false);
      setNotice(`Não foi possível entrar com o Google: ${error.message}`);
    }
  }
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const applySession = (session: { user?: { email?: string | null } } | null) => {
      setSessionEmail(session?.user?.email ?? null);
      setIsGoogleLoading(false);
      if (session) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    };
    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => authListener.subscription.unsubscribe();
  }, []);
  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setNotice(`Não foi possível sair da conta: ${error.message}`);
  }
  return <main className="login-shell">
    <section className="brand-panel" aria-label="Sobre o PriceScout">
      <a className="brand-lockup" href="#top" aria-label="PriceScout, página inicial"><ScoutMark /><span>Price<span>Scout</span></span></a>
      <div className="brand-copy"><p className="overline">Inteligência de compra</p><h1>Encontre o melhor preço antes de decidir.</h1><p className="brand-description">Uma memória de preços confiável para acompanhar produtos, comparar oportunidades e comprar no momento certo.</p></div>
      <div className="signal-visual" aria-hidden="true"><div className="signal-orbit orbit-one" /><div className="signal-orbit orbit-two" /><div className="signal-dot" /><span className="signal-label label-top">R$ 129,90</span><span className="signal-label label-bottom">melhor momento</span></div>
      <p className="brand-footer">Dados claros. Alertas úteis. Decisões melhores.</p>
    </section>
    <section className="form-panel" id="top">
      <div className="mobile-brand"><ScoutMark /><span>Price<span>Scout</span></span></div>
      <div className="form-wrap">
        {sessionEmail ? <div className="signed-in-state"><p className="overline">Login concluído</p><h2>Você está conectado.</h2><p>Sua conta PriceScout está pronta para acompanhar preços.</p><p className="signed-in-email">{sessionEmail}</p><button className="auth-button" type="button" onClick={handleSignOut}>Sair da conta</button></div> : <>
        <div className="form-heading"><p className="overline">Bem-vindo de volta</p><h2>Acesse sua conta</h2><p>Continue acompanhando os preços que importam para você.</p></div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label><input id="email" name="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" required />
          <div className="field-row"><label htmlFor="password">Senha</label><a href="#forgot" onClick={() => setNotice("O fluxo de recuperação de senha será conectado em breve.")}>Esqueci minha senha</a></div>
          <div className="password-field"><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" autoComplete="current-password" required /><button type="button" className="icon-button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Ocultar" : "Mostrar"}</button></div>
          <button className="auth-button primary-button" type="submit">Entrar na conta</button>{notice && <p className="form-notice" role="status">{notice}</p>}
        </form>
        <div className="divider"><span>ou</span></div>
        <button className="auth-button gsi-material-button" type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
          <span className="gsi-material-button-state" aria-hidden="true" />
          <span className="gsi-material-button-content-wrapper">
            <span className="gsi-material-button-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19Z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" /></svg>
            </span>
            <span className="gsi-material-button-contents">{isGoogleLoading ? "Conectando ao Google..." : "Continuar com Google"}</span>
          </span>
        </button>
        <button className="auth-button secondary-button" type="button" onClick={() => setNotice("O acesso sem senha será conectado ao Supabase nesta etapa.")}>Entrar sem senha</button>
        <p className="create-account">Ainda não tem uma conta? <a href="#create" onClick={() => setNotice("O cadastro será disponibilizado em breve.")}>Criar conta</a></p><p className="privacy">Ao continuar, você concorda com os <a href="#terms">termos de uso</a> e a <a href="#privacy">política de privacidade</a> do PriceScout.</p>
        </>}
      </div><footer className="form-footer"><a href="#help">Precisa de ajuda?</a><span>PriceScout © 2026</span></footer>
    </section>
  </main>;
}
