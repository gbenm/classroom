# ghclassroom

Es una CLI configurable para la calificación de
repositorios, permite enlazar **calificadores**
para evaluar y escribir los resultados.

## Características
- Comando para clonar repositorios personalizado
- Ejecución en paralelo (la cli no trabaja en paralelo,
pero lanza los comandos las veces especificadas,
por lo que desde la perspectiva de la cli es asíncrono)
- Capaz de filtrar que repositorios tomar en cuenta
- Permite acoplar un `grader` (se comunican por i/o)
    - ejecución por repositorio o un sólo proceso
- Permite acoplar un `writer` (se comunican por i/o)
    - se ejecuta como único proceso

## Instalar
```bash
npm install -g ghclassroom
```

## CLI
```bash
ghclassroom --help # ayuda de la cli
```

```sh
ghclassroom init # crea los archivos de configuración
```

```sh
ghclassroom # corre la cli con la configuración local
```


```sh
ghclassroom logs # permite hacer búsquedas en el log
```

## Configuración
Se recomienda visualizarlo en un editor que entienda
`javascript/typescript`, por ejemplo VSCode, ya que
le permite visualizar el tipado de la configuración
(lo siguiente son los tipos de la configuración,
no el archivo en sí).
```typescript

export type Command = string | {
  bin: string,
  args: CommandArg[]
}

export interface Config {
  // el archivo csv descargado desde Github Classroom
  classroomFile: string

  /*
    Si está en modo step ghclassroom va ejecutar
    las fases linealmente, es decir que aunque
    el repositorio ya esté disponible para ejecutar
    el evaluador este no lo hará hasta que todos
    estén clonados.

    Si está en el modo student ghclassroom ejecuta
    la siguiente etapa inmediatamente después de
    que la anterior termine, por ejemplo si ya
    se clonó el repositorio esté empezará con
    la evaluación y al terminar la evaluación
    seguirá con la escritura de los resultados,
    sin importar si hay todavía repositorios
    que no se han clonado o evaluado.
  */
  executeBy: "step" | "student"

  // Permite modificar el cómo se clona los
  // repositorios
  clone: {
    /*
      Permite describir como se va clonar, los comandos
      se unen a través de un newline, gracias a esto
      los comandos mantienen el mismo contexto

      Hay dos formas de describir un comando:
      1. escribe el comando como string ej: "mkdir -p temp"
      2. describe el comando
        - se debe especificar el binario
        - se listan los argumentos
        - los argumentos pueden ser estáticos (un string)
        o dinámicos si se utiliza una función, esta toma
        el contexto de los comandos y devuelve un
        string, ejemplo de estos son cloneDirectory,
        y los que se construyen a partir de las funciones
        para crear enlaces de git.
    */
    cmd: Command[]

    // debe devolver el directorio del respositorio
    // por lo que tenga cuidado de usar cd en el comando
    // para clonar ya que este directorio se crear
    // a partir de la posición actual
    getCloneDirectory: (student: Student) => string

    // muestra la salida de la clonación
    showOutput: boolean
  }

  // toma el continido de la fila en el archivo csv
  // y debería devolver un verdadero si se debe
  // tomar en cuenta
  filter?: (student: Student) => boolean

  // la cantidad de instancias de los procesos
  // que se lanzan, por ejemplo con el valor de 5
  // significa que se clonan 5 repositorios a la vez,
  // se evaluan 5 estudiantes a la vez (si es una sola
  // instancia el evaluador se envían uno de tras de otro)
  // y se envían 5 mensajes al proceso de escritura
  parallel: number

  // configuración del evaluador
  grader?: {
    // mismo concepto que clone.cmd.
    cmd: Command[]

    // Si es verdadero, se lanzará el comando
    // por cada repositorio, note que estará posicionado
    // en dicha carpeta.

    // Si es falso, se lanza una única vez el comando
    // y se posiciona en la carpeta dónde está ejecutando
    // ghclassroom.
    byStudent: boolean
  }

  // Como lanzar el proceso para escribir resultados,
  // este se ejecuta una única vez y se espera que
  // se mantenga vivo en todo el proceso.

  // El comadno se ejecuta en la misma carpeta
  // en la que se está ejecutando ghclassroom
  writer?: {
    cmd: Command[]
  }
}
```

