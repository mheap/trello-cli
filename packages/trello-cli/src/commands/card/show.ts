import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Show extends BaseCommand<typeof Show> {
  static description = "Show card details";

  protected defaultOutput = "fancy" as const;

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const card = await this.client.cards.getCard({
      id: this.lookups.card,
    });
    this.output(card);
  }

  protected async toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      due: data.due,
      description: data.desc,
      labels: data.labels,
      url: data.url,
      members: await this.cache.convertMemberIdsToEntity(data.idMembers),
    };
  }

  protected async format(data: any): Promise<string> {
    const labels = data.labels?.map((l: any) => l.name).join(", ") || "None";
    const members =
      data.members?.map((m: any) => m.fullName).join(", ") || "None";
    const lines = [
      `Name: ${data.name}`,
      `ID: ${data.id}`,
      `URL: ${data.url}`,
      `Due: ${data.due || "None"}`,
      `Labels: ${labels}`,
      `Members: ${members}`,
      `Description: ${data.description || "None"}`,
    ];
    return lines.join("\n");
  }
}
