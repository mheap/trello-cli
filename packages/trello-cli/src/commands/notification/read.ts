import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class NotificationRead extends BaseCommand<typeof NotificationRead> {
  static description = "Mark a notification as read";

  static flags = {
    id: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const result = await this.client.notifications.updateNotification({
      id: this.flags.id,
      unread: false,
    });
    this.output(result);
  }
}
