## Versie-informatie van server en frameworks zichtbaar

**Severity**: Low · **CVSS 3.1**: 5.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-INFO-02, WSTG-INFO-08 · **CWE**: 200 · **Tags**: web, infra, informatielek

**Affected**:

- (vul in: host, URL of systeem)

### Description

De webserver, applicatieserver en/of frameworks maken hun exacte versie bekend via HTTP-headers (`Server`, `X-Powered-By`, `X-AspNet-Version`), standaardfoutpagina's of bekende bestanden zoals `package.json`, `composer.lock` of `/.well-known`-metadata.

### Impact

Versie-informatie op zich geeft geen toegang, maar maakt gericht zoeken naar bekende kwetsbaarheden en exploits eenvoudig en versnelt een aanval. In combinatie met verouderde componenten (zie aparte bevinding) is de impact direct.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Verwijder of neutraliseer versie-informatie in headers en foutpagina's (`ServerTokens Prod`, `server_tokens off`, `X-Powered-By` uitschakelen) en verwijder niet-benodigde metadata uit de webroot.
- Belangrijker: zorg dat componenten up-to-date zijn, zodat de versie geen geheim hoeft te zijn.

### References

- OWASP WSTG-INFO-02: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server