### archivo de configuración
```javascript
/*
El archivo de configuración devuelve una función
con el objetivo que el usuario tenga algunas
utilidades a la mano.

Creación de links para clonar:
    entre las utilidades se encuentra createSSHUrlGit
    que devuelve un SSH URL válido, createPATUrlGit
    que devuelve un link que utiliza los personal
    access token para clonar, por lo que para obtener
    el enlace objetivo se puede utilizar los mismos para
    construirlos.

studentRepoUrl: este argumento de comando devuelve
el url que provee el csv.

cloneDirectory: este argumento de comando no debería
alterarse y debería ser usado, utiliza internamente
la función getCloneDirectory (definida por el usuario)
y le pasa el estudiante objetivo para obtener el directorio
que se va utilizar.

getCloneDirectory: es una implementación por defecto
para el directorio de clonación, que devuelve el
roster_identifier. En el caso del comando git clone
de toda la vida al no obtener nada clona el repositorio
con el nombre del mismo, pero esto puede no ser
siempre cierto por lo que valdría la pena implementar
tu propia función getCloneDirectory en caso de no
tener roster_identifier
*/
export const config = ({
    createSSHUrlGit,
    cloneDirectory,
    getCloneDirectory
}) => {
    return {
        // configuración
    }
}
```

## Grader
Este componente debe ser implementado por usted, para los
mensajes se puede utilizar el paquete de messaging
(si lo implementa con node.js).

```javascript
import { MessagingNode, MessageType } from "ghclassroom/messaging"

const inout = new MessagingNode(process.stdin, process.stdout)

inout.on("message", (message) => {
  // manejar la petición

  // ...

  // enviar una respuesta
  inout.sendMessage({
    tag: message.tag, // recuerde responder a la conversación
    type: MessageType.response,
    comment: "...",
    grade: 100
  })
})
```

> Lo de arriba expone el paquete `clroom-messaging`
> incluída en la CLI de ghclassroom.

En sí lo que debe soportar es leer y escribir JSON
por consola. La CLI ghclassroom soporta la lectura
sin importar si se envían newlines, lo que debe
cumplir es que sea un JSON válido (esto gracias a
[stream-json](https://www.npmjs.com/package/stream-json))
por lo que no se debe preocupar como imprimir a
pantalla. Por otro lado ghclassroom escribe en
la entrada de su evaluador en una sola línea
(se usa `JSON.stringify()` y se separan por medio
de un newline`\n` cada mensaje). El lenguaje para su
implementación queda a su criterio, pero tenga
en cuenta que debe ser posible arrancarlo por medio
de lo declarado en `config.grader.cmd`.

## Writer
Si el archivo en el que se van a escribir los
resultados es un CSV, te puede interesar:
[csvwriter](https://www.npmjs.com/package/csvw-cli),
para evitar trabajo extra :).

## Formato de peticiones
### Grader
```json
{
    "tag": "<identifica la comunicación>",
    "type": "request",
    "student": { ... }, // la fila del csv en forma de objeto
    "path": "/path/to/repo" // es absoluto
}
```
### Writer
```json
{
    "tag": "<identifica la comunicación>",
    "type": "request",
    "student": { ... }, // la fila del csv en forma de objeto
    "grade": 90, // el tipo depende del grader
    "comment": "..." // el tipo depende del grader
}
```

## Formato de respuestas

### Grader
```json
// error
{
    "tag": "<el tag que se envío>",
    "type": "error",
    "comment": "..."
}

// ok!
{
    "tag": "<el tag que se envío>",
    "type": "response",
    "grade": 90,
    "comment": "..." // se va mandar al writer
}
```

### Writer
```json
// error
{
    "tag": "<el tag que se envío>",
    "type": "error",
    "status": "...", // lo define el writer
    "missings": ["id"] // ver explicación en el paquete csvw-cli
}

// ok!
{
    "tag": "<el tag que se envío>",
    "type": "response",
    "status": "...", // lo define el writer
}
```

## Buscar en Log
Utilizando `ghclassroom logs` es posible buscar entre los diferentes logs. En pantalla aparecerá las fechas de los
logs con el más reciente encabezando la lista.

El log se crea por etapa, cuándo se `clona` un
repositorio es registrado en el log (aunque falle),
al igual que cuándo se `evalua` o se `escribe`, sin
embargo estos son omitidos si no son parte de la
configuración (ya que no se ejecutarían).

Un caso de uso pueda ser cuándo se evaluaron los
repositorios, pero el carnet del estudiante no fue
encontrado en el archivo dónde se está escribiendo,
esto se traduce a un fallo en la etapa de write, por
lo que aplicar los filtros `Paso = write` y
`Estado = failed` encontrará a estas situaciones,
y podrá ver por ende la nota aunque no se haya
escrito satisfactoriamente:
```javascript
{
  student: {
    assignment_name: '...',
    assignment_url: '...',
    starter_code_url: '...',
    github_username: 'gbenm',
    roster_identifier: '033',
    student_repository_name: '...',
    student_repository_url: '...',
    submission_timestamp: '',
    points_awarded: '0',
    points_available: '0'
  },
  step: 'write',
  grade: 96,
  writeStatus: 'not found',
  missings: [ "033" ],
  status: 'failed'
}
```
