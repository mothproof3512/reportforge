import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, type Meta } from './api';
import { ToastProvider, useHash, go, useToast } from './ui';
import { Engagements } from './pages/engagements';
import { EngagementPage } from './pages/engagement';
import { Clients } from './pages/clients';
import { ThemePage } from './pages/theme';
import { Library } from './pages/library';
import { Settings } from './pages/settings';

function Login({ configured, onDone }: { configured: boolean; onDone: () => void }) {
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      if (!configured) { if (pw !== pw2) return setErr('Wachtwoorden komen niet overeen'); await api.post('/api/auth/setup', { password: pw }); }
      else await api.post('/api/auth/login', { password: pw });
      onDone();
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="login">
      <div className="brand"><Logo /> Report<span>forge</span></div>
      <form className="panel" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>{configured ? 'Inloggen' : 'Welkom — kies een wachtwoord'}</h2>
        {!configured && <p className="muted">Dit is een eenmalige stap. Het wachtwoord beschermt de app binnen je netwerk; minimaal 10 tekens.</p>}
        <label className="field"><span>Wachtwoord</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></label>
        {!configured && <label className="field"><span>Nog een keer</span><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>}
        {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}
        <button className="btn primary" type="submit">{configured ? 'Inloggen' : 'Wachtwoord instellen'}</button>
      </form>
    </div>
  );
}

export const Logo = () => <svg width="22" height="22" viewBox="0 0 72 72"><path d="M36 6 L62 18 V40 C62 54 50 62 36 68 C22 62 10 54 10 40 V18 Z" fill="none" stroke="currentColor" strokeWidth="6" /><path d="M28 36 L34 42 L46 28" fill="none" stroke="#7FC4D1" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

function App() {
  const [auth, setAuth] = useState<{ configured: boolean; authenticated: boolean } | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const hash = useHash();
  const toast = useToast();
  const refresh = () => api.get('/api/auth/status').then(setAuth);
  useEffect(() => { refresh(); const f = () => setAuth((a) => (a ? { ...a, authenticated: false } : a)); addEventListener('rf:unauthenticated', f); return () => removeEventListener('rf:unauthenticated', f); }, []);
  useEffect(() => { if (auth?.authenticated) api.get<Meta>('/api/meta').then(setMeta).catch((e) => toast(e.message, true)); }, [auth?.authenticated]);
  if (!auth) return null;
  if (!auth.authenticated) return <Login configured={auth.configured} onDone={refresh} />;
  if (!meta) return null;

  const [, section, idStr, sub] = hash.split('/');
  const nav = (path: string, label: string) => <a href={'#' + path} className={section === path.slice(1).split('/')[0] ? 'active' : ''}>{label}</a>;
  let page: React.ReactNode;
  if (section === 'engagements' && idStr) page = <EngagementPage id={Number(idStr)} tab={sub || 'overview'} meta={meta} />;
  else if (section === 'clients') page = <Clients meta={meta} />;
  else if (section === 'themes' && idStr) page = <ThemePage slug={idStr} meta={meta} onChanged={() => api.get<Meta>('/api/meta').then(setMeta)} />;
  else if (section === 'library') page = <Library />;
  else if (section === 'settings') page = <Settings onLogout={refresh} />;
  else page = <Engagements meta={meta} />;
  const workbench = section === 'engagements' && idStr && sub === 'findings';

  return (
    <div className="shell">
      <nav className="rail">
        <div className="brand"><Logo /> Report<span>forge</span></div>
        {nav('/engagements', 'Opdrachten')}
        {nav('/clients', 'Opdrachtgevers')}
        {nav('/library', 'Bibliotheek')}
        {nav('/settings', 'Instellingen')}
        <div className="spacer" />
        <div className="meta">Reportforge v{meta.version}<br />{meta.typst ? meta.typst : 'typst niet gevonden'}<br />{meta.blocks.length} blokken · {meta.standards.length} standaarden</div>
      </nav>
      <main className="main" style={workbench ? { overflow: 'hidden' } : undefined}>{page}</main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ToastProvider><App /></ToastProvider>);
if (!location.hash) go('/engagements');
