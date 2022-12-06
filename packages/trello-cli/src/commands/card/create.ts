import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Create extends BaseCommand<typeof Create> {
  static description = "Create a card";

  static flags = {
    name: Flags.string({ char: "n", required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    position: Flags.enum({ options: ["top", "bottom"], default: "bottom" }),
    label: Flags.string({ multiple: true }),
  };

  async run(): Promise<void> {

    // Convert label name to ID
    let idLabels = await Promise.all(
      this.flags.label?.map(async (l) => {
        return this.cache.getLabelIdByName(l);
      }) as any
    );

    const card = await this.client.cards.createCard({
      idList: this.lookups.list,
      name: this.flags.name,
      pos: this.flags.position as "top" | "bottom",
      idLabels,
    });

    this.output(card);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      due: data.due,
      description: data.desc,
      labels: data.labels,
      url: data.url,
    };
  }
}
