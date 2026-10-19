## Ongeautoriseerde toegang tot gegevens van andere gebruikers (IDOR)

**Severity**: High · **CVSS 3.1**: 7.1 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, WSTG-ATHZ-04, API1:2023, V4 · **CWE**: 639 · **Tags**: web, api, autorisatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie controleert bij het opvragen van een object (zoals een order, factuur, dossier of profiel) wel of de gebruiker is ingelogd, maar niet of het object bij die gebruiker hoort. De identifier in de URL of het verzoek (bijvoorbeeld `/api/orders/184202`) kan worden aangepast naar die van een ander, waarna de applicatie de gegevens van die ander teruggeeft.

Identifiers zijn oplopend en voorspelbaar, waardoor een aanvaller niet hoeft te raden maar eenvoudig kan tellen.

### Impact

Elke ingelogde gebruiker kan de gegevens van alle andere gebruikers inzien. In combinatie met voorspelbare identifiers en het ontbreken van rate limiting is het volledige gegevensbestand in korte tijd geautomatiseerd te downloaden. Afhankelijk van de inhoud (persoonsgegevens, financiële gegevens, medische informatie) is dit een datalek met meldplicht onder de AVG.

Waar het endpoint ook schrijfacties toestaat (wijzigen, verwijderen), kan een aanvaller gegevens van anderen manipuleren.

### Evidence

Opvragen van het eigen object, gevolgd door hetzelfde verzoek met een identifier die bij een ander account hoort:

```http
GET /api/orders/184202 HTTP/1.1
Host: 
Authorization: Bearer <token van account A>
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 184202, "customer": { "name": "<andere klant>", ... } }
```

Een steekproef van opeenvolgende identifiers gaf telkens HTTP 200 met gegevens van verschillende gebruikers.

### Recommendation

- Voer bij elk object-gebonden verzoek een autorisatiecontrole uit op de relatie tussen het object en de geauthenticeerde gebruiker (of diens organisatie/rol). Implementeer dit centraal (middleware, repository- of servicelaag) en niet per endpoint, zodat een vergeten controle geen kwetsbaarheid oplevert.
- Gebruik voor extern zichtbare verwijzingen niet-voorspelbare identifiers (UUIDv4). Dit is een extra laag, geen vervanging van de autorisatiecontrole.
- Voeg geautomatiseerde tests toe die per endpoint controleren dat toegang tot een object van een ander account HTTP 403 of 404 oplevert; neem dit op in de pipeline.
- Controleer de logs op afwijkende patronen (veel verschillende identifiers vanaf één account) om vast te stellen of de kwetsbaarheid al is misbruikt.

### References

- OWASP API Security Top 10 2023 — API1: Broken Object Level Authorization: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- CWE-639: https://cwe.mitre.org/data/definitions/639.html
