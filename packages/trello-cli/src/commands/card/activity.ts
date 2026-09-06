import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class CardActivity extends BaseCommand<typeof CardActivity> {
  static description = "Show recent activity on a card";
  static selectorTarget = "card" as const;

  protected defaultOutput = "fancy" as const;

  static flags = {
    ...cardSelectorFlags(),
    filter: Flags.string({
      char: "f",
      description:
        "Comma-separated list of action types to show (e.g. commentCard,updateCard). Defaults to all activity.",
    }),
  };

  async run(): Promise<void> {
    const actions = await this.client.cards.getCardActions({
      id: this.lookups.card,
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
