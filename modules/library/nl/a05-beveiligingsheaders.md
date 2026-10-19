## Ontbrekende of zwakke HTTP-beveiligingsheaders

**Severity**: Low · **CVSS 3.1**: 3.1 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CONF-12, V14 · **CWE**: 693 · **Tags**: web, configuratie, hardening

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie stuurt geen of onvolledige beveiligingsheaders. Ontbrekend of zwak zijn: `Content-Security-Policy`, `X-Frame-Options` (of `frame-ancestors`), `Referrer-Policy`, `X-Content-Type-Options` en/of `Strict-Transport-Security` met een te korte `max-age`.

### Impact

De headers vormen op zichzelf geen kwetsbaarheid, maar maken andere aanvallen makkelijker en effectiever: zonder CSP is cross-site scripting direct uitvoerbaar, zonder frame-beperking is clickjacking mogelijk, zonder HSTS kan een eerste verzoek over HTTP worden onderschept. De bevinding weegt zwaarder naarmate er ook injectiebevindingen zijn.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- `Content-Security-Policy`: begin met `default-src 'self'` en breid gericht uit; vermijd `unsafe-inline` en `unsafe-eval`. Test eerst in `Content-Security-Policy-Report-Only`.
- `X-Frame-Options: DENY` of CSP `frame-ancestors 'none'` (of de domeinen die de applicatie mogen framen).
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`; overweeg opname in de HSTS-preloadlijst.
- `X-Content-Type-Options: nosniff` en `Referrer-Policy: strict-origin-when-cross-origin`.

### References

- OWASP HTTP Headers Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- OWASP WSTG-CONF-12: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/12-Test_for_Content_Security_Policy
