## SQL-injectie

**Severity**: Critical · **CVSS 3.1**: 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A03:2021, WSTG-INPV-05, V5 · **CWE**: 89 · **Tags**: web, api, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Gebruikersinvoer wordt zonder parameterbinding opgenomen in een databasequery. De applicatie bouwt de query op door tekst aan elkaar te plakken, waardoor speciale tekens in de invoer de structuur van de query veranderen. Tijdens de test is vastgesteld dat de invoer de query beïnvloedt en dat gegevens uit de database kunnen worden uitgelezen.

De databasegebruiker van de applicatie heeft daarbij toegang tot meer tabellen dan de betreffende functie nodig heeft.

### Impact

Een aanvaller kan de volledige database uitlezen, waaronder persoonsgegevens en wachtwoord-hashes, en afhankelijk van de rechten van de databasegebruiker ook gegevens wijzigen of verwijderen. Bij bepaalde databaseconfiguraties is uitbreiding naar het onderliggende systeem mogelijk. Dit is een datalek in de zin van de AVG zodra de kwetsbaarheid is misbruikt; de webserverlogs geven uitsluitsel.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik uitsluitend geparametriseerde queries (prepared statements) of een ORM die dat afdwingt, voor alle database-interactie. Voor dynamische onderdelen die niet te parametriseren zijn (sorteerkolom, tabelnaam) een strikte whitelist.
- Beperk de rechten van de databasegebruiker tot wat de applicatie nodig heeft (least privilege); scheid lees- en schrijfrollen waar mogelijk.
- Controleer de webserver- en databaselogs op eerder misbruik en beoordeel samen met de functionaris gegevensbescherming of een melding nodig is.
- Overweeg een gedwongen wachtwoordreset als de wachtwoord-hashes bereikbaar waren.

### References

- OWASP SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- OWASP WSTG-INPV-05: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05-Testing_for_SQL_Injection
- CWE-89: https://cwe.mitre.org/data/definitions/89.html
