
# Core modules

## Program
A program is just a generator with effects

```js
// program :: Program<IOEffect, ConsoleEffect> String -> ()
const program = function *(greetText) {
  const name = yield IOEffect.getInput('What is your name?');
  yield ConsoleEffect.log('>> Name', name);
  yield IOEffect.showMessage(`Hello, ${name}! ${greetText}`);
};
```


## createEffect
Create effect allows you to write your own custom effects

```haskell
createEffect :: (String, Object FuncDescription) -> Effect
```


## func
Describe your function signature. The only validation is for the length of arguments, the rest of the data is purely for documentation.

```haskell
func :: ([String], String) -> FuncDescription
```

```js
func(['a', 'b'], 'result');
func(['id', '?options'], 'user'); // Optional parameters
func(['message', '...ids']); // Spread parameters + no return value
func(); // Any number of arguements + no return value
func([]); // 0 arguements + no return value
```



## Effect.handler
Lets you define handlers to your effect and creates a runner.

```haskell
type Handler = FlowOperators -> (...a) -> ();

Effect.handler :: Object Handler -> Runner
```

### FlowOperators

There are 3 flow operators that you can use to control the flow of your program.
* `resume` allows you to continue the execution of your program. Passing a value to it will become the return value of the halted operation.
* `end` allows you to end your program and resolve with a value.
* `throwError` allows you to end your program and reject with an error.

### Using handlers

```js
const withMyEff = MyEffect.handler({
  increment: ({ resume }) => (a) => resume(a + 1), // Will increment and return a + 1 after the yield
  imDone: ({ end }) => (a) => end(a), // Will end the program and return a
  throw: ({ throwError }) => () => throwError(new Error()), // Will throw out of the program for you to catch
  _: ({ end }) => a => end(a), // Default behavior. This will be called for any yielded value thats not an effect operation and at the end of the program.
});
```



## Composing effects and handlers

To compose handlers, you can use the `concat` method or the `composeHandlers` function.
You can also compose entire effects using `composeEffects` function which is used in a similar way.

```js
import { createEffect, composeHandlers } from 'algebraic-effects';

const ApiEffect = createEffect('ApiEffect', { search: func(['q']) });
const ConsoleEffect = createEffect('ConsoleEffect', { log: func(['...data']) });

const withApi = ApiEffect.handler({
  search: ({ resume, throwError }) => q =>
    fetch(`/search?q=${q}`).then(resume).catch(throwError),
});

const withConsole = ConsoleEffect.handler({
  log: ({ resume }) => (...data) => resume(console.log(...data)),
});

function* searchUsers(query) {
  const users = yield ApiEffect.search(query);
  yield ConsoleEffect.log('Users', users);
  yield users.map(user => user.name);
}

// Now compose the handlers as ...

const names = await withConsole.concat(withApi).run(searchUsers, 'Akshay');

// OR

const handler = withConsole.concat(withApi);
const names = await handler(searchUsers, 'Akshay');

// OR

const handler = composeHandlers(withConsole, withApi);
const names = await handler(searchUsers, 'Akshay');
```




## Putting it all to use

### Create your own Effect for I/O
In the example below, we have created a I/O effect with the operations `getInput` and `showMessage`. The behavior of those operations are not defined with the type as this just acts as the interface marking control flow to the actual effect.

You can write your program without worrying about the behavior of those effects.

You can then call the `handler` method to attach behavior/control flow to the operations.

```js
const IOEffect = createEffect('IOEffect', {
  getInput: func(['label'], 'name'),
  showMessage: func(['message']),
});

// greetUser :: Program<IOEffect> String ()
function* greetUser(greetText) {
  const name = yield IOEffect.getInput('What is your name?'); // Will show the modal to a user and halt the execution till the user submits their response.
  yield IOEffect.showMessage(`Hello, ${name}! ${greetText}`);
}

// io :: Runner
const withIO = IOEffect.handler({
  // Some showModal function that accepts an onSubmit callback
  getInput: ({ resume }) => label => showModal({ label, onSubmit: resume }),
  showMessage: ({ resume }) => message => {
    // Some renderMessage function that renders a text
    renderMessage(message);
    resume();
  };
});

withIO(greetUser, 'Welcome!');
// Shows a modal with the text "What is your name?" and an input form.
// When you click on the submit, it renders a message that reads. "Hello Akshay! Welcome!"
```