## Ongeautoriseerde toegang tot orders van andere klanten (IDOR)

**Severity**: Critical · **CVSS 3.1**: 9.6 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Burp Suite · **Mapping**: A01:2021, WSTG-ATHZ-04, API1:2023 · **CWE**: 639

**Affected**:

- https://api.voorbeeldwebshop.nl/v2/orders/{id}
- https://api.voorbeeldwebshop.nl/v2/orders/{id}/invoice
- https://mijn.voorbeeldwebshop.nl/orders/{id}

### Description

Het endpoint `GET /v2/orders/{id}` controleert wel of de aanvrager is ingelogd, maar niet of de opgevraagde order bij het eigen account hoort. Ordernummers zijn oplopend en voorspelbaar (bijv. `184201`, `184202`). Door het nummer in de URL te wijzigen kan een ingelogde klant de volledige order van een willekeurige andere klant opvragen, inclusief naam, afleveradres, factuuradres, e-mailadres, telefoonnummer, bestelde artikelen en de laatste vier cijfers van het gebruikte betaalmiddel.

Hetzelfde geldt voor het factuur-endpoint (`/invoice`), dat de PDF-factuur van elke order teruggeeft. Het klantportaal (`mijn.voorbeeldwebshop.nl`) gebruikt deze API direct, zodat de kwetsbaarheid ook via de browser te misbruiken is.

### Impact

Een aanvaller met een regulier klantaccount (gratis aan te maken) kan de persoons- en bestelgegevens van alle klanten inzien. Omdat ordernummers oplopend zijn en er geen rate limiting is (zie F-04), kan het volledige klantenbestand in korte tijd geautomatiseerd worden gedownload. Tijdens de test is dit aangetoond voor een steekproef van 50 orders; de hoogste waargenomen order-ID was `191.882`, wat wijst op ruim 190.000 orders.

Dit is een datalek in de zin van de AVG met meldplicht aan de Autoriteit Persoonsgegevens en mogelijk aan betrokkenen. Daarnaast kunnen de gegevens worden gebruikt voor gerichte phishing ("uw bestelling #184201 kon niet worden bezorgd").

### Evidence

Opvragen van de eigen order (account `tester1`, order `184201`) en vervolgens van een order die bij een ander account hoort:

```http
GET /v2/orders/184202 HTTP/1.1
Host: api.voorbeeldwebshop.nl
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0ZXIxIiwicm9sZSI6ImN1c3RvbWVyIn0.q3xK...
```

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 184202,
  "customer": { "name": "R. van den B***", "email": "r.vdb***@example.org", "phone": "06-12***" },
  "shipping_address": { "street": "Dorpsstraat 12", "postal_code": "1234 AB", "city": "Ons Dorp" },
  "items": [ { "sku": "SKU-20931", "name": "Koptelefoon X200", "qty": 1, "price": 129.00 } ],
  "payment": { "method": "ideal", "iban_last4": "4821" }
}
```

![Order van een andere klant zichtbaar in het klantportaal na aanpassen van het ordernummer](../images/idor-portal.png)

Met een eenvoudig script zijn 50 opeenvolgende orders opgehaald; alle 50 verzoeken gaven HTTP 200 met gegevens van verschillende klanten.

### Recommendation

- Voer bij elk object-gebonden endpoint een autorisatiecontrole uit: de opgevraagde order moet toebehoren aan de geauthenticeerde gebruiker (of aan een gebruiker met een expliciete medewerkersrol). Implementeer dit centraal (middleware of repository-laag), niet per endpoint.
- Gebruik voor externe verwijzingen niet-voorspelbare identifiers (UUIDv4) in plaats van oplopende nummers. Dit is een verdedigingslaag, geen vervanging van de autorisatiecontrole.
- Voeg geautomatiseerde tests toe die voor elk endpoint controleren dat object-toegang met een vreemd account HTTP 403/404 oplevert.
- Beoordeel, gezien de omvang en de gevoeligheid van de gegevens, samen met de functionaris gegevensbescherming of een melding bij de Autoriteit Persoonsgegevens noodzakelijk is.

### References

- OWASP API Security Top 10 2023 — API1: Broken Object Level Authorization: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- CWE-639: Authorization Bypass Through User-Controlled Key: https://cwe.mitre.org/data/definitions/639.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
