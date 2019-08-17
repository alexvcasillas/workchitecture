const state = {};

function patchState(model, patch) {
  if (typeof state[model] === 'undefined') {
    state[model] = {};
  }
  Object.keys(patch).forEach((value, index) => {
    state[model][value] = patch[value];
  });
  postMessage({
    type: 'patch',
    code: 'OK',
    model: model,
    data: patch
  });
}

function getState(model, properties) {
  if (typeof model === 'undefined')
    throw new Error('You need to specify a model to retrieve properties from');

  if (typeof properties !== 'undefined' && Array.isArray(properties)) {
    if (!state[model]) {
      postMessage({
        type: 'get',
        model: model,
        data: null,
      })
      return;
    }
    // Return only the given properties in the array
    const mappedObj = properties.reduce((prev, current, index) => {
      const mapped = {...prev};
      mapped[current] = state[model][current];
      return mapped;
    }, {});
    postMessage({
      type: 'get',
      model: model,
      data: mappedObj,
    });
  } else if (typeof properties !== 'undefined' && !Array.isArray(properties)) {
    // Throw error because properties is not an array type
    throw new Error('Your need to pass an array as the [properties] argument of the getState function call');
  } else {
    // Return all of the properties of the model because no properties argument present
    postMessage({
      type: 'get',
      model: model,
      data: state[model],
    });
  }
}


onmessage = function onMessage(e) {
  const data = e.data;
  switch (data.type) {
    case 'patch':
      self.console.log('ℹ️ [State Worker] Patch state received.');
      patchState(data.model, data.patch);
      break;
    case 'get':
      self.console.log('ℹ️ [State Worker] Get state received.');
      getState(data.model, data.properties);
      break;
  }
}