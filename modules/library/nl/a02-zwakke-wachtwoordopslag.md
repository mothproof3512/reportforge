## Wachtwoorden opgeslagen met een zwak of ongezouten hashalgoritme

**Severity**: High · **CVSS 3.1**: 5.9 (`CVSS:3.1/AV:N/AC:H/PR:H/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A02:2021, WSTG-CRYP-04, V2.4 · **CWE**: 916 · **Tags**: web, cryptografie, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Wachtwoorden van gebruikers worden opgeslagen als ongezouten MD5/SHA-1/SHA-256-hash, met een omkeerbare versleuteling of in platte tekst. Dit is vastgesteld op basis van inzage in de database of code, of op basis van het gedrag van de applicatie (bijvoorbeeld het terugsturen van het oorspronkelijke wachtwoord).

### Impact

Bij een datalek (via SQL-injectie, een back-up of een gecompromitteerde beheerder) zijn de wachtwoorden met gangbare hardware grotendeels binnen uren te achterhalen. Omdat gebruikers wachtwoorden hergebruiken, raakt dit ook accounts bij andere diensten. Een dergelijk lek is meldplichtig onder de AVG.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik een traag, gezouten wachtwoordhashalgoritme: Argon2id (aanbevolen), scrypt of bcrypt, met parameters afgestemd op de huidige hardware.
- Migreer bestaande hashes transparant bij de volgende inlog (of wikkel de oude hash in het nieuwe algoritme) en forceer daarna een reset voor niet-gemigreerde accounts.
- Controleer of wachtwoorden nergens in logbestanden of foutmeldingen terechtkomen.

### References

- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- CWE-916: https://cwe.mitre.org/data/definitions/916.html
