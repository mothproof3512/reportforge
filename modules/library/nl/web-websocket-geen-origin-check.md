## WebSocket-verbinding zonder origin-controle (cross-site WebSocket hijacking)

**Severity**: Medium · **CVSS 3.1**: 7.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, WSTG-CLNT-10, V13.5 · **CWE**: 1385 · **Tags**: web, websocket, autorisatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De WebSocket-endpoint authenticeert de gebruiker op basis van de sessiecookie, maar controleert de `Origin`-header van de handshake niet. Een pagina op een willekeurig domein kan daardoor namens een ingelogde bezoeker een WebSocket-verbinding openen en berichten lezen en versturen.

### Impact

Dit is het WebSocket-equivalent van CSRF, met als verschil dat de aanvaller ook de antwoorden kan lezen: gegevens van de gebruiker kunnen worden uitgelezen en acties kunnen namens de gebruiker worden uitgevoerd, zolang het slachtoffer een door de aanvaller gecontroleerde pagina bezoekt.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Controleer de `Origin`-header tijdens de handshake tegen een allowlist en weiger de verbinding bij afwijkingen.
- Gebruik bij voorkeur een token (afgegeven in de applicatie zelf) voor authenticatie van de WebSocket in plaats van alleen de cookie, en stel cookies in met `SameSite`.

### References

- OWASP WSTG-CLNT-10: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/10-Testing_WebSockets
- CWE-1385: https://cwe.mitre.org/data/definitions/1385.html
