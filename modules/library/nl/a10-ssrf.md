## Server-side request forgery (SSRF)

**Severity**: High · **CVSS 3.1**: 8.5 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A10:2021, WSTG-INPV-19, API7:2023, V5 · **CWE**: 918 · **Tags**: web, api, injectie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Een functie die een URL ophaalt namens de gebruiker (bijvoorbeeld een webhook, een "importeer vanaf URL"-functie, een afbeeldingsproxy of een PDF-generator) accepteert willekeurige adressen, inclusief interne IP-adressen en de metadata-dienst van de cloudprovider. De server doet het verzoek vanuit zijn eigen netwerkpositie en geeft (delen van) het antwoord terug.

### Impact

Een aanvaller kan interne systemen bereiken die vanaf het internet niet toegankelijk zijn (beheerinterfaces, databases, interne API's) en in cloudomgevingen credentials ophalen uit de metadata-dienst, wat tot overname van de cloudomgeving kan leiden. Ook zonder zichtbaar antwoord (blind SSRF) kunnen interne diensten worden gescand en aangeroepen.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Valideer de doel-URL tegen een whitelist van toegestane hosts of domeinen; weiger IP-adressen in private en link-local ranges (inclusief IPv6 en alternatieve notaties) en controleer dit opnieuw na DNS-resolutie en bij redirects.
- Voer uitgaande verzoeken uit vanaf een apart netwerksegment of via een egress-proxy die alleen de toegestane bestemmingen doorlaat.
- Blokkeer in cloudomgevingen de toegang tot de metadata-dienst voor het applicatieproces (bijvoorbeeld IMDSv2 met hop-limit 1 op AWS).
- Beperk toegestane protocollen tot http(s) en sta geen redirects toe tenzij nodig.

### References

- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP WSTG-INPV-19: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/19-Testing_for_Server-Side_Request_Forgery
