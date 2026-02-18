import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardLabel extends BaseCommand<typeof CardLabel> {
  static description = "Add a label to a card";

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    card: Flags.string({ required: true }),
    label: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const labelId = await this.cache.getLabelIdByName(this.flags.label);
    const result = await this.client.cards.addCardLabel({
      id: this.lookups.card,
      value: labelId,
    });
    this.output(result);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      labels: data.labels,
    };
  }
}
