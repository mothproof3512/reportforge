## API geeft meer gegevens terug dan de interface nodig heeft

**Severity**: Medium · **CVSS 3.1**: 6.5 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: API3:2023, A01:2021, V4 · **CWE**: 213 · **Tags**: api, gegevensbescherming

**Affected**:

- (vul in: host, URL of systeem)

### Description

API-antwoorden bevatten het volledige onderliggende object, terwijl de gebruikersinterface maar een deel toont. In de antwoorden staan velden die niet voor de aanvrager bedoeld zijn, zoals e-mailadressen en telefoonnummers van andere gebruikers, interne notities, wachtwoord-hashes, tokens of interne statusvelden. De filtering gebeurt client-side.

### Impact

Iedereen die de API direct aanroept (wat elke gebruiker kan), ziet de gegevens die de interface verbergt. Dit is een lek van persoonsgegevens en, als hashes of tokens meekomen, een opstap naar accountovername.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Definieer per endpoint een expliciet antwoordmodel (view/DTO) met alleen de velden die de aanvrager mag zien, en bouw antwoorden daaruit op in plaats van het volledige object te serialiseren.
- Beschouw de API als de grens van de applicatie: filtering in de frontend is geen beveiliging.
- Controleer bestaande antwoorden op gevoelige velden en verwijder die.

### References

- OWASP API Security Top 10 2023 — API3: https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
- CWE-213: https://cwe.mitre.org/data/definitions/213.html
