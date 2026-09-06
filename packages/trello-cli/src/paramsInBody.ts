import { RequestConfig, TrelloClient } from "trello.js";

const METHODS_THAT_ACCEPT_A_BODY = ["post", "put"];

// trello.js serialises every parameter into the query string, and Trello rejects
// URLs longer than roughly 8KB with a 414. Percent-encoding turns each CJK
// character into nine, so a description of around 880 Chinese characters is
// already enough to blow that limit.
//
// Trello accepts POST and PUT parameters in a JSON body just as readily, so
// writes travel in the body instead. Requests that already carry one — the
// multipart attachment upload, and the endpoints trello.js models with `data` —
// are left alone.
//
// Values keep their native JSON types here rather than being stringified the way
// the query serialiser would. Arrays, booleans, numbers and date strings were
// all checked against the API and behave identically. Object-valued parameters
// (`coordinates`, `cover`) were inconclusive, but no command sends one.
export function moveParamsIntoBody(config: RequestConfig): RequestConfig {
  const method = (config.method ?? "get").toLowerCase();

  if (!METHODS_THAT_ACCEPT_A_BODY.includes(method) || config.data !== undefined) {
    return config;
  }

  if (!config.params) {
    return config;
  }

  // The query serialiser skips empty values, so the body has to as well.
  const data = Object.fromEntries(
    Object.entries(config.params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );

  if (Object.keys(data).length === 0) {
    return config;
  }

  return { ...config, params: {}, data };
}

export function sendParamsInBody(client: TrelloClient): TrelloClient {
  // sendRequest is overloaded, which a spread call cannot satisfy directly.
  const sendRequest = client.sendRequest as (
    this: TrelloClient,
    config: RequestConfig,
    ...rest: any[]
  ) => unknown;

  client.sendRequest = function (
    this: TrelloClient,
    config: RequestConfig,
    ...rest: any[]
  ) {
    return sendRequest.call(this, moveParamsIntoBody(config), ...rest);
  } as typeof client.sendRequest;

  return client;
}
