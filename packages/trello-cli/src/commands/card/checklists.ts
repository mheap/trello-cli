import { BaseCommand } from "../../BaseCommand";
import { cardSelectorFlags } from "../../selectors";

export default class CardChecklists extends BaseCommand<typeof CardChecklists> {
  static description = "List checklists on a card";
  static selectorTarget = "card" as const;

  protected defaultOutput = "fancy" as const;

  static flags = {
    ...cardSelectorFlags(),
  };

  async run(): Promise<void> {
    const checklists = await this.client.cards.getCardChecklists({
      id: this.lookups.card,
    });
    this.output(checklists);
  }

  protected toData(data: any) {
    return data.map((cl: any) => ({
      id: cl.id,
      name: cl.name,
      items: cl.checkItems.map((i: any) => ({
        name: i.name,
        state: i.state,
      })),
    }));
  }

  protected async format(data: any): Promise<string> {
    if (data.length === 0) {
      return "No checklists";
    }
    return data
      .map((cl: any) => {
        const items = cl.items
          .map((i: any) => `  [${i.state === "complete" ? "x" : " "}] ${i.name}`)
          .join("\n");
        return `${cl.name}\n${items}`;
      })
      .join("\n\n");
  }
}
