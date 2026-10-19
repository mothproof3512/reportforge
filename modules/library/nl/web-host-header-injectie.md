## Host header injection

**Severity**: Medium · **CVSS 3.1**: 7.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-INPV-17, V5 · **CWE**: 644 · **Tags**: web, invoervalidatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie gebruikt de `Host`-header uit het verzoek om absolute URL's op te bouwen, onder meer in wachtwoordreset-e-mails en redirects. De header wordt niet gevalideerd tegen de geconfigureerde hostnaam, waardoor een aanvaller een andere host in de gegenereerde links kan laten opnemen.

### Impact

Een aanvaller kan een wachtwoordreset aanvragen voor een slachtoffer met een gemanipuleerde `Host`-header; de resetlink in de e-mail wijst dan naar een server van de aanvaller, die het token ontvangt zodra het slachtoffer klikt. Dit leidt tot accountovername. Daarnaast kan de header worden misbruikt voor web cache poisoning.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Gebruik een vaste, geconfigureerde basis-URL voor het opbouwen van links; vertrouw nooit de `Host`- of `X-Forwarded-Host`-header.
- Laat de webserver of reverse proxy alleen verzoeken met een bekende hostnaam doorlaten (expliciete virtual hosts, default host die 400 teruggeeft).

### References

- OWASP WSTG-INPV-17: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection
- PortSwigger, HTTP Host header attacks: https://portswigger.net/web-security/host-header
