## Directory listing en achtergebleven back-up- en configuratiebestanden

**Severity**: Medium · **CVSS 3.1**: 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CONF-04, WSTG-INFO-03, V14 · **CWE**: 538 · **Tags**: web, infra, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De webserver toont de inhoud van mappen zonder indexbestand en/of er zijn bestanden bereikbaar die niet voor publicatie bedoeld zijn: back-ups (`.bak`, `.old`, `.zip`), editor-restanten (`.swp`, `~`), versiebeheer (`.git/`), omgevingsbestanden (`.env`) of exports. De ernst hangt af van de inhoud; als alleen publieke bestanden zichtbaar zijn, is de bevinding informatief.

### Impact

Back-ups en configuratiebestanden bevatten regelmatig broncode, databasecredentials en API-sleutels. Een bereikbare `.git`-map maakt het mogelijk de volledige broncode inclusief historie te downloaden, waarin vaak eerder verwijderde secrets staan.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel directory listing uit (`Options -Indexes` in Apache, `autoindex off` in nginx).
- Verwijder back-ups, exports en versiebeheermappen uit de webroot en blokkeer de bijbehorende patronen in de webserverconfiguratie als vangnet.
- Neem een controle op onbedoelde bestanden op in het deploymentproces (bijvoorbeeld een lijst van toegestane extensies).
- Roteer alle secrets die in bereikbare bestanden stonden.

### References

- OWASP WSTG-CONF-04: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/04-Review_Old_Backup_and_Unreferenced_Files_for_Sensitive_Information
- CWE-538: https://cwe.mitre.org/data/definitions/538.html
