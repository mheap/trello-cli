import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class CardAttach extends BaseCommand<typeof CardAttach> {
  static description = "Add an attachment to a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
    url: Flags.string({ required: true }),
    name: Flags.string(),
  };

  async run(): Promise<void> {
    const params: Record<string, any> = {
      id: this.lookups.card,
      url: this.flags.url,
    };

    if (this.flags.name) {
      params.name = this.flags.name;
    }

    const attachment = await this.client.cards.createCardAttachment(params as any);
    this.output(attachment);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      url: data.url,
    };
  }
}
