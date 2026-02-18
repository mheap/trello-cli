import DB from "./db";
import Setup from "./setup";
import Sync from "./sync";

export default class {
  protected db: any;
  protected appKey: string;
  protected token: string;

  constructor(configDir: string, appKey: string, token: string) {
    this.db = new DB(configDir, "trello");
    this.appKey = appKey;
    this.token = token;
  }

  async bootstrap(): Promise<void> {
    const r = new Setup(this.db);
    return r.bootstrap();
  }

  async reset(): Promise<void> {
    const r = new Setup(this.db);
    return r.teardown();
  }

  async sync(): Promise<void> {
    this.reset();
    const sync = new Sync(this.db, this.appKey, this.token);
    return sync.run();
  }

  async getBoard(id: string): Promise<string> {
    const r = this.db.get("SELECT name FROM boards WHERE id=?", [id]);
    if (!r) {
      throw new Error(`Board [${id}] not found`);
    }
    return r.name;
  }

  async getList(id: string): Promise<string> {
    const r = this.db.get("SELECT name FROM lists WHERE id=?", [id]);
    if (!r) {
      throw new Error(`List [${id}] not found`);
    }
    return r.name;
  }

  async getBoardIdByName(name: string): Promise<string> {
    const r = this.db.get("SELECT id FROM boards WHERE name=?", [name]);
    if (!r) {
      throw new Error(`Board [${name}] not found`);
    }
    return r.id;
  }

  async getListIdByBoardAndName(board: string, name: string): Promise<string> {
    const r = this.db.get(
      "SELECT id FROM lists WHERE boardId=? AND (name=? OR id=?)",
      [board, name, name]
    );
    if (!r) {
      throw new Error(`List [${name}] not found on board [${board}]`);
    }
    return r.id;
  }

  async getLabelIdByName(name: string): Promise<string> {
    const r = this.db.get("SELECT id FROM labels WHERE name=? OR id=?", [
      name,
      name,
    ]);
    if (!r) {
      throw new Error(`Label [${name}] not found`);
    }
    return r.id;
  }

  async getLabelsByBoardAndColor(
    boardId: string,
    color: string,
    name?: string
  ): Promise<Array<{ id: string; name: string }>> {
    return name
      ? this.db.all(
          "SELECT id, name FROM labels WHERE boardId=? AND color=? AND name=?",
          [boardId, color, name]
        )
      : this.db.all(
          "SELECT id, name FROM labels WHERE boardId=? AND color=?",
          [boardId, color]
        );
  }

  async getLabelIdByBoardAndColor(
    boardId: string,
    color: string,
    name?: string
  ): Promise<string> {
    const rows = name
      ? this.db.all(
          "SELECT id FROM labels WHERE boardId=? AND color=? AND name=?",
          [boardId, color, name]
        )
      : this.db.all(
          "SELECT id FROM labels WHERE boardId=? AND color=?",
          [boardId, color]
        );
    if (!rows || rows.length === 0) {
      throw new Error(`Label with color [${color}] not found on board`);
    }
    if (rows.length > 1) {
      throw new Error(
        `Multiple labels with color [${color}] found on board. Use --text to disambiguate.`
      );
    }
    return rows[0].id;
  }

  async getUserIdByName(name: string): Promise<string> {
    const r = this.db.get("SELECT id FROM members WHERE username=?", [name]);
    if (!r) {
      return "";
    }
    return r.id;
  }

  async convertMemberIdsToEntity(ids: string[]): Promise<string> {
    const placeholder = ids.map((i) => "?").join(",");
    return this.db.all(
      `SELECT * FROM members WHERE id IN (${placeholder})`,
      ids
    );
  }

  async getListsOnBoard(id: string): Promise<string> {
    const r = this.db.all("SELECT id FROM lists WHERE boardId=?", [id]);
    return r.map((n: any) => n.id);
  }
}
