## Sessiecookies zonder beschermende attributen

**Severity**: Low · **CVSS 3.1**: 4.2 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-SESS-02, V3 · **CWE**: 614 · **Tags**: web, sessiebeheer

**Affected**:

- (vul in: host, URL of systeem)

### Description

Het sessiecookie wordt gezet zonder een of meer van de attributen `Secure`, `HttpOnly` en `SameSite`. Zonder `Secure` kan het cookie over een onversleutelde verbinding worden verstuurd; zonder `HttpOnly` is het leesbaar voor script in de pagina; zonder `SameSite` wordt het meegestuurd bij verzoeken vanaf andere sites.

### Impact

De attributen beperken de gevolgen van andere zwakheden: een XSS-kwetsbaarheid leidt zonder `HttpOnly` direct tot sessieovername, een netwerkpositie zonder `Secure` tot afluisteren van de sessie, en het ontbreken van `SameSite` vergemakkelijkt CSRF. Op zichzelf vormt de bevinding geen direct risico.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Zet `Secure`, `HttpOnly` en `SameSite=Lax` (of `Strict` waar de functionaliteit dat toelaat) op alle sessie- en authenticatiecookies.
- Overweeg het `__Host-`-prefix voor het sessiecookie, zodat het aan een host is gebonden en niet door subdomeinen kan worden overschreven.

### References

- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP WSTG-SESS-02: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/06-Session_Management_Testing/02-Testing_for_Cookies_Attributes
