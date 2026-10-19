## Clickjacking (pagina's kunnen in een frame worden geladen)

**Severity**: Low · **CVSS 3.1**: 4.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CLNT-09, V14 · **CWE**: 1021 · **Tags**: web, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Pagina's van de applicatie kunnen door een willekeurige andere site in een `<iframe>` worden geladen omdat `X-Frame-Options` en de CSP-directive `frame-ancestors` ontbreken. Een aanvaller kan de applicatie onzichtbaar over een eigen pagina leggen en een ingelogde gebruiker laten klikken op knoppen die hij niet ziet.

### Impact

Een gebruiker kan ongemerkt acties uitvoeren in de applicatie, bijvoorbeeld een instelling wijzigen of een bevestiging geven. De impact hangt af van welke acties met één of enkele klikken mogelijk zijn; functies met CSRF-bescherming of extra bevestiging zijn niet via clickjacking te misbruiken.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Stuur `Content-Security-Policy: frame-ancestors 'none'` (of de expliciete domeinen die mogen framen) en als fallback voor oude browsers `X-Frame-Options: DENY` of `SAMEORIGIN`.

### References

- OWASP Clickjacking Defense Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html
- OWASP WSTG-CLNT-09: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/11-Client-side_Testing/09-Testing_for_Clickjacking
