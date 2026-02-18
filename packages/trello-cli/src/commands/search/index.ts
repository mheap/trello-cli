import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Search extends BaseCommand<typeof Search> {
  static description = "Search Trello";

  protected defaultOutput = "fancy" as const;

  static flags = {
    query: Flags.string({ required: true }),
    board: Flags.string(),
    type: Flags.option({
      options: ["cards", "boards", "organizations"] as const,
    })(),
  };

  async run(): Promise<void> {
    const params: Record<string, any> = {
      query: this.flags.query,
    };

    if (this.flags.board) {
      params.idBoards = this.lookups.board;
    }

    if (this.flags.type) {
      params.modelTypes = this.flags.type;
    }

    const results = await this.client.search.getSearch(params as any);
    this.output(results);
  }

  protected toData(data: any) {
    return {
      cards: (data.cards || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        url: c.url,
        board: c.idBoard,
      })),
      boards: (data.boards || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        url: b.url,
      })),
    };
  }

  protected async format(data: any): Promise<string> {
    const sections: string[] = [];

    if (data.boards.length > 0) {
      const boardLines = data.boards
        .map((b: any) => `  ${b.name} (ID: ${b.id})`)
        .join("\n");
      sections.push(`Boards:\n${boardLines}`);
    }

    if (data.cards.length > 0) {
      const cardLines = data.cards
        .map((c: any) => `  ${c.name} (ID: ${c.id})`)
        .join("\n");
      sections.push(`Cards:\n${cardLines}`);
    }

    if (sections.length === 0) {
      return "No results found";
    }

    return sections.join("\n\n");
  }
}
