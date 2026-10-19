## Verouderde TLS-protocollen en zwakke cipher suites

**Severity**: Low · **CVSS 3.1**: 3.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A02:2021, WSTG-CRYP-01, V9 · **CWE**: 326 · **Tags**: infra, web, cryptografie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De server accepteert TLS 1.0 en/of TLS 1.1 en biedt cipher suites aan zonder forward secrecy of met bekende zwakheden (bijvoorbeeld 3DES of CBC-suites die gevoelig zijn voor padding-oracle-aanvallen). Moderne clients onderhandelen in de praktijk TLS 1.2 of 1.3 met sterke suites, maar een aanvaller met een netwerkpositie kan een downgrade afdwingen bij clients die de oude protocollen nog ondersteunen.

### Impact

Onder specifieke omstandigheden (netwerkpositie en een client die zwakke suites accepteert) kan versleuteld verkeer worden ontsleuteld of gemanipuleerd. Het praktische risico is beperkt, maar de configuratie voldoet niet aan gangbare baselines (NCSC, Mozilla) en levert bevindingen op bij audits en PCI DSS-scans.

### Evidence

```
$ testssl.sh --protocols --ciphers <host>:443
 TLS 1.0    offered (deprecated)
 TLS 1.1    offered (deprecated)
 TLS 1.2    offered
 TLS 1.3    not offered
 ...
 DES-CBC3-SHA  (3DES, SWEET32)   offered
```

### Recommendation

- Schakel TLS 1.0 en 1.1 uit; bied TLS 1.2 en TLS 1.3 aan.
- Beperk de cipher suites tot AEAD-suites met ECDHE (forward secrecy), bijvoorbeeld de "intermediate"-configuratie van de Mozilla SSL Configuration Generator.
- Zet HSTS aan (zie aparte bevinding indien van toepassing) en controleer na de wijziging met testssl.sh of SSL Labs.

### References

- NCSC, IT-beveiligingsrichtlijnen voor TLS: https://www.ncsc.nl/documenten/publicaties/2021/januari/19/ict-beveiligingsrichtlijnen-voor-transport-layer-security-2.1
- Mozilla SSL Configuration Generator: https://ssl-config.mozilla.org/
- OWASP WSTG-CRYP-01: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/01-Testing_for_Weak_Transport_Layer_Security
