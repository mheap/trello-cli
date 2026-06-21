import { BaseCommand } from "../../BaseCommand";

export default class NotificationReadAll extends BaseCommand<typeof NotificationReadAll> {
  static description = "Mark all notifications as read";

  async run(): Promise<void> {
    const result = await this.client.notifications.markAllNotificationsAsRead();
    this.output(result);
  }
}
