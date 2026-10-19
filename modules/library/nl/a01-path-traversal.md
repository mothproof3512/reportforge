## Path traversal bij het ophalen van bestanden

**Severity**: High · **CVSS 3.1**: 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, WSTG-ATHZ-01, V12 · **CWE**: 22 · **Tags**: web, api, invoervalidatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een downloadfunctie gebruikt een door de gebruiker opgegeven bestandsnaam of pad zonder dit te normaliseren en te controleren tegen de toegestane map. Met `../`-sequenties (eventueel URL-gecodeerd als `%2e%2e%2f`) kan buiten de bedoelde map worden gelezen.

### Impact

Een aanvaller kan willekeurige bestanden lezen waartoe het applicatieproces toegang heeft: configuratiebestanden met database- en API-credentials, broncode, private keys en systeembestanden. Met de gevonden credentials is vaak directe toegang tot de database of andere systemen mogelijk, waardoor deze bevinding zelden op zichzelf staat.

### Evidence

```http
GET /download?file=..%2f..%2f..%2fetc%2fpasswd HTTP/1.1
Host: 
```

```
HTTP/1.1 200 OK
Content-Type: application/octet-stream

root:x:0:0:root:/root:/bin/bash
...
```

Vervolgens is het configuratiebestand van de applicatie opgehaald (`../../config/database.yml`), dat de databasecredentials in platte tekst bevat.

### Recommendation

- Gebruik geen gebruikersinvoer in bestandspaden. Werk met een indirecte verwijzing (bijvoorbeeld een ID dat server-side wordt vertaald naar een pad) of een strikte whitelist van toegestane bestandsnamen.
- Als een pad onvermijdelijk is: normaliseer het (resolve van `..` en symlinks) en controleer dat het resultaat binnen de toegestane basismap ligt, vóór het openen van het bestand.
- Draai het applicatieproces met minimale bestandsrechten en sla secrets niet in leesbare configuratiebestanden op (gebruik een secret store of omgevingsvariabelen met beperkte toegang).
- Roteer alle credentials die via deze kwetsbaarheid leesbaar waren.

### References

- OWASP WSTG-ATHZ-01: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/05-Authorization_Testing/01-Testing_Directory_Traversal_File_Include
- CWE-22: https://cwe.mitre.org/data/definitions/22.html
