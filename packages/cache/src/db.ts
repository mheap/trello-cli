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

  run(sql: string, args?: any) {
    args = args || [];
    return this.db.prepare(sql).run(...args);
  }

  upsert(table: string, data: any) {
    let sql = `REPLACE INTO ${table} `;
    sql += `(${Object.keys(data).join(", ")}) VALUES `;
    sql += `(${Object.values(data)
      .map((n) => "?")
      .join(", ")});`;
    return this.run(sql, Object.values(data));
  }
}

export default DB;
