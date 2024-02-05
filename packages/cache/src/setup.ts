import DB from "./db";

export default class {
  protected db: DB;

  protected tables = {
    orgs: {
      id: "VARCHAR",
      displayName: "VARCHAR",
      creatorId: "VARCHAR",
    },
    boards: {
      id: "VARCHAR",
      name: "VARCHAR",
      orgId: "VARCHAR",
      creatorId: "VARCHAR",
      shortLink: "VARCHAR",
      closed: "INT",
    },
    lists: {
      id: "VARCHAR",
      name: "VARCHAR",
      boardId: "VARCHAR",
      closed: "INT",
    },
    cards: {
      id: "VARCHAR",
      name: "VARCHAR",
      boardId: "VARCHAR",
      listId: "VARCHAR",
      shortLink: "VARCHAR",
    },
    members: {
      id: "VARCHAR",
      username: "VARCHAR",
      fullName: "VARCHAR",
      initials: "VARCHAR",
    },
    labels: {
      id: "VARCHAR",
      name: "VARCHAR",
      boardId: "VARCHAR",
      color: "VARCHAR",
    },
  };
  constructor(db: DB) {
    this.db = db;
  }

  bootstrap() {
    Object.entries(this.tables).forEach(([table, fields]) => {
      let sql = `CREATE TABLE IF NOT EXISTS ${table}`;
      const columns: string[] = [];

      Object.entries(fields).forEach(([name, type]) => {
        let pKey = "";
        if (name == "id") {
          pKey = "PRIMARY KEY";
        }
        columns.push(`${name} ${type} ${pKey}`);
      });
      sql = `${sql} (${columns.join(", ")})`;

      this.db.run(sql);
    });
  }

  teardown() {
    Object.keys(this.tables).forEach((table) => {
      this.db.run(`DELETE FROM ${table}`);
    });
  }
}
