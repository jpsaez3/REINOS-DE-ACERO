# Reglamento del Paso Ceniza — versión 1

Sistema propio para el prototipo. No reproduce D&D 5e.

## Personajes y atributos

Cuatro integrantes. Seis razas y seis clases, todas las 36 combinaciones legales, sin límites por composición. Los atributos comienzan en 8; hay 27 puntos. Subir hasta 13 cuesta 1 por incremento; 14 y 15 cuestan 2 cada uno. Rango inicial 8–15; pueden quedar puntos sin gastar. El modificador es `floor((valor - 10) / 2)`.

Fuerza rige ataques de guerrero y bárbaro; Destreza los de pícaro y explorador, además de iniciativa. Inteligencia rige ataques y escarcha del mago. Sabiduría rige ataques y curación del clérigo. Constitución añade dos veces su modificador a la vida y modifica el aliento. Carisma se conserva en el modelo y la ficha; no afecta al combate de esta fase. Las razas no modifican atributos.

| Clase      | Vida base | Defensa | Movimiento | Alcance básico | Dado de daño |
| ---------- | --------: | ------: | ---------: | -------------: | -----------: |
| Guerrero   |        24 |      15 |          4 |              1 |           d8 |
| Bárbaro    |        28 |      12 |          5 |              1 |          d10 |
| Pícaro     |        18 |      14 |          6 |              1 |           d6 |
| Mago       |        14 |      11 |          4 |              6 |           d6 |
| Clérigo    |        21 |      14 |          4 |              4 |           d6 |
| Explorador |        20 |      13 |          5 |              7 |           d8 |

Vida máxima = base + 2 × modificador de Constitución + bonificación racial. Todos comienzan con tres recursos de clase y una poción. No se regeneran durante el encuentro. Armadura y arma están incorporadas a los datos de clase: no hay suma adicional del equipo ni modificador de Destreza a la defensa.

## Razas

- **Humano:** un recurso adicional. La competencia adicional se representa con versatilidad en armas básicas; el prototipo solo ofrece su equipo de clase, por lo que no hay una selección de competencias.
- **Elfo:** un movimiento adicional. Reduce en un turno la duración de ralentizaciones mágicas.
- **Enano:** +3 vida, mitad de daño de veneno y +1 defensa al estar adyacente a una cobertura.
- **Mediano:** +1 defensa. Repite una vez por encuentro el primer 1 natural de ataque; la segunda tirada se conserva aunque también sea 1.
- **Orco:** la primera vez que un golpe lo reduce a cero queda con 1 PV. Se agota por encuentro.
- **Dracónido:** mitad de daño de fuego y un aliento de fuego por encuentro. No consume recurso de clase, sí acción.

La división de daño por resistencia redondea hacia abajo. No hay penalizaciones de atributo raciales.

## Tablero, caminos y visión

Cuadrícula ortogonal 14 × 10, sin diagonales. Distancia Manhattan para ataques, efectos y movimiento. Una casilla equivale a una unidad; no hay alturas en esta versión. Paredes y coberturas son intransitables. Unidades vivas bloquean movimiento; caídas no. Búsqueda en anchura para caminos más cortos; cada paso consume un punto. Movimiento se puede dividir alrededor de una acción.

Las paredes bloquean línea de visión; un rayo que roza una esquina de pared tampoco pasa. Las coberturas son bajas: no bloquean visión, pero dan +2 defensa contra ataques de distancia mayor a 1 a unidades ortogonalmente adyacentes. Paredes representan cobertura total e impiden ataques y hechizos. Los ataques a distancia funcionan en cuerpo a cuerpo sin penalización adicional. Las brasas infligen 3 de fuego cada vez que se entra, incluso en medio de un camino. No se puede seguir caminando tras caer.

## Iniciativa y acciones

Iniciativa: d20 + modificador de Destreza. Mayor primero; empate por mayor Destreza total y después identificador en orden lexicográfico ascendente. El orden no cambia durante el encuentro. Se omiten los caídos. Al recorrer el orden se incrementa la ronda.

Cada turno concede movimiento de clase/raza y una acción principal. No se acumulan. No hay acción adicional salvo que una habilidad la conceda (Furia). Poción consume acción principal, o adicional si hay una. Guardia concede una reacción de represalia por turno propio. La IA consume exactamente las mismas acciones y recursos a través del mismo motor. Una acción inválida no consume nada.

## Ataques y daño

Ataque: d20 + 2 + modificador del atributo de clase contra defensa efectiva. 1 natural falla; 20 natural impacta siempre y añade un dado de arma adicional. Daño: dado de arma + máximo(0, modificador) + efectos. El dado adicional del golpe oportunista no se duplica con crítico. Defensa efectiva = defensa base + bendición + protección + cobertura + robustez situacional − penalización de furia. Las bonificaciones de distintos tipos se acumulan; varias protecciones no se acumulan entre sí.

Ataques básicos de mago hacen fuego, los de clérigo radiante; el resto físico. El centinela recibe el doble de daño de frío. Furia reduce daño físico a la mitad. Se registran tiradas, modificadores de ataque, defensa efectiva, desglose de daño de armas y daño final tras resistencias. Los efectos de área infligen daño directo sin tirada de ataque; por ello no tienen críticos ni fallos.

## Habilidades y estados

Todas requieren un objetivo vivo, alcance y visión; salvo las personales, cuyo objetivo es el actor. Las áreas solo afectan enemigos, no dañan aliados. Nunca resucitan caídos. Cada habilidad distintiva cuesta una acción y un recurso.

| Clase      | Habilidad             | Efecto                                                                                                                                                                                                                                   |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guerrero   | Postura protectora    | Hasta terminar su siguiente turno, +2 defensa a aliados adyacentes. Enemigos a distancia 1 no pueden dar un paso que los aleje a más de 1. Una represalia de 3 físico tras un impacto enemigo si el agresor está adyacente al protector. |
| Bárbaro    | Furia                 | Durante el turno actual y los dos siguientes: +3 daño físico, mitad de daño físico recibido, −2 defensa. Concede una acción adicional para una poción solo al activarse. No se puede renovar mientras esté activa.                       |
| Pícaro     | Golpe oportunista     | Ataque a alcance 1 con +d6 si objetivo inmovilizado o junto a otro aliado vivo del pícaro.                                                                                                                                               |
| Mago       | Estallido de escarcha | Alcance 5; d6 + Inteligencia a objetivo y enemigos adyacentes ortogonales, si hay visión desde el centro. Ralentiza dos turnos del afectado: −2 movimiento, mínimo 1.                                                                    |
| Clérigo    | Bendición sanadora    | Alcance 4; cura d6 + máximo(0, Sabiduría), sin superar vida máxima; +2 defensa durante dos turnos del afectado. Puede usarse sobre uno mismo.                                                                                            |
| Explorador | Disparo de sujeción   | Ataque a alcance 7; al impactar inmoviliza dos turnos del afectado.                                                                                                                                                                      |

Aliento dracónico: una acción y una carga, alcance 3; d6 + máximo(0, Constitución) de fuego al objetivo y enemigos a distancia 1 del centro con visión. Poción: cura 8, una por personaje; se consume del inventario.

Los estados se descuentan al finalizar el turno de quien los tiene. Si se aplican sobre uno mismo, el turno actual cuenta salvo que la duración indique expresamente los siguientes (guardia y furia). Reaplicar un estado conserva la duración mayor, no duplica su efecto. Inmovilización impide movimiento pero permite acciones. Ralentización y otros estados se aplican aunque el daño haya sido resistido. Las duraciones visibles muestran finales de turno pendientes.

**Cooperación verificable:** sujeción habilita golpe oportunista sin necesidad de otro aliado adyacente. Bendición y protección se acumulan para sostener a un defensor o proteger a un mago. Escarcha mantiene enemigos lejos de un explorador; el bloqueo del guerrero impide que rodeen a su retaguardia.

## IA

Combatiente busca reducir distancia y usa protección si no puede atacar. Arquera busca distancia aproximada 4, visión y cobertura; utiliza sujeción mientras tenga recursos. Hechicero busca una posición de disparo y usa escarcha mientras tenga recursos, después ataque básico. Los tres evalúan posiciones alcanzables, penalizan brasas, prefieren caminos cortos y priorizan objetivos débiles/cercanos. No conocen ni modifican tiradas futuras. No hay búsqueda estratégica a varios turnos ni dificultad adaptativa.

## Final, equipo y progresión

Cero PV significa caído y sin turno. Victoria al no quedar enemigos vivos; derrota al no quedar aventureros vivos. La derrota tiene prioridad si no quedase nadie. Los enemigos comienzan al 80% de la vida derivada de su clase, redondeado hacia abajo.

Cada aventurero tiene un arma/armadura de clase fija; el guerrero incluye escudo. No hay edición de equipo ni accesorios funcionales en esta fase. El consumible de curación sí modifica vida y desaparece del inventario.

Victoria concede 100 PX a todos una sola vez. Umbrales preparados para niveles 1–5: 0, 100, 300, 600 y 1000. Ascenso añade 4 de vida máxima y recupera hasta 4 PV si el personaje sigue vivo. El encuentro solo permite alcanzar nivel 2; no se implementan habilidades de niveles posteriores. No se inicia otra batalla conservando progresión: una nueva partida crea una expedición nueva.

## Persistencia

Una ranura versionada local conserva semilla del generador pseudoaleatorio, iniciativa, turno, ronda, posiciones, vida, estados, recursos, equipo, inventario, experiencia y resultado. Continuar no repite tiradas ni turnos ya guardados. No admite archivos ajenos ni garantiza compatibilidad con futuras versiones; los guardados incompatibles muestran error.

## Edición ilustrada: nuevas decisiones tácticas

Cada clase dispone también de una segunda habilidad. Comparte la misma acción principal y reserva de recursos con la primera: no concede una acción adicional.

| Clase      | Habilidad         | Coste | Resolución                                                                                                                                              |
| ---------- | ----------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guerrero   | Golpe de escudo   |     1 | Ataque a alcance 1 con el dado de su arma. Si impacta, inmoviliza hasta finalizar el próximo turno del objetivo. Permite preparar un golpe oportunista. |
| Bárbaro    | Barrido de acero  |     2 | Centro enemigo a alcance 1; d6 + máximo(0, Fuerza + bonificación de furia) físico por enemigo a distancia 1 del centro. Daño directo, sin crítico.      |
| Pícaro     | Revelar debilidad |     1 | Alcance 4; aplica Expuesto: −2 defensa durante dos turnos del objetivo. Reaplicar renueva duración, no acumula penalización.                            |
| Mago       | Orbe de fuego     |     2 | Alcance 5; d8 + máximo(0, Inteligencia) de fuego por enemigo en radio Manhattan 2. Daño directo.                                                        |
| Clérigo    | Luz del alba      |     2 | Alcance 4; d6 + máximo(0, Sabiduría) radiante por enemigo a distancia 1. Cura 3 a cada aliado vivo en esa misma área, hasta su vida máxima.             |
| Explorador | Lluvia de flechas |     2 | Alcance 6; d4 + máximo(0, Destreza) físico por enemigo en radio Manhattan 2. Daño directo.                                                              |

Las áreas requieren visión hacia el centro y desde el centro a cada afectado. No atraviesan paredes ni dañan aliados; no utilizan la defensa del objetivo y no producen críticos. Cada afectado recibe su propio dado de daño. En cambio, Golpe de escudo hace una tirada de ataque normal.

La interfaz ilumina los objetivos legales para la acción elegida. Pasar sobre un objetivo muestra defensa efectiva y probabilidad base de impacto (incluye críticos y fallo natural, no incluye la repetición de suerte mediana). Efectos directos muestran 100% cuando son legales. Las áreas se previsualizan al pasar sobre un centro válido. Las pistas enemigas son orientativas: la IA vuelve a evaluar después de moverse; no son acciones bloqueadas o garantizadas.

## Presentación por fases y cuadrícula oculta

El escenario continuo es una representación visual del mismo tablero ortogonal. Ocultar sus líneas no cambia el movimiento, la distancia, las paredes ni las coberturas. Las ayudas tácticas se pueden activar para consultar la geometría exacta. Los trazos de ruta muestran el camino real utilizado por la búsqueda de caminos.

La IA conserva su estrategia y economía: ahora resuelve desplazamiento, acción y fin de turno en pasos separados. La habilidad anunciada después del desplazamiento se calcula con el mismo selector que la ejecuta. Cada paso resuelto se guarda antes de avanzar al siguiente. La pausa y el ritmo solo afectan a la presentación; no consumen recursos ni repiten tiradas. No se permite realizar otra acción durante la presentación de la anterior.

## Ejecución visual de las acciones

Las animaciones siguen el resultado de las reglas: caminar no concede movimiento adicional y los proyectiles no realizan tiradas extra. Lluvia de flechas dibuja varias flechas, pero el daño sigue siendo una resolución por enemigo afectado, según su descripción. El fuego y el hielo tampoco infligen daño por cada partícula. Una flecha de un ataque fallido se desvía sin quitar vida.

Los PV mostrados y los efectos se revelan al impactar; el guardado conserva la acción ya resuelta para evitar duplicados tras una recarga. El modo rápido y el movimiento reducido no cambian alcance, recursos, estados, vida ni resultados. La pausa congela el progreso visual y no reinicia los pasos al reanudar.
