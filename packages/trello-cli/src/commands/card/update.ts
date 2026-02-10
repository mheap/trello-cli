import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import * as chrono from "chrono-node";

export default class Update extends BaseCommand<typeof Update> {
  static description = "Update a card";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    name: Flags.string({ char: "n", description: "New name for the card" }),
    description: Flags.string(),
    due: Flags.string(),
    "clear-due": Flags.boolean({
      description: "Remove the due date",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const updates: Record<string, any> = {
      id: this.lookups.card,
    };

    if (this.flags.name) {
      updates.name = this.flags.name;
    }

    if (this.flags.description !== undefined) {
      updates.desc = this.flags.description;
    }

    if (this.flags["clear-due"]) {
      updates.due = "";
    } else if (this.flags.due) {
      const parsed = chrono.parseDate(this.flags.due);
      if (parsed) {
        updates.due = parsed.toString();
      } else {
        this.warn(`Could not parse due date: "${this.flags.due}"`);
        this.exit(1);
      }
    }

    // Only id is set — nothing to update
    if (Object.keys(updates).length <= 1) {
      this.warn(
        "No update flags provided. Use --name, --description, --due, or --clear-due."
      );
      this.exit(1);
    }

    const card = await this.client.cards.updateCard(updates as any);
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

  protected async format(data: any): Promise<string> {
    const labels =
      data.labels?.map((l: any) => l.name).filter(Boolean).join(", ") ||
      "None";
    return [
      `Name: ${data.name}`,
      `ID: ${data.id}`,
      `URL: ${data.url}`,
      `Due: ${data.due || "None"}`,
      `Labels: ${labels}`,
      `Description: ${data.description || "None"}`,
    ].join("\n");
  }
}
