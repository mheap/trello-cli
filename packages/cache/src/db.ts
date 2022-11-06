import Database from "better-sqlite3";
import path from "path";

class DB {
  protected db: Database.Database;
  constructor(configDir: string, dbName: string) {
    this.db = new Database(path.join(configDir, `${dbName}.db`));
  }

  get(sql: string, params: Array<any>) {
    return this.db.prepare(sql).get(...params);
  }

  all(sql: string, params: Array<any>) {
    return this.db.prepare(sql).all(...params);
  }

  run(sql: string) {
    return this.db.prepare(sql).run();
  }
}

export default DB;
