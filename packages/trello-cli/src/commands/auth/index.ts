import { BaseCommand } from "../../BaseCommand";

export default class AuthIndex extends BaseCommand<typeof AuthIndex> {
  static description = "Manage authentication credentials";
}
