## Subdomein kan worden overgenomen (dangling DNS)

**Severity**: Medium · **CVSS 3.1**: 6.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`) · **Status**: Likely · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CONF-10, V14 · **CWE**: 1021 · **Tags**: infra, dns

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een subdomein van de organisatie verwijst via een CNAME- of A-record naar een externe dienst (hosting, CDN, SaaS, cloudopslag) waar de bijbehorende resource niet meer bestaat. Bij de betreffende dienst kan iedereen die naam opnieuw claimen, waarna het subdomein van de organisatie content van een derde toont. De overname is niet uitgevoerd; vastgesteld is dat de resource ontbreekt en de dienst het claimen toestaat.

### Impact

Een aanvaller kan onder een vertrouwd subdomein phishingpagina's hosten, cookies voor het hoofddomein uitlezen of zetten (afhankelijk van de cookie-scope), CORS- en CSP-whitelists misbruiken en geldige TLS-certificaten voor het subdomein verkrijgen.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Verwijder het DNS-record of koppel de resource opnieuw bij de dienst.
- Richt een proces in waarbij het opheffen van een externe dienst altijd gepaard gaat met het verwijderen van het DNS-record, en inventariseer periodiek alle records die naar externe diensten wijzen.

### References

- OWASP WSTG-CONF-10: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover
