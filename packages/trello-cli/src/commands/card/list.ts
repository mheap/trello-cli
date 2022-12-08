import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class List extends BaseCommand<typeof List> {
  static description = "List all cards in a list";

  protected defaultOutput: string = "fancy";

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const cards = await this.client.lists.getListCards({
      id: this.lookups.list,
    });
    this.output(cards);
  }

  protected toData(data: any) {
    return data.map((d: any) => {
      return {
        id: d.id,
        name: d.name,
        description: d.desc,
        due: d.due,
        closed: d.closed,
        url: d.url,
      };
    });
  }

  protected format(data: any): Promise<string> {
    return data
      .map((b: any) => {
        return `${b.name} (ID: ${b.id})`;
      })
      .join("\n");
  }
}
