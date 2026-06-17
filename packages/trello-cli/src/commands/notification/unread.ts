import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class NotificationUnread extends BaseCommand<typeof NotificationUnread> {
  static description = "Mark a notification as unread";

  static flags = {
    id: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const result = await this.client.notifications.updateNotification({
      id: this.flags.id,
      unread: true,
    });
    this.output(result);
  }
}
