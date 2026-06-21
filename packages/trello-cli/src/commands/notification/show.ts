import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class NotificationShow extends BaseCommand<typeof NotificationShow> {
  static description = "Show a single notification";

  protected defaultOutput = "fancy" as const;

  static flags = {
    id: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const notification = await this.client.notifications.getNotification({
      id: this.flags.id,
      board: true,
      card: true,
      memberCreator: true,
    });
    this.output(notification);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      type: data.type,
      unread: data.unread,
      date: data.date,
      creator: data.memberCreator?.fullName,
      board: data.board?.name,
      card: data.card?.name,
      data: data.data,
    };
  }

  protected async format(data: any): Promise<string> {
    return [
      `ID:      ${data.id}`,
      `Type:    ${data.type}`,
      `Unread:  ${data.unread}`,
      `Date:    ${data.date}`,
      `Creator: ${data.creator ?? ""}`,
      `Board:   ${data.board ?? ""}`,
      `Card:    ${data.card ?? ""}`,
    ].join("\n");
  }
}
