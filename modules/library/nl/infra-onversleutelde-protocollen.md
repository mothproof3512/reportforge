## Onversleutelde protocollen in gebruik (credentials in platte tekst)

**Severity**: Medium · **CVSS 3.1**: 5.3 (`CVSS:3.1/AV:A/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A02:2021, WSTG-CRYP-03, T1040, V9 · **CWE**: 319 · **Tags**: infra, netwerk, cryptografie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Op de genoemde systemen zijn diensten actief die authenticatie en gegevens onversleuteld over het netwerk versturen: FTP, Telnet, HTTP zonder TLS voor inlogformulieren, LDAP zonder TLS, SNMPv1/2c of oude databaseprotocollen. Tijdens de test is bevestigd dat inloggegevens in platte tekst over het netwerk gaan.

### Impact

Iedereen met een netwerkpositie tussen client en server (bijvoorbeeld via een gecompromitteerde werkplek, een open netwerkaansluiting of name poisoning) kan inloggegevens en gegevens meelezen en hergebruiken.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken systemen, de reproductiestappen, de relevante tooloutput (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Vervang de protocollen door hun versleutelde tegenhangers (SFTP/FTPS, SSH, HTTPS, LDAPS/StartTLS, SNMPv3) en schakel de onversleutelde varianten uit.
- Waar een legacy-systeem geen versleuteling ondersteunt: isoleer het in een eigen netwerksegment en beperk de toegang tot de strikt noodzakelijke systemen.

### References

- CWE-319: https://cwe.mitre.org/data/definitions/319.html
