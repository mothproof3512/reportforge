## Open redirect

**Severity**: Low · **CVSS 3.1**: 6.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, WSTG-CLNT-04, V5 · **CWE**: 601 · **Tags**: web, invoervalidatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een parameter die na inloggen of na een actie bepaalt waarheen de gebruiker wordt doorgestuurd (zoals `returnUrl` of `next`) accepteert willekeurige externe adressen. De applicatie controleert niet of het doel binnen het eigen domein ligt.

### Impact

Een aanvaller kan een link naar het vertrouwde domein van de organisatie maken die de gebruiker na het inloggen naar een phishingpagina stuurt. Omdat de link begint met het echte domein, is dit overtuigend. Bij OAuth- of SSO-flows kan een open redirect bovendien worden gebruikt om autorisatiecodes of tokens te onderscheppen, wat de ernst verhoogt.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Accepteer alleen relatieve paden of controleer het doel tegen een whitelist van toegestane hosts; vergelijk op de volledige host, niet op een prefix.
- Gebruik waar mogelijk een indirecte verwijzing (een ID dat server-side naar een URL wordt vertaald).

### References

- OWASP Unvalidated Redirects and Forwards Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
- CWE-601: https://cwe.mitre.org/data/definitions/601.html
