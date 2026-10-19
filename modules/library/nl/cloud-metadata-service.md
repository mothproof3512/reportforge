## Cloud-metadataservice bereikbaar vanuit de applicatie

**Severity**: High · **CVSS 3.1**: 8.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A10:2021, WSTG-INPV-19 · **CWE**: 918 · **Tags**: cloud, ssrf

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie draait op een cloudinstantie waarvan de metadataservice (`169.254.169.254`) zonder beperkingen bereikbaar is, en de applicatie bevat een functie die serverzijdige verzoeken naar door de gebruiker bepaalde adressen doet (SSRF) of laat willekeurige code uitvoeren. Daardoor zijn de tijdelijke credentials van de instantierol op te vragen.

### Impact

Met de credentials van de instantierol krijgt een aanvaller de rechten van de instantie in het cloudaccount: vaak toegang tot opslag, databases, secrets en soms beheerrechten. Dit is een bekend patroon in grote datalekken.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Verhelp de SSRF (zie aparte bevinding) en beperk uitgaand verkeer van de applicatie.
- Dwing de versie-2 metadataservice af (AWS IMDSv2 met `HttpTokens=required`, Azure/GCP-equivalent met verplichte header) en beperk het aantal hops, zodat een eenvoudig doorgestuurd verzoek niet volstaat.
- Geef de instantierol alleen de rechten die de applicatie nodig heeft en monitor op gebruik van de credentials vanaf onbekende adressen.

### References

- AWS IMDSv2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
