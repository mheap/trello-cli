import * as querystring from "querystring";

const key = "KEY";
const token = "TOKEN";

var queryParameters = {
  actions: "none",
  cards: "all",
  card_fields: "all",
  card_attachments: "false",
  labels: "all",
  label_fields: "all",
  labels_limit: "1000",
  lists: "all",
  list_fields: "all",
  members: "all",
  member_fields: "all",
  membersInvited: "all",
  membersInvited_fields: "all",
  checklists: "all",
  checklist_fields: "all",
  organization: "true",
  organization_fields: "all",
  organization_memberships: "all",
  fields: "all",
};

import DB from "./db";
import Setup from "./setup";
(async function () {
  const db = new DB("/tmp/trello-db", "foo");
  const r = new Setup(db);
  r.bootstrap();

  return;
  let boards = (
    await get(
      "https://api.trello.com/1/members/me/boards?" +
        querystring.stringify({
          key,
          token,
        })
    )
  ).slice(0, 1);

  // Fetch each board with all details
  boards = await Promise.all(
    boards.map(async (b: any) => {
      return await get(
        "https://api.trello.com/1/boards/" +
          b.id +
          "?" +
          querystring.stringify({
            key,
            token,
            ...queryParameters,
          })
      );
      return b;
    })
  );

  console.log(JSON.stringify(boards));
})();

async function get(url: any): Promise<any> {
  const r = await fetch(url);
  return r.json();
}
