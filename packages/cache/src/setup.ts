import DB from "./db";

export default class {
  protected db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  bootstrap() {
    this.db.run("CREATE TABLE IF NOT EXISTS boards (id VARCHAR, mode INT);");
  }
}
