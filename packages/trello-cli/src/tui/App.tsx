import React from "react";
import { Box } from "ink";
import { TrelloClient } from "trello.js";
import type CacheModule from "@trello-cli/cache";
import { TrelloProvider } from "./state/TrelloContext.js";
import { NavigationProvider, useNavigation } from "./state/NavigationContext.js";
import { Header } from "./components/Header.js";
import { Footer } from "./components/Footer.js";
import { HomeView } from "./views/HomeView.js";
import { BoardView } from "./views/BoardView.js";
import { CardDetailView } from "./views/CardDetailView.js";
import { MyCardsView } from "./views/MyCardsView.js";
import { usePeriodicSync } from "./hooks/usePeriodicSync.js";
import { useTerminalSize } from "./hooks/useTerminalSize.js";
import { TuiConfig } from "./types.js";

interface AppProps {
  client: TrelloClient;
  cache: InstanceType<typeof CacheModule.default>;
  config: TuiConfig;
}

function ViewRouter() {
  const { state, config } = useNavigation();
  const { rows: termHeight } = useTerminalSize();

  // Set up periodic sync
  usePeriodicSync(config.syncIntervalMs);

  return (
    <Box flexDirection="column" height={termHeight}>
      {state.view !== "card-detail" && <Header />}

      <Box flexDirection="column" flexGrow={1} paddingY={1}>
        {state.view === "home" && <HomeView />}
        {state.view === "board" && <BoardView />}
        {state.view === "card-detail" && <CardDetailView />}
        {state.view === "my-cards" && <MyCardsView />}
      </Box>

      <Footer />
    </Box>
  );
}

export function App({ client, cache, config }: AppProps) {
  return (
    <TrelloProvider client={client} cache={cache}>
      <NavigationProvider config={config}>
        <ViewRouter />
      </NavigationProvider>
    </TrelloProvider>
  );
}
