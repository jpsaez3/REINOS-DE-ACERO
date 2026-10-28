# Reinos de Acero

Prototipo de la **Fase 1** de un RPG táctico medieval para un jugador. Interfaz en español, cuatro aventureros, seis razas y seis clases combinables sin restricciones. Un encuentro completo en el Paso Ceniza contra un combatiente, una arquera y un hechicero.

## Instalación y ejecución

Requisitos: Node.js 22.12 o superior (validado con 24.19) y npm.

```sh
npm ci
npm run dev
```

Desde la raíz del repositorio. Abre la dirección que indique Vite en tu navegador de escritorio. No requiere cuenta, claves ni servicios externos.

```sh
npm test          # pruebas del motor, incluida victoria y derrota completas
npm run build    # comprobación TypeScript y compilación de producción
npm run test:visual # arte, áreas, recursos y daño en Chromium
npm run test:narration # fases rivales, pausa, detalles y recuperación
npm run test:e2e # Chromium instalado en /usr/bin/chromium; Vite debe estar en puerto 5173
```

`npm run test:e2e` crea un grupo, mueve y ataca mediante controles visibles hasta la victoria, recarga y recupera la partida, comprueba errores del navegador y genera capturas en `/tmp`. La semilla de juego normal varía en cada encuentro; las pruebas del motor y la partida de navegador usan semillas fijas. Para otro Chromium, usa la variable no secreta `CHROMIUM_PATH`.

## Cómo jugar

1. Nueva partida: asigna nombre, raza, clase y atributos a cada integrante. Puedes repetir clases. Cambiar de clase restablece su distribución recomendada. No es necesario gastar todos los puntos.
2. Entra al paso. Las fichas superiores muestran iniciativa, vida y turno activo. Puedes consultar cualquier ficha desde ellas.
3. En tu turno, pasa el cursor por un destino para ver la ruta y pulsa para moverte. «Ayudas tácticas» muestra el área de movimiento y la cuadrícula si la necesitas. Selecciona ataque o habilidad y pulsa un objetivo. Los movimientos consumen distancia real del camino, no distancia directa.
4. Las habilidades personales se activan al pulsar su botón. Las demás necesitan un objetivo. Los botones y las casillas explican restricciones al pasar el cursor.
5. Finaliza el turno para continuar. Los enemigos actúan automáticamente. Click derecho en una ficha del mapa abre sus estadísticas.
6. Elimina a los tres enemigos para ganar. Si caen los cuatro aventureros, pierdes.

**Consejos:** el guerrero puede cerrar el paso central y proteger a un aliado adyacente; combina bendición y protección. Un disparo de sujeción prepara el golpe oportunista del pícaro. La escarcha reduce la movilidad enemiga y el centinela es vulnerable al frío. Las coberturas protegen a los atacantes de retaguardia.

## Guardado

Se guarda automáticamente después de cada cambio, incluidos turnos enemigos y el resultado final, en `localStorage` (`reinos-acero-v1`). Continuar recupera orden, estados, recursos, generador aleatorio y posiciones. Solo existe una ranura por navegador; una nueva expedición reemplaza la anterior al entrar en combate. El ritmo rápido/detallado se conserva en el navegador (`reinos-fast`). La pausa es temporal; al continuar una partida se reanuda el relato. No se transfieren partidas entre navegadores ni se recuperan datos borrados por el usuario.

## Organización

- `src/content.ts`: razas, clases, habilidades y progresión mediante datos.
- `src/engine.ts`: reglas, tablero, caminos, visibilidad, resolución, IA y serialización; sin React ni DOM.
- `src/main.tsx`: menú, creación, combate, configuración, ficha y secuencia visual.
- `src/combat-events.ts`: hechos estructurados, costes y efectos de cada acción.
- `src/ActionStory.tsx`: relato legible y resolución técnica de las acciones.
- `src/style.css`: diseño adaptable; símbolos y fuentes locales, sin recursos externos.
- `src/engine.test.ts`: pruebas de reglas y simulaciones completas.
- `e2e/play.mjs`: partida real en Chromium mediante Playwright.
- [REGLAS.md](REGLAS.md): reglamento completo del prototipo.
- [ARQUITECTURA.md](ARQUITECTURA.md): módulos y ampliación.

## Alcance actual

Un tablero, tres enemigos, dos habilidades por clase más ataque básico y poción; aliento adicional dracónico. Escenario ilustrado continuo sobre una cuadrícula lógica invisible, renderizado en React: permite foco, tooltips y pruebas de interacción sin acoplar el motor a Phaser. Sin alturas, exploración, campaña, diálogos, tienda, editor de equipo ni creación de mapas. Los equipos de clase son fijos; pociones son consumibles funcionales. Hay estructura de nivel 1–5 y un ascenso a nivel 2 tras ganar; no hay cinco niveles de contenido. No implementa el reglamento completo de D&D.

## Edición ilustrada

Incluye retratos pintados, ilustración del Paso Ceniza, fichas con marcos de facción, escenario de ruinas pintado como una imagen continua, indicadores de estado, daño y curación animados y avisos de las últimas acciones. Todo el arte está incluido en `public/art`; no se descarga de terceros al jugar. Los retratos representan seis arquetipos de clase y se reutilizan para las combinaciones de raza/clase y enemigos; todavía no existe un retrato único por combinación. Las preferencias del sistema para reducir movimiento se respetan.

Cada clase dispone de **dos habilidades** además del ataque básico; el coste de las áreas nuevas obliga a elegir cómo gastar los recursos. Puedes consultar la probabilidad de impacto, previsualizar áreas y leer pistas de las intenciones enemigas. Consulta el añadido al final de REGLAS.md para los costes y efectos exactos. Las partidas anteriores conservan compatibilidad; las nuevas habilidades se obtienen al actualizar la aplicación.

Para actualizar una instalación descargada como ZIP en Windows: detén la terminal anterior con Ctrl+C, descarga de nuevo desde GitHub y extrae en una carpeta nueva. Abre `cmd` en esa carpeta, ejecuta `npm ci` y después `npm run dev`. El guardado depende del navegador y del puerto: conserva ambos si quieres continuar la misma partida.

## Leer las acciones de cada personaje

Los rivales actúan por fases: buscan posición, se desplazan, anuncian una habilidad con su objetivo, muestran su resolución y cierran turno. No se pasa al siguiente paso mientras se está mostrando el actual. Las rutas y los enlaces entre atacante y objetivo se dibujan sobre el escenario. Las flechas explican una acción ya resuelta; no son proyectiles físicos ni modifican las reglas.

El panel «En curso» identifica al personaje y la acción, muestra PV antes/después, estados y costes reales. «Ver tiradas y resolución completa» abre los dados y los detalles. Usa **Pausar relato** para leer sin prisa y **Reanudar relato** para continuar. El botón **Ritmo** cambia entre detallado y rápido. Los mismos detalles se conservan agrupados en **Historial de acciones**; la última acción también queda disponible durante tu turno.

El mapa no muestra bordes de casillas por defecto. Las rutas aparecen al señalar un destino legal; los colores de área, al preparar una habilidad. La distancia y las colisiones siguen usando la cuadrícula del motor. «Ayudas tácticas» permite verla cuando necesites precisar una posición. Es el mismo encuentro del Paso Ceniza, no una campaña de mapas adicionales.

Los guardados anteriores siguen siendo compatibles. Guardar y recargar a mitad de un turno rival conserva si ya se desplazó o actuó: no repite el ataque. Las animaciones ya vistas no se vuelven a reproducir al cargar; sus resultados siguen en el historial.
