## GraphQL-introspectie en onbeperkte query-complexiteit

**Severity**: Low · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: API8:2023, API4:2023, WSTG-APIT-01, V13 · **CWE**: 200 · **Tags**: api, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Het GraphQL-endpoint staat introspectie toe op een productieomgeving, waardoor het volledige schema inclusief interne en ongebruikte velden is op te vragen. Daarnaast ontbreekt een limiet op de diepte en complexiteit van query's; diep geneste query's worden volledig uitgevoerd.

### Impact

Introspectie onthult velden en mutaties die niet in de interface voorkomen, wat de zoektocht naar autorisatiefouten vereenvoudigt. Onbeperkte query-complexiteit maakt het mogelijk met een enkel verzoek de server zwaar te belasten (denial of service).

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel introspectie uit op productie, of beperk het tot geauthenticeerde ontwikkelaars.
- Stel limieten in op query-diepte en -complexiteit en op het aantal verzoeken per gebruiker; gebruik persisted queries waar mogelijk.
- Controleer autorisatie per resolver, niet alleen op het endpoint.

### References

- OWASP GraphQL Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- OWASP WSTG-APIT-01: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/12-API_Testing/01-Testing_GraphQL
