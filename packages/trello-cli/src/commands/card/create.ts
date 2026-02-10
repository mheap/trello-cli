import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import * as chrono from "chrono-node";

export default class Create extends BaseCommand<typeof Create> {
  static description = "Create a card";

  static flags = {
    name: Flags.string({ char: "n", required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    position: Flags.option({ options: ["top", "bottom"] as const, default: "bottom" })(),
    label: Flags.string({ multiple: true }),
    due: Flags.string(),
    description: Flags.string(),
  };

  async run(): Promise<void> {
    this.flags.label = this.flags.label || [];

    // Convert label name to ID
    const idLabels = await Promise.all(
      this.flags.label.map(async (l) => {
        return this.cache.getLabelIdByName(l);
      }) as any
    );

    let dueDate = null;
    if (this.flags.due) {
      const parsed = chrono.parseDate(this.flags.due);
      if (parsed) {
        dueDate = parsed.toString();
      } else {
        this.warn(`Could not parse due date: "${this.flags.due}"`);
        this.exit(1);
      }
    }

    const card = await this.client.cards.createCard({
      idList: this.lookups.list,
      name: this.flags.name,
      desc: this.flags.description,
      due: dueDate!,
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
