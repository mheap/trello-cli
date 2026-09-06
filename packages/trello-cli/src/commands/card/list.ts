import { BaseCommand } from "../../BaseCommand";
import { listReferenceFlags } from "../../selectors";

export default class List extends BaseCommand<typeof List> {
  static description = "Show all cards in a list";
  protected defaultOutput = "fancy" as const;

  static flags = {
    ...listReferenceFlags(),
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
        labels: d.labels,
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
