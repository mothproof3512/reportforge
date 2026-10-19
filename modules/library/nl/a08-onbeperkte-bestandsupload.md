## Onvoldoende beperkte bestandsupload

**Severity**: High · **CVSS 3.1**: 8.8 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A04:2021, WSTG-BUSL-08, WSTG-BUSL-09, V12 · **CWE**: 434 · **Tags**: web, invoervalidatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een uploadfunctie controleert het bestandstype alleen op basis van de extensie of de door de client opgegeven `Content-Type`, of helemaal niet. Geüploade bestanden worden opgeslagen onder de webroot met hun oorspronkelijke naam en zijn direct via een URL te benaderen.

### Impact

Afhankelijk van de serverconfiguratie kan een geüpload script door de webserver worden uitgevoerd, wat tot volledige overname leidt. Ook zonder uitvoering kunnen HTML- of SVG-bestanden met script worden geplaatst (stored XSS op het eigen domein), kan de bestandsnaam worden gebruikt voor path traversal, en kunnen grote bestanden de opslag vullen.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Valideer server-side het bestandstype op inhoud (magic bytes), niet op extensie of `Content-Type`, en hanteer een whitelist van toegestane typen.
- Sla uploads op buiten de webroot (of in object storage) onder een door de server gegenereerde naam; serveer ze via een aparte route of apart domein met `Content-Disposition: attachment` en een vaste `Content-Type`.
- Verwerk afbeeldingen opnieuw (re-encode) om ingebedde inhoud te verwijderen; scan bestanden op malware waar dat past.
- Beperk de bestandsgrootte en het aantal uploads per gebruiker.

### References

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP WSTG-BUSL-09: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/10-Business_Logic_Testing/09-Test_Upload_of_Malicious_Files
