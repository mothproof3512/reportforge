## Zwakheden in de verwerking van JSON Web Tokens

**Severity**: High · **CVSS 3.1**: 9.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-SESS-10, API2:2023, V3 · **CWE**: 347 · **Tags**: web, api, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie gebruikt JWT's voor authenticatie en valideert die onvoldoende. Vastgesteld is een of meer van: tokens met een ongeldige of ontbrekende handtekening worden geaccepteerd, de signeersleutel is zwak of te raden, het algoritme uit de tokenheader wordt gevolgd in plaats van afgedwongen, de `exp`-claim wordt niet gecontroleerd, of gevoelige gegevens staan onversleuteld in de payload.

### Impact

Een aanvaller kan een token vervalsen met een willekeurige gebruikers-ID of rol en zich zo voordoen als elke gebruiker, inclusief beheerders. Dit is in de praktijk een volledige omzeiling van de authenticatie.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Dwing het verwachte algoritme af in de verificatiecode (accepteer nooit `none` en vertrouw de `alg`-header niet); gebruik bij voorkeur asymmetrische handtekeningen (RS256/ES256) zodat de verificatiesleutel geen geheim is.
- Gebruik bij HMAC een willekeurige sleutel van minimaal 256 bits uit een secret store.
- Valideer `exp`, `nbf`, `iss` en `aud`; houd de levensduur kort en combineer met intrekbare refresh tokens.
- Zet geen gevoelige gegevens in de payload; die is alleen base64-gecodeerd, niet versleuteld.

### References

- OWASP JSON Web Token Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- OWASP WSTG-SESS-10: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/06-Session_Management_Testing/10-Testing_JSON_Web_Tokens
- RFC 8725, JWT Best Current Practices: https://www.rfc-editor.org/rfc/rfc8725
