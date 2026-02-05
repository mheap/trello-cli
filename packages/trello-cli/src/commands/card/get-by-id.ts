import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class GetById extends BaseCommand<typeof GetById> {
  static description = "Show card details by ID";

  protected defaultOutput = "fancy" as const;

  static flags = {
    id: Flags.string({ required: true, description: "The Trello card ID" }),
  };

  async run(): Promise<void> {
    const card = await this.client.cards.getCard({
      id: this.flags.id,
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
