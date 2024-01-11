const https = require("https");
import * as querystring from "querystring";

var queryParameters = {
  cards: "all",
  card_fields: "id,closed,idBoard,idList,name,shortLink",
  card_attachments: "false",
  labels: "all",
  label_fields: "all",
  labels_limit: "1000",
  lists: "all",
  list_fields: "all",
  members: "all",
  organization: "true",
  organization_fields: "id,displayName,idMemberCreator",
  fields:
    "id,name,closed,idOrganization,pinned,starred,url,shortLink,idMemberCreator",
};

export default class {
  protected db: any;
  protected appKey: string;
  protected token: string;

  constructor(db: any, appKey: string, token: string) {
    this.db = db;
    this.appKey = appKey;
    this.token = token;
  }

  async run() {
    return this.process(await this.getBoards());
  }

  protected async process(data: any): Promise<any> {
    let board;
    for (board of data) {
      try {
        await this.processBoard(board);
        await this.processLists(board.lists);
        await this.processCards(board.cards);
        await this.processMembers(board.members);
        await this.processOrg(board.organization);
      } catch (e) {
        console.error("Error processing board", board);
        throw e;
      }
    }
  }

  protected async processOrg(org: any): Promise<any> {
    // Insert into boards
    return this.db.upsert("orgs", {
      id: org.id,
      displayName: org.displayName,
      creatorId: org.idMemberCreator,
    });
  }

  protected async processBoard(board: any): Promise<any> {
    // Insert into boards
    await this.db.upsert("boards", {
      id: board.id,
      name: board.name,
      orgId: board.idOrganization,
      creatorId: board.idMemberCreator,
      shortLink: board.shortLink,
      closed: board.closed ? 1 : 0,
    });
    return this.processLabels(board.labels);
  }

  protected async processLabels(labels: any): Promise<any> {
    for (let label of labels) {
      await this.db.upsert("labels", {
        id: label.id,
        name: label.name,
        boardId: label.idBoard,
        color: label.color,
      });
    }
  }

  protected async processLists(lists: any): Promise<any> {
    for (let list of lists) {
      await this.db.upsert("lists", {
        id: list.id,
        name: list.name,
        boardId: list.idBoard,
        closed: list.closed ? 1 : 0,
      });
    }
  }

  protected async processCards(cards: any): Promise<any> {
    for (let card of cards) {
      await this.db.upsert("cards", {
        id: card.id,
        name: card.name,
        boardId: card.idBoard,
        listId: card.idList,
        shortLink: card.shortLink,
      });
    }
  }

  protected async processMembers(members: any): Promise<any> {
    for (let member of members) {
      await this.db.upsert("members", {
        id: member.id,
        username: member.username,
        fullName: member.fullName,
        initials: member.initials,
      });
    }
  }

  protected async getBoards() {
    let boards = await this.api("/members/me/boards");

    // Fetch each board with all details
    return await Promise.all(
      boards.map(async (b: any) => {
        return await this.api("/boards/" + b.id, queryParameters);
      })
    );
  }

  async api(url: string, options?: object): Promise<any> {
    return this.get(`https://api.trello.com/1${url}`, options);
  }

  async get(url: any, options?: object): Promise<any> {
    options = options || {};
    const key = this.appKey;
    const token = this.token;
    return new Promise(function (resolve, reject) {
      const https = require("https");

      url =
        url +
        "?" +
        querystring.stringify({
          key,
          token,
          ...options,
        });

      https
        .get(url, (resp: any) => {
          let data = "";

          // A chunk of data has been received.
          resp.on("data", (chunk: any) => {
            data += chunk;
          });

          // The whole response has been received. Print out the result.
          resp.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              return reject(e);
            }
          });
        })
        .on("error", (err: any) => {
          return reject(err);
        });
    });
  }
}
