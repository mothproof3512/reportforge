## Zwakheid in bedrijfslogica (omzeilen van een procesregel)

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A04:2021, WSTG-BUSL-01, V11 · **CWE**: 840 · **Tags**: web, api, bedrijfslogica

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een bedrijfsregel die de applicatie zou moeten afdwingen (volgorde van stappen, maximumaantallen, prijs- of kortingsberekening, goedkeuring door een tweede persoon) wordt alleen in de gebruikersinterface gecontroleerd of kan worden omzeild door verzoeken aan te passen, over te slaan of te herhalen.

### Impact

De regel beschermt een financieel of procesmatig belang: de aanvaller kan bijvoorbeeld een lagere prijs afdwingen, een stap overslaan die verificatie vereist, of een eenmalige actie meerdere keren uitvoeren. Geautomatiseerde scanners vinden dit soort fouten niet; de impact is afhankelijk van de regel en in dit geval beschreven in het bewijs.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Dwing de regel server-side af, onafhankelijk van wat de client meestuurt: bereken bedragen en kortingen op de server, houd de stapstatus in de sessie of database bij en controleer bij elke stap of de vorige is voltooid.
- Maak gevoelige acties idempotent of beperk ze expliciet tot het toegestane aantal.
- Neem misbruikscenario's op in het testproces (abuse cases) naast de functionele tests.

### References

- OWASP WSTG Business Logic Testing: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/
- OWASP ASVS V11: https://github.com/OWASP/ASVS
