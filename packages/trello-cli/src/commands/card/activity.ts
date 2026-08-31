import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardActivity extends BaseCommand<typeof CardActivity> {
  static description = "Show recent activity on a card";

  protected defaultOutput = "fancy" as const;

  static flags = {
    id: Flags.string({
      description: "The Trello card ID (alternative to --board/--list/--card)",
      exclusive: ["board", "list", "card"],
    }),
    board: Flags.string(),
    list: Flags.string(),
    card: Flags.string(),
    filter: Flags.string({
      char: "f",
      description:
        "Comma-separated list of action types to show (e.g. commentCard,updateCard). Defaults to all activity.",
    }),
  };

  async run(): Promise<void> {
    const cardId = this.flags.id ?? this.lookups.card;

    if (!cardId) {
      this.error(
        "Provide either --id or all of --board, --list, and --card",
      );
    }

    const actions = await this.client.cards.getCardActions({
      id: cardId,
      ...(this.flags.filter ? { filter: this.flags.filter } : {}),
    });
    this.output(actions);
  }

  protected toData(data: any) {
    return data.map((action: any) => ({
      id: action.id,
      type: action.type,
      author: action.memberCreator?.fullName,
      date: action.date,
      text: action.data?.text,
      card: action.data?.card?.name,
      list: action.data?.list?.name,
      board: action.data?.board?.name,
    }));
  }

  protected async format(data: any): Promise<string> {
    if (data.length === 0) {
      return "No activity";
    }
    return data
      .map((a: any) => {
        const context = [a.list, a.card, a.board].filter(Boolean).join(" / ");
        const summary = context ? ` (${context})` : "";
        const text = a.text ? ` - ${a.text}` : "";
        return `${a.date} ${a.author}: ${a.type}${summary}${text}`;
      })
      .join("\n");
  }
}
