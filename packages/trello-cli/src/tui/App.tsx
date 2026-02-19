import React from "react";
import { Box } from "ink";
import { TrelloClient } from "trello.js";
import Cache from "@trello-cli/cache";
import { TrelloProvider } from "./state/TrelloContext";
import { NavigationProvider, useNavigation } from "./state/NavigationContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomeView } from "./views/HomeView";
import { BoardView } from "./views/BoardView";
import { CardDetailView } from "./views/CardDetailView";
import { MyCardsView } from "./views/MyCardsView";
import { usePeriodicSync } from "./hooks/usePeriodicSync";
import { useTerminalSize } from "./hooks/useTerminalSize";
import { TuiConfig } from "./types";

interface AppProps {
  client: TrelloClient;
  cache: Cache;
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
