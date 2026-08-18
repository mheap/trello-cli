import { TrelloClient } from "trello.js";
import { moveParamsIntoBody, sendParamsInBody } from "../src/paramsInBody";

const longDescription = "這是一段很長的中文描述內容。".repeat(200);

describe("moveParamsIntoBody", () => {
  it("moves POST params into the body", () => {
    const config = moveParamsIntoBody({
      url: "/cards",
      method: "POST",
      params: { name: "Card", desc: "Description" },
    });

    expect(config.params).toEqual({});
    expect(config.data).toEqual({ name: "Card", desc: "Description" });
  });

  it("moves PUT params into the body", () => {
    const config = moveParamsIntoBody({
      url: "/cards/card123",
      method: "PUT",
      params: { desc: "Description" },
    });

    expect(config.params).toEqual({});
    expect(config.data).toEqual({ desc: "Description" });
  });

  it("keeps a long description out of the query string", () => {
    const config = moveParamsIntoBody({
      url: "/cards/card123",
      method: "PUT",
      params: { desc: longDescription },
    });

    expect(config.params).toEqual({});
    expect(config.data).toEqual({ desc: longDescription });
  });

  it("recognises lowercase methods", () => {
    const config = moveParamsIntoBody({
      url: "/cards",
      method: "post",
      params: { name: "Card" },
    });

    expect(config.data).toEqual({ name: "Card" });
  });

  it("leaves GET params in the query string", () => {
    const params = { fields: "name" };
    const config = moveParamsIntoBody({ url: "/cards/card123", method: "GET", params });

    expect(config.params).toBe(params);
    expect(config.data).toBeUndefined();
  });

  it("leaves DELETE params in the query string", () => {
    const params = { value: "label123" };
    const config = moveParamsIntoBody({ url: "/cards/card123/idLabels", method: "DELETE", params });

    expect(config.params).toBe(params);
    expect(config.data).toBeUndefined();
  });

  it("leaves a request that already carries a body alone", () => {
    const params = { name: "attachment.png" };
    const data = { pipe: () => undefined };
    const config = moveParamsIntoBody({
      url: "/cards/card123/attachments",
      method: "POST",
      params,
      data,
    });

    expect(config.params).toBe(params);
    expect(config.data).toBe(data);
  });

  it("drops undefined and null params, as the query serialiser does", () => {
    const config = moveParamsIntoBody({
      url: "/cards/card123",
      method: "PUT",
      params: { desc: "Description", name: undefined, due: null, closed: false },
    });

    expect(config.data).toEqual({ desc: "Description", closed: false });
  });

  it("leaves a request with no usable params alone", () => {
    const params = { name: undefined };
    const config = moveParamsIntoBody({ url: "/cards/card123", method: "PUT", params });

    expect(config.params).toBe(params);
    expect(config.data).toBeUndefined();
  });

  it("leaves a request without params alone", () => {
    const config = moveParamsIntoBody({ url: "/cards/card123", method: "DELETE" });

    expect(config.params).toBeUndefined();
    expect(config.data).toBeUndefined();
  });

  it("does not mutate the config it is given", () => {
    const original = {
      url: "/cards/card123",
      method: "PUT",
      params: { desc: "Description" },
    };
    moveParamsIntoBody(original);

    expect(original.params).toEqual({ desc: "Description" });
    expect(original).not.toHaveProperty("data");
  });
});

describe("sendParamsInBody", () => {
  it("routes sendRequest through the transform and returns its result", async () => {
    const sendRequest = jest.fn().mockResolvedValue({ id: "card123" });
    const client = { sendRequest } as unknown as TrelloClient;

    const returned = sendParamsInBody(client);
    const result = await client.sendRequest({
      url: "/cards/card123",
      method: "PUT",
      params: { desc: longDescription },
    });

    expect(returned).toBe(client);
    expect(result).toEqual({ id: "card123" });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      params: {},
      data: { desc: longDescription },
    });
  });

  it("passes the callback argument through", async () => {
    const sendRequest = jest.fn().mockResolvedValue(undefined);
    const client = { sendRequest } as unknown as TrelloClient;
    const callback = jest.fn();

    sendParamsInBody(client);
    await client.sendRequest({ url: "/cards", method: "POST", params: { name: "Card" } }, callback);

    expect(sendRequest.mock.calls[0][1]).toBe(callback);
  });
});
