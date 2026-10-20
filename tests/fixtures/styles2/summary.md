Reportforge Security heeft in opdracht van Voorbeeldwebshop B.V. in de periode van 1 tot en met 12 september 2026 een penetratietest uitgevoerd op de webshop, het klantportaal, de onderliggende REST API en de publiek bereikbare infrastructuur. Doel van het onderzoek was vast te stellen in hoeverre een aanvaller zonder voorkennis, of met een regulier klantaccount, ongeautoriseerde toegang kan krijgen tot klantgegevens of de dienstverlening kan verstoren.

**Het algehele beveiligingsniveau is op dit moment onvoldoende.** Het onderzoek heeft acht bevindingen opgeleverd, waarvan één kritiek en twee hoog. De kritieke bevinding (F-01) maakt het voor iedere ingelogde klant mogelijk de orders, adressen en factuurgegevens van *alle* andere klanten in te zien door een ordernummer in de URL aan te passen. In combinatie met de ontbrekende rate limiting (F-05) is het eenvoudig om het volledige klantenbestand geautomatiseerd te downloaden. Dit raakt direct de AVG-verplichtingen van de organisatie.

De twee hoge bevindingen betreffen een SQL-injectie in de zoekfunctie van de storefront (F-02), waarmee de productdatabase en delen van de klanttabel uitgelezen kunnen worden, en een verouderde webserverversie in de DMZ met publiek bekende kwetsbaarheden (F-03).

Positief is dat de authenticatie zelf degelijk is ingericht: wachtwoorden worden goed opgeslagen, tweefactorauthenticatie is beschikbaar en de sessiecookies zijn correct geconfigureerd. De overige bevindingen zijn van middel- of laag niveau en betreffen vooral configuratie en hardening.

Wij adviseren F-01 en F-02 met de hoogste prioriteit (binnen twee weken) te verhelpen, de overige bevindingen in de eerstvolgende releasecyclus op te pakken en daarna een hertest uit te laten voeren.
