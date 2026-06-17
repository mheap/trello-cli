import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class NotificationList extends BaseCommand<typeof NotificationList> {
  static description = "List your notifications";

  protected defaultOutput = "fancy" as const;

  static flags = {
    filter: Flags.option({
      options: ["all", "read", "unread"] as const,
      default: "all",
    })(),
    limit: Flags.integer({ default: 50 }),
  };

  async run(): Promise<void> {
    const notifications = await this.client.members.getMemberNotifications({
      id: "me",
      readFilter: this.flags.filter,
      limit: this.flags.limit,
      memberCreator: true,
    });
    this.output(notifications);
  }

  protected toData(data: any) {
    return data.map((n: any) => ({
      id: n.id,
      type: n.type,
      unread: n.unread,
      date: n.date,
      creator: n.memberCreator?.fullName,
      summary: n.data?.text || n.data?.card?.name || n.data?.board?.name || "",
    }));
  }

  protected async format(data: any): Promise<string> {
    if (data.length === 0) {
      return "No notifications";
    }
    return data
      .map((n: any) => {
        const status = n.unread ? "[unread]" : "[read]  ";
        return `${status} ${n.date} ${n.type} - ${n.creator ?? ""}: ${n.summary} (id: ${n.id})`;
      })
      .join("\n");
  }
}
