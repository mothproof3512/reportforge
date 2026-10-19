## Enumeratie van gebruikersnamen

**Severity**: Low · **CVSS 3.1**: 5.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A07:2021, WSTG-IDNT-04, V2 · **CWE**: 204 · **Tags**: web, api, authenticatie

**Affected**:

- (vul in: host, URL of systeem)

### Description

De applicatie reageert verschillend op een bestaand en een niet-bestaand account bij het inloggen, de wachtwoordreset of de registratie: een andere foutmelding, statuscode, responstijd of omvang van het antwoord. Daarmee kan een aanvaller vaststellen welke e-mailadressen of gebruikersnamen een account hebben.

### Impact

Een lijst van geldige accounts maakt credential stuffing en wachtwoordraden gerichter en vormt een privacyinbreuk: een derde kan vaststellen of iemand klant is van de organisatie. In combinatie met ontbrekende rate limiting wordt het opbouwen van zo'n lijst triviaal.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Geef bij inloggen, wachtwoordreset en registratie een identiek antwoord (tekst, statuscode, omvang) ongeacht of het account bestaat, bijvoorbeeld "Als dit adres bekend is, ontvang je een e-mail".
- Let ook op timingverschillen: voer de wachtwoordvergelijking ook uit (of simuleer de kosten) als het account niet bestaat.
- Beperk het aantal verzoeken per IP-adres op deze functies.

### References

- OWASP WSTG-IDNT-04: https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
- CWE-204: https://cwe.mitre.org/data/definitions/204.html
