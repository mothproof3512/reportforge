import { useState } from 'react';
import { api } from '../api';
import { Field, useToast } from '../ui';

export function Settings({ onLogout }: { onLogout: () => void }) {
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const toast = useToast();
  const change = async () => {
    if (pw !== pw2) return toast('Wachtwoorden komen niet overeen', true);
    try { await api.post('/api/auth/password', { current: cur, password: pw }); setCur(''); setPw(''); setPw2(''); toast('Wachtwoord gewijzigd'); } catch (e: any) { toast(e.message, true); }
  };
  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head"><div><h1>Instellingen</h1></div></div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Wachtwoord</h2>
        <Field label="Huidig wachtwoord"><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <div className="grid2"><Field label="Nieuw wachtwoord"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field><Field label="Nog een keer"><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field></div>
        <button className="btn primary" onClick={change} disabled={!cur || pw.length < 10}>Wijzigen</button>
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Sessie</h2>
        <button className="btn" onClick={async () => { await api.post('/api/auth/logout'); onLogout(); }}>Uitloggen</button>
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Waar staat wat</h2>
        <dl className="kv">
          <dt>Database</dt><dd><code>data/reportforge.sqlite</code> — opdrachten, bevindingen, bibliotheek, renderhistorie</dd>
          <dt>Afbeeldingen</dt><dd><code>data/files/&lt;opdracht-id&gt;/</code></dd>
          <dt>Renders</dt><dd><code>data/renders/&lt;opdracht-id&gt;/</code> — elke render blijft bewaard</dd>
          <dt>Opdrachtmappen</dt><dd><code>data/engagements/&lt;referentie&gt;/</code> — hetzelfde formaat als de CLI leest; exporteer met de knop op de opdracht</dd>
          <dt>Thema's</dt><dd><code>modules/themes/&lt;id&gt;/</code> — bestanden, dus ook via git te beheren</dd>
          <dt>Backup</dt><dd>Kopieer <code>data/</code> en <code>modules/themes/</code>; zie <code>deploy/backup.sh</code></dd>
        </dl>
      </div>
    </div>
  );
}
