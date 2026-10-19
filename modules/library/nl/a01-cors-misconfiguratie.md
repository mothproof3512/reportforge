## Te ruime CORS-configuratie met credentials

**Severity**: Medium · **CVSS 3.1**: 7.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-CLNT-07, V14 · **CWE**: 942 · **Tags**: web, api, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De API reflecteert de `Origin`-header van elk verzoek in `Access-Control-Allow-Origin` en stuurt daarbij `Access-Control-Allow-Credentials: true`. Daardoor mag een script op een willekeurig domein met de cookies van de gebruiker verzoeken doen naar de API en de antwoorden lezen.

### Impact

Een aanvaller die een gebruiker een geprepareerde pagina laat openen, kan namens die gebruiker de API uitlezen en acties uitvoeren, inclusief gegevens die normaal alleen na inloggen zichtbaar zijn. De same-origin policy, de belangrijkste bescherming van de browser, is hiermee effectief uitgeschakeld voor deze API.

### Evidence

```http
GET /api/me HTTP/1.1
Host: 
Origin: https://aanvaller.example
Cookie: session=<geldige sessie>
```

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://aanvaller.example
Access-Control-Allow-Credentials: true

{ "email": "...", "role": "..." }
```

### Recommendation

- Gebruik een expliciete whitelist van vertrouwde origins en reflecteer nooit de ontvangen `Origin`. Controleer op exacte overeenkomst, niet op een substring of prefix (anders matcht `https://app.example.com.aanvaller.example`).
- Stuur `Access-Control-Allow-Credentials: true` alleen voor origins die credentials echt nodig hebben.
- Behandel `null` als origin niet als vertrouwd.

### References

- OWASP WSTG-CLNT-07: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing
- PortSwigger, CORS: https://portswigger.net/web-security/cors
- CWE-942: https://cwe.mitre.org/data/definitions/942.html
