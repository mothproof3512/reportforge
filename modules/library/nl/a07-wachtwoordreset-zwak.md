## Zwakke wachtwoordresetfunctie

**Severity**: High · **CVSS 3.1**: 9.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-ATHN-09, V2 · **CWE**: 640 · **Tags**: web, api, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De wachtwoordresetfunctie vertoont een of meer zwakheden: de resetlink bevat een voorspelbare of korte code, de code verloopt niet of niet snel genoeg, de link kan meerdere keren worden gebruikt, de bestemming van de reset-e-mail is te beïnvloeden (bijvoorbeeld via de `Host`-header of een extra parameter), of het nieuwe wachtwoord kan worden gezet zonder de code te verifiëren.

### Impact

Een aanvaller kan het wachtwoord van een willekeurig account resetten en het account overnemen zonder het huidige wachtwoord te kennen. Dit raakt alle gebruikers, inclusief beheerders.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Genereer resettokens met een cryptografisch veilige generator (minimaal 128 bits), bewaar alleen een hash, laat ze na 15 tot 60 minuten en na eenmalig gebruik vervallen.
- Bouw de resetlink op met een vaste, geconfigureerde basis-URL; gebruik nooit de `Host`-header of invoer uit het verzoek.
- Verifieer het token server-side bij het zetten van het nieuwe wachtwoord, beëindig alle bestaande sessies en informeer de gebruiker per e-mail.
- Geef bij het aanvragen een neutraal antwoord dat geen informatie geeft over het bestaan van het account.

### References

- OWASP Forgot Password Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- OWASP WSTG-ATHN-09: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/04-Authentication_Testing/09-Testing_for_Weak_Password_Change_or_Reset_Functionalities
