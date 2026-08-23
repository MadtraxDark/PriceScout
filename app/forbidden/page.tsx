import Link from "next/link";

export default function ForbiddenPage() {
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Acesso restrito</p><h1>Permissão necessária.</h1><p className="auth-copy">Sua conta está autenticada, mas não possui permissão de administrador para acessar esta área.</p><Link className="outline-button auth-google-button" href="/login">Voltar</Link></section></main>;
}
