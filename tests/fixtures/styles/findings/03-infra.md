## Verouderde Apache-versie met bekende kwetsbaarheden in de DMZ

**Severity**: High · **CVSS 3.1**: 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Likely · **Source**: Nmap, Nuclei · **Mapping**: A06:2021, WSTG-INFO-02 · **CWE**: 1104

**Affected**:

- 203.0.113.4 (static.voorbeeldwebshop.nl)
- 203.0.113.5 (legacy.voorbeeldwebshop.nl)

### Description

Twee systemen in de DMZ draaien Apache httpd 2.4.49. Deze versie bevat onder meer CVE-2021-41773 (path traversal en remote code execution bij een specifieke configuratie van `Require all granted` op de documentroot). De versie is herkenbaar aan de `Server`-header en is bevestigd via het `mod_status`-endpoint, dat eveneens publiek bereikbaar is.

Misbruik is niet uitgevoerd omdat het productiesystemen betreft en de afgesproken spelregels geen exploitatie op productie toestaan; de status van deze bevinding is daarom *waarschijnlijk*.

### Impact

Bij een kwetsbare configuratie kan een aanvaller bestanden buiten de documentroot lezen (zoals `/etc/passwd` en configuratiebestanden met credentials) en in het ergste geval willekeurige commando's uitvoeren op de webserver. Publieke exploits zijn beschikbaar; deze kwetsbaarheid wordt actief gescand en misbruikt.

### Evidence

```
$ nmap -sV -p 80,443 203.0.113.4 203.0.113.5
PORT    STATE SERVICE  VERSION
80/tcp  open  http     Apache httpd 2.4.49 ((Unix))
443/tcp open  ssl/http Apache httpd 2.4.49 ((Unix))

$ curl -sI https://static.voorbeeldwebshop.nl/ | grep -i server
Server: Apache/2.4.49 (Unix)

$ curl -s https://static.voorbeeldwebshop.nl/server-status | head -5
<title>Apache Status</title>
Server Version: Apache/2.4.49 (Unix) OpenSSL/1.1.1k
```

### Recommendation

- Werk Apache httpd bij naar de actuele versie in de 2.4-reeks en richt een maandelijkse patchcyclus in voor alle DMZ-systemen.
- Schakel `mod_status` uit of beperk het tot beheeradressen.
- Verberg de exacte versie (`ServerTokens Prod`, `ServerSignature Off`); dit maakt gerichte scans lastiger, maar is geen vervanging van patchen.
- Controleer de access-logs van beide servers op pogingen tot path traversal (`%2e%2e`, `.%2e/`) sinds oktober 2021.

### References

- CVE-2021-41773: https://nvd.nist.gov/vuln/detail/CVE-2021-41773
- Apache httpd 2.4 vulnerabilities: https://httpd.apache.org/security/vulnerabilities_24.html
