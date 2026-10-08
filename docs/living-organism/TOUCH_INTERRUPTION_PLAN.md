# Touch jako przerwanie trwającej czynności — 2026-10-09

Kontekst: ApproachEpisode terminalnie kończy na dowolnym touch. Nowa kalibracja
motoru poprawia centrowanie, ale generuje wiele kontaktowych okien. Nie naprawimy
tego ogłaszając pierwszy kontakt sukcesem. Cel tego klocka: zachować możliwość
kontynuowania czynności po dotyku i ograniczyć uporczywe napieranie.

Bounded regulator obok istniejącego runtime: TouchInterruption.decide(PrivateFrame,
upstreamDemand). Nie zna koloru, XY ani ID; downstream nie otrzymuje host evidence.
Authored automat, bez twierdzenia o learned motivation lub rozpoznaniu przyczyny.
Tryby active -> quiet -> backoff/active. Pierwszy touch>.001 zeruje komendę na60ticków
(.5s). Upstream nadal może obserwować. Gdy ostatni touch był w ostatnich24tickach przy
końcu quiet, reverse drive.12 względem ostatniego aktywnego kierunku na42ticki(.35s),
bez skrętu/gaze, potem kolejne quiet60. Gdy touch wygasł, wraca świeża upstream komenda.
Nie ma terminalnego contact ani success. Brak zadeklarowanego kierunku -> backoff do tyłu.
To arbitralna polityka badawcza; może wycofać się w inną przeszkodę lub opóźnić czynność.
Zerowa komenda nie zatrzymuje pędu. Nie zakładamy prawidłowej semantyki sektorów touch.

Testy przed kodem: pojedynczy kontakt -> quiet -> fresh intent; sustained touch ->
backoff -> recovery; kierunek przeciw poprzedniemu drive także przy ruchu wstecz;
repeated sensor nie wydłuża przerwania; capture/restore alias-free w części backoff;
pełna kontynuacja physical fork po kontakcie. Nie dodawać do default runtime/checkpoint.

Benchmark ustalony przed wynikiem:36 nowych scen (pushable target, obstacle before target,
rear obstacle, target receding/stopping, occlusion, similar ×6 startów),18s, porównać
motor-only centering samo i z regulatorem. Wszystkie komendy/policy zapisywać 30Hz,
host pair impulse ocena poza brainem. Metryki: contact-positive sensory windows i
rzeczywisty sumowany impulse, droga/czas komend, coverage/kara bearing, resumptions,
zmiana po przerwaniu. Kontakt z celem nie jest sukcesem. Dotychczasowy terminalny
ApproachEpisode pozostaje osobnym counterexample, bez retuningu tego benchmarku.
Nie promować regulatora na podstawie jednego korzystnego kosztu; rozbić rodziny.

## Dodatkowe kontrpróby po pierwszym benchmarku
Pierwszy wynik:6237 ->655 touch windows,266 resumptions, ale0 backoff. Obstacle i
similar są bez ruchu z powodu visual mask; rear-obstacle nigdy nie dotknięty.
Te wyniki zostają. Dodatkowy mechaniczny zestaw27 przebiegów12s: front-force,
pinch-force, side-obstacle ×3 config ×continuous/interrupted/quiet-only.
Upstream stała drive.12, bez skrętu/gaze; to test regulatora, nie całego brainu.
Front wall x1.1/hx.05; pinch także rear x-1.08/hx.05, obie hy1. Side wall x2.5/y.9,
hx.18/hy.35 oraz turkusowy target x5/y-.2/0/.2. External force dla front/pinch .5/1.5/4,
side0. Quiet-only ma ten sam automat lecz zeruje reverse w backoff (ablation motoru).
Raport actual front/rear/target impulses, phases, wycofania i widoczność; nie promować
w razie nowego kontaktu z tyłu. Nie stroić amplitudy/czasów pod wynik.

## Wariant anulowania po przeciwległym dotyku
Challenge wywołał rear impulse5.41/2.48 przy wycofaniu (baseline i quiet-only0).
To nowa niekorzystna interakcja, nie dowód safety. Zachowano zamrożony regulator
w touch-interruption-baseline.ts oraz oryginalne wyniki. Nowy TouchInterruption ma
opcjonalne cancelOppositeTouch (domyślnie false). Przy backoff pamięta dominujący
sektor dotyku; gdy nowa próbka ma dowolny impuls>.001 w sektorze odległym kołowo
co najmniej3 z8, zeruje komendę i wraca do quiet60. Nie rozpoznaje przedmiotu.
Pierwszego kontaktu z nową przeszkodą nie przewiduje; istniejący pęd i externalforce
mogą działać dalej. Wybór przeciwległego sektora nie gwarantuje faktycznej przyczyny.
Nowe3 testy najpierw RED, potem GREEN. Cancellation policy/sector są w capture/restore.
Porównanie na36 mechanical runs:27 identycznych control +9 wariantu. To poprawka
na ujawnionym zestawie, nie unseen qualification. Nominalny backoff42ticki jest
na realnym sensory cadence4ticki wykonywany44ticki; progi nie retunowane.
