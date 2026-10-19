## Zwak wachtwoordbeleid

**Severity**: Low · **CVSS 3.1**: 4.8 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-ATHN-07, V2 · **CWE**: 521 · **Tags**: web, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie accepteert zeer korte of veelgebruikte wachtwoorden (bijvoorbeeld "welkom01" of de naam van de organisatie) en controleert niet tegen lijsten van gelekte wachtwoorden. Eventuele complexiteitsregels (hoofdletter, cijfer) voorkomen dit niet en leiden in de praktijk tot voorspelbare patronen.

### Impact

Zwakke wachtwoorden zijn met een beperkt aantal pogingen te raden, zeker in combinatie met ontbrekende rate limiting of credential stuffing met gelekte lijsten. De kans op accountovername voor een deel van de gebruikers is reëel.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Hanteer een minimumlengte van 12 tekens (NCSC/NIST-richtlijn), zonder verplichte complexiteitsregels en zonder periodieke wijziging.
- Controleer nieuwe wachtwoorden tegen een lijst van gelekte en veelgebruikte wachtwoorden (bijvoorbeeld via de Pwned Passwords API met k-anonymity) en weiger treffers.
- Bied multi-factor authenticatie aan en maak die verplicht voor beheerders.

### References

- NIST SP 800-63B, Memorized Secrets: https://pages.nist.gov/800-63-3/sp800-63b.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
