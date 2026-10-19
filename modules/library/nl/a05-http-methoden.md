## Onnodige HTTP-methoden toegestaan

**Severity**: Low · **CVSS 3.1**: 4.8 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CONF-06, V14 · **CWE**: 16 · **Tags**: web, infra, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De webserver accepteert HTTP-methoden die de applicatie niet nodig heeft, zoals `TRACE`, `PUT`, `DELETE` of `OPTIONS` met een uitgebreide lijst. Bij `TRACE` wordt het verzoek inclusief headers teruggekaatst; bij `PUT`/`DELETE` is onderzocht of bestanden kunnen worden geplaatst of verwijderd.

### Impact

`TRACE` kan in combinatie met een andere kwetsbaarheid worden gebruikt om headers (zoals cookies met `HttpOnly`) uit te lezen. Toegestane `PUT`/`DELETE` zonder autorisatie leidt tot het plaatsen of verwijderen van bestanden op de server. Zonder zo'n bijkomende zwakte is de impact beperkt.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Sta per route alleen de methoden toe die de applicatie gebruikt en beantwoord andere met HTTP 405.
- Schakel `TRACE` uit op de webserver (`TraceEnable off` in Apache; nginx ondersteunt het standaard niet).
- Controleer of de reverse proxy of load balancer de beperking niet omzeilt.

### References

- OWASP WSTG-CONF-06: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods
