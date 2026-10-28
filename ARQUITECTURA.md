# Arquitectura

## Separación de responsabilidades

`content.ts` contiene tipos de atributos, catálogos de raza/clase, habilidades y umbrales. `engine.ts` es un módulo TypeScript sin dependencias de interfaz, reloj, DOM ni almacenamiento; recibe datos y modifica una instancia `Game`. `main.tsx` crea copias antes de cada transición para integrarlo con el estado de React. React renderiza la cuadrícula DOM/CSS, sin requerir Phaser para este tamaño de tablero. Un futuro renderizador puede consumir el mismo motor.

## Modelo

`Game` incluye versión, unidades, orden de iniciativa, índice de turno, ronda, registro, semilla, resultado y marca de recompensa. `Unit` conserva identidad, raza/clase independientes, seis atributos, PV, defensa, posición, economía de acciones, recursos, estados, nivel/PX, equipo e inventario. `Pos` concentra coordenadas; futuras alturas pueden añadirse a casillas sin mezclarlo con la presentación. `Status` almacena tipo y finales de turno pendientes.

Las habilidades son datos tipados: identificador, nombre, descripción, economía de acción, alcance, coste, objetivos, efecto, duración, condiciones y tipo de daño. `canUse` concentra validaciones antes de consumir recursos; `use` comparte resolutores de ataque, área, estado y curación. Algunas condiciones específicas (oportunismo, furia, carga dracónica) están expresadas en el motor; añadir un nuevo tipo de efecto requiere ampliar ese resolutor y sus pruebas, no crear lógica para cada personaje.

## Combate

`newGame` valida tamaño de grupo, clona datos, crea enemigos y tira iniciativa con desempate estable. Generador congruencial de 32 bits serializable: permite repetición exacta en pruebas y guardados. No es un generador criptográfico.

`reachable` usa BFS de cuatro vecinos con obstáculos, ocupación y zona protectora. Devuelve caminos completos para cobrar movimiento real. `lineOfSight` recorre las casillas con un algoritmo supercover de comparación entera y bloquea también contactos de esquina. No depende de píxeles ni del renderizador.

`defense`, `hurt`, `status` y `outcome` comparten cálculo de coberturas, resistencias, estados y final. `endTurn` descuenta estados y omite caídos; `begin` renueva movimiento y acciones. `aiDestination` evalúa destinos y `aiAction` elige una habilidad legal después de moverse. `aiStep` separa movimiento, acción y fin con `aiStage` persistido; `aiTurn` ejecuta las tres fases para simulaciones sin interfaz. La interfaz llama a `aiStep` con temporizadores cancelables, separados por el relato visual; no mantiene un motor de reglas paralelo.

## Persistencia y errores

`save` serializa; `load` valida versión, estructura básica, orden e integrantes. La interfaz utiliza `localStorage` tras cada transición y captura fallos de acceso/cuota; la partida actual sigue en memoria. El guardado es un dato local del usuario, no una entrada confiable para un servidor. La validación actual rechaza daños estructurales comunes; no es un esquema exhaustivo de importación de archivos. Para exportación/importación externa habría que ampliar la validación de todos los campos y límites.

## Añadir contenido

- Clase: catálogo con vida, defensa, movimiento, arma, atributo y habilidad; símbolo en interfaz; casos de prueba. Cualquier raza seguirá siendo válida.
- Habilidad con efecto existente: añadir dato y asociarlo a clase; conectar condiciones específicas solo si son necesarias.
- Estado/efecto nuevo: tipo, resolución, duración, etiqueta traducida y pruebas de interacción.
- Raza: catálogo y rasgo mecánico compartido; revisar las 36 combinaciones y ampliar prueba de producto cartesiano.
- Mapa: actualmente constante rectangular con `#` pared, `c` cobertura, `!` peligro y suelo. Convertir en catálogo y parametrizar consultas para múltiples encuentros en una fase posterior.
- Equipo: actualmente inventario de consumible y descripción de equipo por clase; un catálogo de objetos y competencias podrá reemplazar estadísticas de arma/defensa sin acoplarse a React.

## Validación

Vitest prueba reglas con semillas fijas, fallos/críticos, bloqueo, cobertura, estados, economía, combinaciones raciales, IA, victoria/derrota y round-trip de guardado. Playwright en `e2e/play.mjs` juega mediante controles reales; el planificador solo lee una copia del motor para elegir destinos y objetivos. No inyecta daño ni resultados. También comprueba recarga/continuación y errores JavaScript. Compilación mediante `tsc --noEmit` y Vite.

## Capa visual ilustrada y segunda habilidad

`public/art/heroes.png` es un atlas pintado de seis arquetipos; `Portrait` lo reutiliza mediante posicionamiento CSS, sin acoplar raza y clase en las reglas. `paso-ceniza.png` ilustra el menú y `terrain.png` contiene el atlas de terreno pintado. Son ilustraciones generadas para este proyecto; los originales de trabajo quedan fuera del checkout. Los enemigos comparten retrato de clase, con marco y tratamiento de color distintos.

`secondarySkills`/`classSkills` constituyen el catálogo compartido de habilidades aprendidas. Los campos opcionales `radius`, `die`, `attribute` y `healing` parametrizan el resolutor de áreas; el estado `mark` reduce defensa mediante el mismo cálculo que consume la tirada real. `hitChance` consulta `canUse` y `defense`; `enemyIntent` ofrece una pista heurística sin consumir RNG ni alterar estado.

La interfaz compara PV entre transiciones para efectos temporales de daño y curación; no los serializa. La previsualización de áreas utiliza exactamente radio, distancia Manhattan y línea de visión del motor. Las animaciones se desactivan con `prefers-reduced-motion`. No hay todavía animación esquelética, sonido ni retratos únicos para cada combinación de raza/clase.

## Eventos, relato y escenario continuo

`combat-events.ts` registra cada movimiento válido, habilidad resuelta o espera enemiga en un `CombatEvent`: actor, objetivo, posiciones, ruta real, cambios de PV/estados y costes. `logSequence` permite capturar las líneas de resolución aun cuando el registro técnico rote. El historial está limitado a 80 eventos, con identificadores monotónicos. Los rechazos de acciones no producen eventos. Los eventos son hechos ya resueltos, no comandos para volver a ejecutar.

`ActionStory.tsx` consume los hechos y sus líneas técnicas para presentar la acción. La interfaz encola los nuevos eventos, detiene la IA y los controles de acción durante la presentación, y permite pausar o acelerar. Pausar no cambia el combate. Al cargar, el cursor visual se coloca después del último evento conservado; `aiStage` determina qué parte lógica falta, evitando repetir daño. Los efectos temporales no pertenecen al guardado.

`courtyard.png` es una ilustración continua del patio, ajustada verticalmente para colocar las ruinas cerca de los obstáculos lógicos del tablero. Sus contornos artísticos no son un mapa de colisión a nivel de píxel: la única fuente de colisión sigue siendo `board`. La capa DOM no pinta suelos ni bordes, mantiene controles accesibles por coordenadas y usa el atlas únicamente para objetos de cobertura/brasas. El SVG superpuesto explica rutas y vínculos entre actor/objetivo. Las ayudas tácticas opcionales exponen las áreas lógicas exactas. El mapa conserva el encuentro y la navegación anteriores.

`e2e/narration.mjs` comprueba la carga del escenario, ausencia de bordes por defecto, ayudas opcionales, movimiento rival separado, anuncio con objetivo real, pausa sin cambios de estado, desglose de una habilidad, un ataque a distancia con trayectoria y recuperación a mitad de turno sin repetir la acción.
