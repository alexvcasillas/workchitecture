if (!!!window.Worker) {
  throw new Error("You need an environment that supports using Web Workers");
}

const stateWorker = new Worker("./src/state/state.worker.js", {
  name: 'state',
});

const StateEvent = new CustomEvent('statechanged');

const listeners = {};

function addListener(identifier, properties, element, listener) {
  if (listeners.hasOwnProperty(identifier)) {
    throw new Error('Cannot register a listener with the same identifier as a previously registered');
  }
  listeners[identifier] = { element, properties, listener };
}

function removeListener(identifier) {
  if (!listeners.hasOwnProperty(identifier)) return;
  delete listeners[identifier];
}

function notifyListeners(model, data) {

  function matchSomeProps(listener, data) {
    let match = false;
    Object.keys(data).forEach(prop => {
      if (listeners[listener].properties.includes(prop)) {
        match = true;
      }
    });
    return match;
  }
  Object.keys(listeners).forEach(listener => {
    if (listener === model && matchSomeProps(listener, data)) {
      listeners[listener].listener(listeners[listener].element, data);
    }
  });
}


stateWorker.onmessage = ev => {
  const data = ev.data;
  switch (data.type) {
    case 'patch':
      if (data.code === 'OK') {
        console.log('ℹ️ [State Worker] Patch successfully applied');
        notifyListeners(data.model, data.data);
      } else {
        console.log('⚠️ [State Worker] Patch failed to apply');
      }
      break;
    case 'get':
      console.log('ℹ️ [State Worker] Get result: ', data);
      break;
  }
}

const nameElement = document.getElementById('user-name');
const changeUserElement = document.getElementById('change-user-name');

addListener('user', ['name'], nameElement, (el, data) => {
  el.innerText = data.name;
});

changeUserElement.addEventListener('click', () => {
  const newName = changeUserElement.dataset.name;
  changeUserElement.dataset.name = nameElement.innerText;
  stateWorker.postMessage({
    type: 'patch',
    model: 'user',
    patch: {
      name: newName,
    }
  });
});

stateWorker.postMessage({
  type: 'patch',
  model: 'user',
  patch: {
    name: 'Alex',
  }
});