## Gevoelige gegevens in URL-parameters

**Severity**: Low · **CVSS 3.1**: 3.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A02:2021, WSTG-CRYP-03, V8 · **CWE**: 598 · **Tags**: web, api, gegevensbescherming

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie verstuurt gevoelige gegevens (sessietokens, wachtwoorden, e-mailadressen, BSN's of resettokens) als onderdeel van de URL. URL's worden opgeslagen in browsergeschiedenis, proxylogs, webserverlogs en analytics, en lekken via de `Referer`-header naar externe sites waarnaar de pagina linkt.

### Impact

Gegevens in de URL belanden op plekken die niet voor vertrouwelijke informatie zijn ingericht en door meer mensen en systemen te lezen zijn dan de applicatie zelf. Een token in de URL kan door een derde partij (bijvoorbeeld een analytics-dienst of een gelinkte site) worden gebruikt om de sessie over te nemen.

### Evidence

```
GET /reset-password?token=5f2c...&email=gebruiker@example.org HTTP/1.1
Referer: https://<host>/reset-password?token=5f2c...&email=gebruiker@example.org
```

De `Referer` met het token werd meegestuurd naar een extern analytics-script op de pagina.

### Recommendation

- Verstuur gevoelige gegevens in de request-body (POST) of in headers, nooit in de query string.
- Stel een `Referrer-Policy` in van `strict-origin-when-cross-origin` of strenger.
- Laat eenmalige tokens direct na gebruik vervallen en beperk de levensduur.
- Verwijder gevoelige parameters uit bestaande logbestanden.

### References

- OWASP WSTG-CRYP-03: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/03-Testing_for_Sensitive_Information_Sent_via_Unencrypted_Channels
- CWE-598: https://cwe.mitre.org/data/definitions/598.html
