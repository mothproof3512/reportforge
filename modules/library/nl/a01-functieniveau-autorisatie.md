## Ontbrekende autorisatie op functieniveau (toegang tot beheerfuncties)

**Severity**: High · **CVSS 3.1**: 8.1 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A01:2021, WSTG-ATHZ-02, WSTG-ATHZ-03, API5:2023, V4 · **CWE**: 285 · **Tags**: web, api, autorisatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Functionaliteit die bedoeld is voor beheerders of medewerkers is bereikbaar voor reguliere gebruikers. De gebruikersinterface verbergt de knoppen en menu's, maar de onderliggende endpoints controleren de rol van de aanvrager niet. Door het verzoek direct naar het endpoint te sturen (bijvoorbeeld met een HTTP-proxy) kan een gebruiker met een laag privilege beheeracties uitvoeren.

### Impact

Een reguliere gebruiker kan zichzelf of anderen rechten toekennen, gebruikers aanmaken of verwijderen, instellingen wijzigen of gegevens van alle gebruikers inzien en bewerken. De impact komt neer op een volledige compromittering van de applicatie en haar gegevens door iedereen met een account.

### Evidence

Verzoek aan een beheerendpoint met de sessie van een reguliere gebruiker:

```http
POST /api/admin/users/4711/role HTTP/1.1
Host: 
Authorization: Bearer <token van reguliere gebruiker>
Content-Type: application/json

{ "role": "admin" }
```

```http
HTTP/1.1 200 OK
{ "id": 4711, "role": "admin" }
```

Na dit verzoek had de testaccount toegang tot het beheerpaneel.

### Recommendation

- Dwing autorisatie op functieniveau server-side af voor elk endpoint, bij voorkeur met een "deny by default"-beleid: een endpoint is alleen bereikbaar voor rollen die expliciet zijn toegestaan.
- Centraliseer de rolcontrole (middleware of decorators) en leg de rechtenmatrix vast, zodat ontwikkelaars niet per endpoint hoeven te onthouden welke controle nodig is.
- Verberg beheerfuncties niet alleen in de interface; de interface is geen beveiligingsmaatregel.
- Voeg autorisatietests toe die beheerendpoints met een gebruikersaccount aanroepen en HTTP 403 verwachten.

### References

- OWASP API Security Top 10 2023 — API5: Broken Function Level Authorization: https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/
- OWASP WSTG-ATHZ-02: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/05-Authorization_Testing/02-Testing_for_Bypassing_Authorization_Schema
- CWE-285: https://cwe.mitre.org/data/definitions/285.html
