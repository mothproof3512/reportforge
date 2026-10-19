## Gevoelige gegevens onversleuteld opgeslagen op het toestel

**Severity**: Medium · **CVSS 3.1**: 4.6 (`CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: MASVS-STORAGE, A02:2021 · **CWE**: 312 · **Tags**: mobile, gegevensbescherming

**Affected**:

- (vul in: host, URL of systeem)

### Description

De mobiele app slaat gevoelige gegevens (sessietokens, wachtwoorden, persoonsgegevens, documenten) in platte tekst op in de app-sandbox: in gedeelde voorkeuren, een lokale database of logbestanden. De gegevens zijn uitleesbaar op een toestel met root/jailbreak, uit een back-up, of door een andere app bij een kwetsbaarheid in het platform.

### Impact

Bij verlies of diefstal van een toestel, of bij een gecompromitteerd toestel, zijn de gegevens en de sessie van de gebruiker direct te misbruiken. Gevoelige gegevens in logbestanden kunnen bovendien bij foutrapportages bij derden terechtkomen.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Bewaar tokens en secrets in de beveiligde opslag van het platform (iOS Keychain, Android Keystore/EncryptedSharedPreferences) en gevoelige gegevens alleen versleuteld, met sleutels in de Keystore/Keychain.
- Minimaliseer wat lokaal wordt bewaard en verwijder gegevens bij uitloggen.
- Log geen gevoelige gegevens en sluit gevoelige bestanden uit van back-ups.

### References

- OWASP MASVS-STORAGE: https://mas.owasp.org/MASVS/05-MASVS-STORAGE/
- OWASP MASTG, Data Storage: https://mas.owasp.org/MASTG/
